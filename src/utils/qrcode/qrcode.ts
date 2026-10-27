/**
 * 二维码（QR Code）生成器 —— 纯 TypeScript 实现，不依赖任何第三方库。
 *
 * 覆盖 ISO/IEC 18004 的主要内容：
 * - 数字 / 字母数字 / 字节（UTF-8，支持中文）三种编码模式；
 * - L / M / Q / H 四种纠错等级；
 * - 版本 1-40 自动选择（也可手动指定）；
 * - Reed-Solomon 纠错、分块与交织；
 * - 定位/校正/定时图形、格式信息与版本信息的 BCH 编码；
 * - 8 种掩码按标准罚分自动选择（也可手动指定）。
 */
import {
  ECC_CODEWORDS_PER_BLOCK,
  NUM_ERROR_CORRECTION_BLOCKS,
} from './qrTables';

export type QrErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';
export type QrEncodingMode = 'numeric' | 'alphanumeric' | 'byte';

export interface QrCodeOptions {
  /** 纠错等级，默认 'M'。 */
  errorCorrectionLevel?: QrErrorCorrectionLevel;
  /** 指定版本 1-40；不传或传 0 表示自动选择能容纳内容的最小版本。 */
  version?: number;
  /** 指定掩码 0-7；不传或传 -1 表示按标准罚分自动选择。 */
  mask?: number;
}

export interface QrCode {
  readonly text: string;
  readonly version: number;
  readonly errorCorrectionLevel: QrErrorCorrectionLevel;
  readonly mask: number;
  readonly mode: QrEncodingMode;
  /** 模块数（不含静区），等于 version * 4 + 17。 */
  readonly size: number;
  /** 数据码字数（含填充码字）。 */
  readonly dataCodewords: number;
  /** 内容编码实际占用的比特数（含模式与长度指示符，不含填充）。 */
  readonly usedBits: number;
  /** 数据区总比特数。 */
  readonly capacityBits: number;
  /** modules[y][x] 为 true 表示黑色模块。 */
  readonly modules: readonly (readonly boolean[])[];
  isDark(x: number, y: number): boolean;
}

/** 生成二维码时的可预期错误（内容为空、内容过长、参数非法等）。 */
export class QrEncodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QrEncodeError';
  }
}

const LEVELS: readonly QrErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H'];
const LEVEL_INDEX: Record<QrErrorCorrectionLevel, number> = { L: 0, M: 1, Q: 2, H: 3 };
/** 格式信息中纠错等级的两比特编码（注意 Q / H 的顺序）。 */
const LEVEL_FORMAT_BITS: Record<QrErrorCorrectionLevel, number> = { L: 1, M: 0, Q: 3, H: 2 };

const MODE_INDICATOR: Record<QrEncodingMode, number> = {
  numeric: 0x1,
  alphanumeric: 0x2,
  byte: 0x4,
};
/** 字符计数指示符长度：版本 1-9 / 10-26 / 27-40。 */
const CHAR_COUNT_BITS: Record<QrEncodingMode, readonly number[]> = {
  numeric: [10, 12, 14],
  alphanumeric: [9, 11, 13],
  byte: [8, 16, 16],
};

const ALPHANUMERIC_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
const ALPHANUMERIC_MAP = new Map<string, number>(
  Array.from(ALPHANUMERIC_CHARSET).map((char, index) => [char, index]),
);

/** 追加比特的缓冲区。 */
class BitBuffer {
  readonly bits: number[] = [];

  get length(): number {
    return this.bits.length;
  }

  /** 把 value 的低 length 位按高位在前追加。 */
  append(value: number, length: number): void {
    for (let i = length - 1; i >= 0; i -= 1) {
      this.bits.push((value >>> i) & 1);
    }
  }

  toBytes(): Uint8Array {
    if (this.bits.length % 8 !== 0) {
      throw new Error('比特流未按字节对齐');
    }
    const bytes = new Uint8Array(this.bits.length / 8);
    for (let i = 0; i < this.bits.length; i += 1) {
      if (this.bits[i]) {
        bytes[i >>> 3] |= 0x80 >>> (i & 7);
      }
    }
    return bytes;
  }
}

function getBit(value: number, index: number): boolean {
  return ((value >>> index) & 1) !== 0;
}

/** 数据区可用的原始模块数（含填充位，未扣除功能图形）。 */
function getNumRawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (version >= 7) {
      result -= 36;
    }
  }
  return result;
}

/** 数据码字数（扣除纠错码字后的容量）。 */
export function getDataCodewords(version: number, level: QrErrorCorrectionLevel): number {
  const rawCodewords = Math.floor(getNumRawDataModules(version) / 8);
  const index = LEVEL_INDEX[level];
  return (
    rawCodewords -
    ECC_CODEWORDS_PER_BLOCK[version - 1][index] *
      NUM_ERROR_CORRECTION_BLOCKS[version - 1][index]
  );
}

/** 数据区总比特数。 */
export function getDataCapacityBits(version: number, level: QrErrorCorrectionLevel): number {
  return getDataCodewords(version, level) * 8;
}

function getCharCountBits(mode: QrEncodingMode, version: number): number {
  const group = version <= 9 ? 0 : version <= 26 ? 1 : 2;
  return CHAR_COUNT_BITS[mode][group];
}

function normalizeLevel(level: QrErrorCorrectionLevel | undefined): QrErrorCorrectionLevel {
  const value = level ?? 'M';
  if (!LEVELS.includes(value)) {
    throw new QrEncodeError(`未知的纠错等级：${String(value)}`);
  }
  return value;
}

function normalizeVersion(version: number | undefined): number {
  const value = version ?? 0;
  if (!Number.isInteger(value) || value < 0 || value > 40) {
    throw new QrEncodeError('版本号必须是 0-40 之间的整数');
  }
  return value;
}

function normalizeMask(mask: number | undefined): number {
  const value = mask ?? -1;
  if (!Number.isInteger(value) || value < -1 || value > 7) {
    throw new QrEncodeError('掩码必须是 -1 到 7 之间的整数');
  }
  return value;
}

interface AnalyzedText {
  mode: QrEncodingMode;
  bytes: Uint8Array | null;
  charCount: number;
  payloadBits: number;
}

function isAlphanumeric(text: string): boolean {
  for (const char of text) {
    if (!ALPHANUMERIC_MAP.has(char)) {
      return false;
    }
  }
  return true;
}

function numericPayloadBits(length: number): number {
  return Math.floor(length / 3) * 10 + [0, 4, 7][length % 3];
}

function analyzeText(text: string): AnalyzedText {
  if (text.length === 0) {
    throw new QrEncodeError('内容不能为空');
  }
  if (/^[0-9]+$/.test(text)) {
    return {
      mode: 'numeric',
      bytes: null,
      charCount: text.length,
      payloadBits: numericPayloadBits(text.length),
    };
  }
  if (isAlphanumeric(text)) {
    return {
      mode: 'alphanumeric',
      bytes: null,
      charCount: text.length,
      payloadBits: Math.floor(text.length / 2) * 11 + (text.length % 2) * 6,
    };
  }
  const bytes = new TextEncoder().encode(text);
  return {
    mode: 'byte',
    bytes,
    charCount: bytes.length,
    payloadBits: bytes.length * 8,
  };
}

function pickVersion(
  requestedVersion: number,
  mode: QrEncodingMode,
  payloadBits: number,
  level: QrErrorCorrectionLevel,
): number {
  const start = requestedVersion > 0 ? requestedVersion : 1;
  const end = requestedVersion > 0 ? requestedVersion : 40;

  for (let version = start; version <= end; version += 1) {
    const requiredBits = 4 + getCharCountBits(mode, version) + payloadBits;
    if (requiredBits <= getDataCapacityBits(version, level)) {
      return version;
    }
  }

  if (requestedVersion > 0) {
    throw new QrEncodeError(
      `版本 ${requestedVersion} 容纳不下当前内容（纠错等级 ${level}），请增加版本或减少内容`,
    );
  }
  throw new QrEncodeError(`内容过长，超出二维码容量（纠错等级 ${level}），请减少内容或降低纠错等级`);
}

/** 生成数据码字（模式指示符 + 字符计数 + 内容 + 终止符 + 填充）。 */
function buildDataCodewords(
  text: string,
  analysis: AnalyzedText,
  version: number,
  level: QrErrorCorrectionLevel,
): { codewords: Uint8Array; usedBits: number; capacityBits: number } {
  const { mode, bytes, charCount } = analysis;
  const capacityBits = getDataCapacityBits(version, level);
  const buffer = new BitBuffer();

  buffer.append(MODE_INDICATOR[mode], 4);
  buffer.append(charCount, getCharCountBits(mode, version));

  if (mode === 'numeric') {
    for (let i = 0; i < text.length; i += 3) {
      const chunk = text.slice(i, i + 3);
      buffer.append(Number.parseInt(chunk, 10), chunk.length === 3 ? 10 : chunk.length === 2 ? 7 : 4);
    }
  } else if (mode === 'alphanumeric') {
    for (let i = 0; i < text.length; i += 2) {
      if (i + 1 < text.length) {
        const first = ALPHANUMERIC_MAP.get(text[i]) ?? 0;
        const second = ALPHANUMERIC_MAP.get(text[i + 1]) ?? 0;
        buffer.append(first * 45 + second, 11);
      } else {
        buffer.append(ALPHANUMERIC_MAP.get(text[i]) ?? 0, 6);
      }
    }
  } else {
    for (const byte of bytes ?? []) {
      buffer.append(byte, 8);
    }
  }

  const usedBits = buffer.length;
  // 终止符最多 4 位
  buffer.append(0, Math.min(4, capacityBits - usedBits));
  // 补齐到字节边界
  buffer.append(0, (8 - (buffer.length % 8)) % 8);
  // 交替填充 0xEC / 0x11 直到填满数据容量
  let padByte = 0xec;
  while (buffer.length < capacityBits) {
    buffer.append(padByte, 8);
    padByte = padByte === 0xec ? 0x11 : 0xec;
  }

  return { codewords: buffer.toBytes(), usedBits, capacityBits };
}

/** GF(256) 乘法，既约多项式 0x11D。 */
function reedSolomonMultiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

/** 计算 degree 次的 Reed-Solomon 生成多项式（省略最高次项，系数升序）。 */
function reedSolomonComputeDivisor(degree: number): Uint8Array {
  if (degree < 1 || degree > 255) {
    throw new Error('纠错码字数超出范围');
  }
  const result = new Uint8Array(degree);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < degree; j += 1) {
      result[j] = reedSolomonMultiply(result[j], root);
      if (j + 1 < degree) {
        result[j] ^= result[j + 1];
      }
    }
    root = reedSolomonMultiply(root, 0x02);
  }
  return result;
}

/** 计算数据码字的 Reed-Solomon 余数（即纠错码字）。 */
function reedSolomonComputeRemainder(data: readonly number[], divisor: Uint8Array): Uint8Array {
  const result = new Uint8Array(divisor.length);
  for (const byte of data) {
    const factor = byte ^ result[0];
    result.copyWithin(0, 1);
    result[result.length - 1] = 0;
    for (let i = 0; i < result.length; i += 1) {
      result[i] ^= reedSolomonMultiply(divisor[i], factor);
    }
  }
  return result;
}

/** 按标准把数据分块、计算纠错码并交织成最终码字序列。 */
function addEccAndInterleave(
  data: Uint8Array,
  version: number,
  level: QrErrorCorrectionLevel,
): Uint8Array {
  const levelIndex = LEVEL_INDEX[level];
  const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[version - 1][levelIndex];
  const blockEccLength = ECC_CODEWORDS_PER_BLOCK[version - 1][levelIndex];
  const rawCodewords = Math.floor(getNumRawDataModules(version) / 8);
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
  const shortBlockLength = Math.floor(rawCodewords / numBlocks);
  const shortDataLength = shortBlockLength - blockEccLength;

  const divisor = reedSolomonComputeDivisor(blockEccLength);
  const blocks: number[][] = [];

  let offset = 0;
  for (let i = 0; i < numBlocks; i += 1) {
    const dataLength = shortDataLength + (i < numShortBlocks ? 0 : 1);
    const dataBlock = Array.from(data.subarray(offset, offset + dataLength));
    offset += dataLength;

    const ecc = reedSolomonComputeRemainder(dataBlock, divisor);
    if (i < numShortBlocks) {
      dataBlock.push(0); // 短块补一个占位，交织时跳过
    }
    blocks.push([...dataBlock, ...ecc]);
  }

  const result = new Uint8Array(rawCodewords);
  let resultIndex = 0;
  for (let i = 0; i < blocks[0].length; i += 1) {
    for (let j = 0; j < blocks.length; j += 1) {
      if (i !== shortDataLength || j >= numShortBlocks) {
        result[resultIndex] = blocks[j][i];
        resultIndex += 1;
      }
    }
  }
  return result;
}

/** 校正图形中心坐标。 */
function getAlignmentPatternPositions(version: number): number[] {
  if (version === 1) {
    return [];
  }
  const size = version * 4 + 17;
  const numAlign = Math.floor(version / 7) + 2;
  const step =
    version === 32 ? 26 : Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;

  const result: number[] = [6];
  for (let pos = size - 7; result.length < numAlign; pos -= step) {
    result.splice(1, 0, pos);
  }
  return result;
}

interface MatrixResult {
  modules: boolean[][];
  mask: number;
}

/** 构建最终模块矩阵（功能图形 + 数据 + 掩码 + 格式/版本信息）。 */
function buildMatrix(
  version: number,
  level: QrErrorCorrectionLevel,
  codewords: Uint8Array,
  requestedMask: number,
): MatrixResult {
  const size = version * 4 + 17;
  const modules: boolean[][] = Array.from({ length: size }, () =>
    new Array<boolean>(size).fill(false),
  );
  const isFunction: boolean[][] = Array.from({ length: size }, () =>
    new Array<boolean>(size).fill(false),
  );

  function setFunctionModule(x: number, y: number, dark: boolean): void {
    modules[y][x] = dark;
    isFunction[y][x] = true;
  }

  function drawFinderPattern(centerX: number, centerY: number): void {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        const x = centerX + dx;
        const y = centerY + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) {
          setFunctionModule(x, y, distance !== 2 && distance !== 4);
        }
      }
    }
  }

  function drawAlignmentPattern(centerX: number, centerY: number): void {
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        setFunctionModule(
          centerX + dx,
          centerY + dy,
          Math.max(Math.abs(dx), Math.abs(dy)) !== 1,
        );
      }
    }
  }

  function drawFormatBits(mask: number): void {
    const data = (LEVEL_FORMAT_BITS[level] << 3) | mask;
    let remainder = data;
    for (let i = 0; i < 10; i += 1) {
      remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
    }
    const bits = ((data << 10) | remainder) ^ 0x5412;

    // 左上角副本
    for (let i = 0; i <= 5; i += 1) {
      setFunctionModule(8, i, getBit(bits, i));
    }
    setFunctionModule(8, 7, getBit(bits, 6));
    setFunctionModule(8, 8, getBit(bits, 7));
    setFunctionModule(7, 8, getBit(bits, 8));
    for (let i = 9; i < 15; i += 1) {
      setFunctionModule(14 - i, 8, getBit(bits, i));
    }

    // 右上 / 左下副本
    for (let i = 0; i < 8; i += 1) {
      setFunctionModule(size - 1 - i, 8, getBit(bits, i));
    }
    for (let i = 8; i < 15; i += 1) {
      setFunctionModule(8, size - 15 + i, getBit(bits, i));
    }
    // 固定的黑模块
    setFunctionModule(8, size - 8, true);
  }

  function drawVersion(): void {
    if (version < 7) {
      return;
    }
    let remainder = version;
    for (let i = 0; i < 12; i += 1) {
      remainder = (remainder << 1) ^ ((remainder >>> 11) * 0x1f25);
    }
    const bits = (version << 12) | remainder;

    for (let i = 0; i < 18; i += 1) {
      const bit = getBit(bits, i);
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFunctionModule(a, b, bit);
      setFunctionModule(b, a, bit);
    }
  }

  function drawFunctionPatterns(): void {
    // 定时图形
    for (let i = 0; i < size; i += 1) {
      setFunctionModule(6, i, i % 2 === 0);
      setFunctionModule(i, 6, i % 2 === 0);
    }

    // 三个定位图形（含分隔符）
    drawFinderPattern(3, 3);
    drawFinderPattern(size - 4, 3);
    drawFinderPattern(3, size - 4);

    // 校正图形
    const positions = getAlignmentPatternPositions(version);
    const count = positions.length;
    for (let i = 0; i < count; i += 1) {
      for (let j = 0; j < count; j += 1) {
        const overlapsFinder =
          (i === 0 && j === 0) ||
          (i === 0 && j === count - 1) ||
          (i === count - 1 && j === 0);
        if (!overlapsFinder) {
          drawAlignmentPattern(positions[i], positions[j]);
        }
      }
    }

    // 先占位，掩码确定后重绘
    drawFormatBits(0);
    drawVersion();
  }

  function drawCodewords(data: Uint8Array): void {
    let bitIndex = 0;
    const totalBits = data.length * 8;

    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) {
        right = 5;
      }
      for (let vertical = 0; vertical < size; vertical += 1) {
        for (let j = 0; j < 2; j += 1) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? size - 1 - vertical : vertical;
          if (!isFunction[y][x] && bitIndex < totalBits) {
            modules[y][x] = getBit(data[bitIndex >>> 3], 7 - (bitIndex & 7));
            bitIndex += 1;
          }
        }
      }
    }
  }

  function applyMask(mask: number): void {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        if (isFunction[y][x]) {
          continue;
        }
        let invert: boolean;
        switch (mask) {
          case 0:
            invert = (x + y) % 2 === 0;
            break;
          case 1:
            invert = y % 2 === 0;
            break;
          case 2:
            invert = x % 3 === 0;
            break;
          case 3:
            invert = (x + y) % 3 === 0;
            break;
          case 4:
            invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
            break;
          case 5:
            invert = ((x * y) % 2) + ((x * y) % 3) === 0;
            break;
          case 6:
            invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
            break;
          default:
            invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
            break;
        }
        if (invert) {
          modules[y][x] = !modules[y][x];
        }
      }
    }
  }

  function finderPenaltyAddHistory(runLength: number, history: number[]): void {
    let length = runLength;
    if (history[0] === 0) {
      length += size; // 初始连续段要加上外侧的浅色静区
    }
    history.pop();
    history.unshift(length);
  }

  function finderPenaltyCountPatterns(history: readonly number[]): number {
    const n = history[1];
    const core = n > 0 && history[2] === n && history[3] === n * 3 && history[4] === n && history[5] === n;
    return (
      (core && history[0] >= n * 4 && history[6] >= n ? 1 : 0) +
      (core && history[6] >= n * 4 && history[0] >= n ? 1 : 0)
    );
  }

  function finderPenaltyTerminateAndCount(
    runColor: boolean,
    runLength: number,
    history: number[],
  ): number {
    let length = runLength;
    if (runColor) {
      finderPenaltyAddHistory(length, history);
      length = 0;
    }
    length += size;
    finderPenaltyAddHistory(length, history);
    return finderPenaltyCountPatterns(history);
  }

  function getPenaltyScore(): number {
    const penaltyN1 = 3;
    const penaltyN2 = 3;
    const penaltyN3 = 40;
    const penaltyN4 = 10;
    let result = 0;

    // 规则 1：同色连续段
    for (let y = 0; y < size; y += 1) {
      let runColor = false;
      let runLength = 0;
      const history = [0, 0, 0, 0, 0, 0, 0];
      for (let x = 0; x < size; x += 1) {
        if (modules[y][x] === runColor) {
          runLength += 1;
          if (runLength === 5) {
            result += penaltyN1;
          } else if (runLength > 5) {
            result += 1;
          }
        } else {
          finderPenaltyAddHistory(runLength, history);
          if (!runColor) {
            result += finderPenaltyCountPatterns(history) * penaltyN3;
          }
          runColor = modules[y][x];
          runLength = 1;
        }
      }
      result += finderPenaltyTerminateAndCount(runColor, runLength, history) * penaltyN3;
    }

    for (let x = 0; x < size; x += 1) {
      let runColor = false;
      let runLength = 0;
      const history = [0, 0, 0, 0, 0, 0, 0];
      for (let y = 0; y < size; y += 1) {
        if (modules[y][x] === runColor) {
          runLength += 1;
          if (runLength === 5) {
            result += penaltyN1;
          } else if (runLength > 5) {
            result += 1;
          }
        } else {
          finderPenaltyAddHistory(runLength, history);
          if (!runColor) {
            result += finderPenaltyCountPatterns(history) * penaltyN3;
          }
          runColor = modules[y][x];
          runLength = 1;
        }
      }
      result += finderPenaltyTerminateAndCount(runColor, runLength, history) * penaltyN3;
    }

    // 规则 2：2x2 同色块
    for (let y = 0; y < size - 1; y += 1) {
      for (let x = 0; x < size - 1; x += 1) {
        const color = modules[y][x];
        if (
          color === modules[y][x + 1] &&
          color === modules[y + 1][x] &&
          color === modules[y + 1][x + 1]
        ) {
          result += penaltyN2;
        }
      }
    }

    // 规则 4：深色模块比例
    let darkCount = 0;
    for (const row of modules) {
      for (const dark of row) {
        if (dark) {
          darkCount += 1;
        }
      }
    }
    const total = size * size;
    const k = Math.ceil(Math.abs(darkCount * 20 - total * 10) / total) - 1;
    result += k * penaltyN4;

    return result;
  }

  drawFunctionPatterns();
  drawCodewords(codewords);

  let chosenMask = requestedMask;
  if (requestedMask < 0) {
    let minPenalty = Number.POSITIVE_INFINITY;
    for (let mask = 0; mask < 8; mask += 1) {
      applyMask(mask);
      drawFormatBits(mask);
      const penalty = getPenaltyScore();
      if (penalty < minPenalty) {
        minPenalty = penalty;
        chosenMask = mask;
      }
      applyMask(mask); // 撤销
    }
  }

  applyMask(chosenMask);
  drawFormatBits(chosenMask);

  return { modules, mask: chosenMask };
}

/**
 * 生成二维码模块矩阵。
 *
 * @example
 * const qr = createQrCode('https://example.com', { errorCorrectionLevel: 'M' });
 * qr.isDark(0, 0); // 左上定位图形的黑模块
 */
export function createQrCode(text: string, options: QrCodeOptions = {}): QrCode {
  if (typeof text !== 'string') {
    throw new QrEncodeError('二维码内容必须是字符串');
  }

  const level = normalizeLevel(options.errorCorrectionLevel);
  const requestedVersion = normalizeVersion(options.version);
  const requestedMask = normalizeMask(options.mask);
  const analysis = analyzeText(text);

  const version = pickVersion(requestedVersion, analysis.mode, analysis.payloadBits, level);
  const { codewords, usedBits, capacityBits } = buildDataCodewords(
    text,
    analysis,
    version,
    level,
  );
  const finalCodewords = addEccAndInterleave(codewords, version, level);
  const { modules, mask } = buildMatrix(version, level, finalCodewords, requestedMask);

  return {
    text,
    version,
    errorCorrectionLevel: level,
    mask,
    mode: analysis.mode,
    size: modules.length,
    dataCodewords: getDataCodewords(version, level),
    usedBits,
    capacityBits,
    modules,
    isDark(x: number, y: number): boolean {
      return y >= 0 && y < modules.length && x >= 0 && x < modules.length && modules[y][x];
    },
  };
}
