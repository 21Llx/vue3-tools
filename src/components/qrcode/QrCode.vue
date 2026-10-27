<template>
  <div class="qr-code" :style="rootStyle">
    <canvas
      v-if="qr"
      ref="canvasRef"
      class="qr-code__canvas"
      role="img"
      :aria-label="ariaLabel"
    ></canvas>
    <div v-else class="qr-code__placeholder">
      <span class="qr-code__placeholder-mark">QR</span>
      <span class="qr-code__placeholder-text">
        {{ errorMessage || '等待输入内容' }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import {
  createQrCode,
  QrEncodeError,
  type QrCode,
  type QrErrorCorrectionLevel,
} from '@/utils/qrcode/qrcode';
import {
  drawQrToCanvas,
  downloadQrCodeAsPng,
  downloadQrCodeAsSvg,
  toSvgString,
} from '@/utils/qrcode/qrRenderer';

const props = withDefaults(
  defineProps<{
    /** 要编码的内容。 */
    value: string;
    /** 显示边长（像素）。 */
    size?: number;
    /** 纠错等级。 */
    level?: QrErrorCorrectionLevel;
    /** 静区宽度（模块数）。 */
    margin?: number;
    /** 前景色。 */
    dark?: string;
    /** 背景色，'transparent' 表示透明。 */
    light?: string;
    /** 下载文件名前缀。 */
    fileName?: string;
  }>(),
  {
    size: 240,
    level: 'M',
    margin: 4,
    dark: '#111827',
    light: '#ffffff',
    fileName: 'qrcode',
  },
);

const emit = defineEmits<{
  generated: [qr: QrCode];
  error: [message: string];
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);

const encoded = computed<{ qr: QrCode | null; error: string }>(() => {
  if (!props.value) {
    return { qr: null, error: '' };
  }
  try {
    return {
      qr: createQrCode(props.value, { errorCorrectionLevel: props.level }),
      error: '',
    };
  } catch (error) {
    return {
      qr: null,
      error: error instanceof QrEncodeError ? error.message : '二维码生成失败',
    };
  }
});

const qr = computed(() => encoded.value.qr);
const errorMessage = computed(() => encoded.value.error);

const rootStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
}));

const ariaLabel = computed(() => `二维码：${props.value.slice(0, 40)}`);

function render() {
  const canvas = canvasRef.value;
  if (!canvas || !qr.value) {
    return;
  }
  drawQrToCanvas(canvas, qr.value, {
    size: props.size,
    margin: props.margin,
    dark: props.dark,
    light: props.light,
  });
}

watch(
  encoded,
  (value) => {
    if (value.qr) {
      emit('generated', value.qr);
    } else if (value.error) {
      emit('error', value.error);
    }
  },
  { immediate: true },
);

watch(
  [qr, () => props.size, () => props.margin, () => props.dark, () => props.light],
  () => nextTick(render),
);

onMounted(render);

/** 获取当前的编码结果。 */
function getQrCode(): QrCode | null {
  return qr.value;
}

/** 获取当前二维码的 SVG 字符串。 */
function getSvgString(): string {
  if (!qr.value) {
    return '';
  }
  return toSvgString(qr.value, {
    size: props.size,
    margin: props.margin,
    dark: props.dark,
    light: props.light,
  });
}

/** 下载 PNG 或 SVG。 */
async function download(format: 'png' | 'svg' = 'png'): Promise<void> {
  const value = qr.value;
  if (!value) {
    throw new Error(errorMessage.value || '当前没有可下载的二维码');
  }
  const suffix = `v${value.version}-${value.errorCorrectionLevel}`;
  const fileName = `${props.fileName}-${suffix}`;
  const options = {
    margin: props.margin,
    dark: props.dark,
    light: props.light,
    fileName,
  };

  if (format === 'svg') {
    downloadQrCodeAsSvg(value, options);
    return;
  }
  await downloadQrCodeAsPng(value, options);
}

defineExpose({ getQrCode, getSvgString, download });
</script>

<style lang="less" scoped>
.qr-code {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: transparent;

  &__canvas {
    display: block;
    max-width: 100%;
    max-height: 100%;
  }

  &__placeholder {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: 20px;
    color: #8b91a7;
    text-align: center;
    background: #f6f7fb;
    border: 1px dashed #d7dbea;
    border-radius: 12px;
  }

  &__placeholder-mark {
    font-size: 26px;
    font-weight: 700;
    letter-spacing: 3px;
    color: #c3c8dc;
  }

  &__placeholder-text {
    font-size: 12px;
    line-height: 1.6;
  }
}
</style>
