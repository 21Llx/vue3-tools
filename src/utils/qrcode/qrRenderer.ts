/**
 * 二维码渲染工具：把模块矩阵绘制到 Canvas、导出 SVG，以及下载 PNG / SVG。
 */
import type { QrCode } from './qrcode';

export interface QrRenderOptions {
  /** 输出边长（CSS 像素），默认 240。 */
  size?: number;
  /** 静区宽度（模块数），默认 4。 */
  margin?: number;
  /** 前景色，默认 '#111827'。 */
  dark?: string;
  /** 背景色，设为 'transparent' 可导出透明背景，默认 '#ffffff'。 */
  light?: string;
  /** 设备像素比，默认取 window.devicePixelRatio。 */
  pixelRatio?: number;
}

export interface QrDownloadOptions extends QrRenderOptions {
  /** 文件名（不含扩展名），默认 'qrcode'。 */
  fileName?: string;
}

const DEFAULT_SIZE = 240;
const DEFAULT_MARGIN = 4;
const DEFAULT_DARK = '#111827';
const DEFAULT_LIGHT = '#ffffff';

function normalizeMargin(margin: number | undefined): number {
  return Math.max(0, Math.floor(margin ?? DEFAULT_MARGIN));
}

/**
 * 把二维码绘制到 Canvas。
 *
 * 模块边界会对齐到物理像素，保证在高分屏下依然清晰锐利。
 */
export function drawQrToCanvas(
  canvas: HTMLCanvasElement,
  qr: QrCode,
  options: QrRenderOptions = {},
): void {
  const size = options.size ?? DEFAULT_SIZE;
  const margin = normalizeMargin(options.margin);
  const dark = options.dark ?? DEFAULT_DARK;
  const light = options.light ?? DEFAULT_LIGHT;
  const ratio =
    options.pixelRatio ??
    (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

  const count = qr.size + margin * 2;
  const pixels = Math.max(1, Math.round(size * ratio));

  canvas.width = pixels;
  canvas.height = pixels;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('当前环境不支持 Canvas 2D');
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, pixels, pixels);

  if (light !== 'transparent') {
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, pixels, pixels);
  }

  const unit = pixels / count;
  const edge = (index: number) => Math.round(index * unit);

  ctx.fillStyle = dark;
  for (let y = 0; y < qr.size; y += 1) {
    const top = edge(y + margin);
    const bottom = edge(y + margin + 1);
    for (let x = 0; x < qr.size; x += 1) {
      if (!qr.isDark(x, y)) {
        continue;
      }
      const left = edge(x + margin);
      const right = edge(x + margin + 1);
      ctx.fillRect(left, top, right - left, bottom - top);
    }
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** 生成 SVG 字符串（矢量，适合印刷或无损缩放）。 */
export function toSvgString(qr: QrCode, options: QrRenderOptions = {}): string {
  const size = options.size ?? DEFAULT_SIZE;
  const margin = normalizeMargin(options.margin);
  const dark = options.dark ?? DEFAULT_DARK;
  const light = options.light ?? DEFAULT_LIGHT;
  const count = qr.size + margin * 2;

  let path = '';
  for (let y = 0; y < qr.size; y += 1) {
    let x = 0;
    while (x < qr.size) {
      if (!qr.isDark(x, y)) {
        x += 1;
        continue;
      }
      let end = x + 1;
      while (end < qr.size && qr.isDark(end, y)) {
        end += 1;
      }
      path += `M${x + margin} ${y + margin}h${end - x}v1h-${end - x}z`;
      x = end;
    }
  }

  const background =
    light === 'transparent'
      ? ''
      : `<rect width="${count}" height="${count}" fill="${escapeXml(light)}"/>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" ` +
    `viewBox="0 0 ${count} ${count}" shape-rendering="crispEdges" role="img" aria-label="二维码">` +
    `${background}<path d="${path}" fill="${escapeXml(dark)}"/></svg>`
  );
}

function ensureExtension(fileName: string, extension: string): string {
  const clean = fileName.trim() || 'qrcode';
  return clean.toLowerCase().endsWith(`.${extension}`) ? clean : `${clean}.${extension}`;
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 下载 PNG（默认导出 1024px，保证打印与扫码清晰度）。 */
export async function downloadQrCodeAsPng(
  qr: QrCode,
  options: QrDownloadOptions = {},
): Promise<void> {
  const canvas = document.createElement('canvas');
  drawQrToCanvas(canvas, qr, {
    ...options,
    size: options.size ?? 1024,
    pixelRatio: 1,
  });

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
  if (!blob) {
    throw new Error('导出 PNG 失败');
  }
  triggerDownload(blob, ensureExtension(options.fileName ?? 'qrcode', 'png'));
}

/** 下载 SVG（矢量格式）。 */
export function downloadQrCodeAsSvg(
  qr: QrCode,
  options: QrDownloadOptions = {},
): void {
  const svg = toSvgString(qr, { ...options, size: options.size ?? 1024 });
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  triggerDownload(blob, ensureExtension(options.fileName ?? 'qrcode', 'svg'));
}
