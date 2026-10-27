<template>
  <div class="qr-page">
    <header class="qr-page__header">
      <Button type="text" @click="goBack">← 返回</Button>
    </header>

    <main class="qr-page__main">
      <div class="qr-page__heading">
        <h1 class="qr-page__title">二维码生成</h1>
        <p class="qr-page__subtitle">
          纯前端算法实现，不依赖任何二维码插件；内容只在本地编码，不会上传到服务器。
        </p>
      </div>

      <div class="qr-page__layout">
        <section class="qr-panel">
          <div class="qr-field">
            <div class="qr-field__head">
              <label class="qr-field__label" for="qr-content">内容</label>
              <span class="qr-field__hint">{{ content.length }} 字符</span>
            </div>
            <TextArea
              id="qr-content"
              v-model:value="content"
              :rows="5"
              :maxlength="2000"
              placeholder="输入网址、文本或中文内容，支持 UTF-8"
            />
            <div class="qr-field__presets">
              <button
                v-for="preset in presets"
                :key="preset.label"
                type="button"
                class="qr-preset"
                @click="applyPreset(preset)"
              >
                {{ preset.label }}
              </button>
            </div>
          </div>

          <div class="qr-field">
            <div class="qr-field__head">
              <span class="qr-field__label">纠错等级</span>
              <span class="qr-field__hint">{{ levelHint }}</span>
            </div>
            <RadioGroup v-model:value="level" class="qr-level">
              <RadioButton
                v-for="item in levelOptions"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </RadioButton>
            </RadioGroup>
          </div>

          <div class="qr-field">
            <div class="qr-field__head">
              <span class="qr-field__label">预览尺寸</span>
              <span class="qr-field__hint">{{ size }} px</span>
            </div>
            <Slider v-model:value="size" :min="160" :max="280" :step="20" />
          </div>

          <div class="qr-field qr-field--colors">
            <div class="qr-color">
              <span class="qr-field__label">前景色</span>
              <label class="qr-color__swatch" :style="{ background: dark }">
                <input
                  v-model="dark"
                  class="qr-color__input"
                  type="color"
                  aria-label="选择二维码前景色"
                />
              </label>
              <span class="qr-color__value">{{ dark.toUpperCase() }}</span>
            </div>
            <div class="qr-color">
              <span class="qr-field__label">背景色</span>
              <label class="qr-color__swatch" :style="{ background: light }">
                <input
                  v-model="light"
                  class="qr-color__input"
                  type="color"
                  aria-label="选择二维码背景色"
                />
              </label>
              <span class="qr-color__value">{{ light.toUpperCase() }}</span>
            </div>
          </div>

          <div class="qr-page__actions">
            <Button type="primary" :disabled="!meta" @click="download('png')">
              下载 PNG
            </Button>
            <Button :disabled="!meta" @click="download('svg')">下载 SVG</Button>
            <Button type="text" @click="reset">重置</Button>
          </div>
          <p class="qr-page__actions-hint">
            导出文件固定为 1024 × 1024，SVG 为矢量格式，可无损缩放
          </p>
        </section>

        <section class="qr-panel qr-panel--preview">
          <div class="qr-preview__stage">
            <div class="qr-preview__frame">
              <QrCodePreview
                ref="qrRef"
                :value="content"
                :size="previewSize"
                :level="level"
                :dark="dark"
                :light="light"
                @generated="onGenerated"
                @error="onError"
              />
            </div>
          </div>

          <div v-if="meta" class="qr-preview__meta">
            <Tag color="blue">版本 V{{ meta.version }}</Tag>
            <Tag color="green">纠错 {{ meta.errorCorrectionLevel }}</Tag>
            <Tag>{{ meta.size }} × {{ meta.size }} 模块</Tag>
            <Tag color="purple">掩码 {{ meta.mask }}</Tag>
          </div>

          <div v-if="meta" class="qr-preview__usage">
            <div class="qr-preview__usage-head">
              <span>数据占用</span>
              <span>{{ usagePercent }}%</span>
            </div>
            <div class="qr-preview__bar">
              <span :style="{ width: `${usagePercent}%` }"></span>
            </div>
            <p class="qr-preview__usage-detail">
              {{ meta.usedBits }} / {{ meta.capacityBits }} bit ·
              {{ modeLabel }} · {{ meta.dataCodewords }} 个数据码字
            </p>
          </div>

          <p v-if="errorMessage" class="qr-preview__error">{{ errorMessage }}</p>
          <p class="qr-preview__tip">{{ tipText }}</p>
        </section>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Button, Input, Radio, Slider, Tag, message } from 'ant-design-vue';
import QrCodePreview from '@/components/qrcode/QrCode.vue';
import type {
  QrCode as QrCodeData,
  QrErrorCorrectionLevel,
  QrEncodingMode,
} from '@/utils/qrcode/qrcode';

const TextArea = Input.TextArea;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const DEFAULT_CONTENT = 'https://cn.vuejs.org/guide/introduction.html';
const DEFAULT_DARK = '#1f2937';
const DEFAULT_LIGHT = '#ffffff';
const DEFAULT_SIZE = 280;

interface Preset {
  label: string;
  value: string;
}

interface LevelOption {
  value: QrErrorCorrectionLevel;
  label: string;
  hint: string;
}

const router = useRouter();

const content = ref(DEFAULT_CONTENT);
const level = ref<QrErrorCorrectionLevel>('M');
const size = ref(DEFAULT_SIZE);
const dark = ref(DEFAULT_DARK);
const light = ref(DEFAULT_LIGHT);
const meta = ref<QrCodeData | null>(null);
const errorMessage = ref('');
const qrRef = ref<InstanceType<typeof QrCodePreview>>();

const presets: Preset[] = [
  { label: '网址', value: DEFAULT_CONTENT },
  {
    label: '中文',
    value: '你好，Vue 3！这个二维码由纯 TypeScript 算法生成。',
  },
  { label: 'Wi-Fi', value: 'WIFI:T:WPA;S:MyHome;P:12345678;;' },
  {
    label: '名片',
    value: 'BEGIN:VCARD\nVERSION:3.0\nFN:张三\nTEL:13800138000\nEND:VCARD',
  },
];

const levelOptions: LevelOption[] = [
  { value: 'L', label: 'L · 7%', hint: '容错约 7%，容量最大' },
  { value: 'M', label: 'M · 15%', hint: '容错约 15%，适合大多数场景' },
  { value: 'Q', label: 'Q · 25%', hint: '容错约 25%，适合易污损场景' },
  { value: 'H', label: 'H · 30%', hint: '容错约 30%，容量最小但最稳定' },
];

const modeLabels: Record<QrEncodingMode, string> = {
  numeric: '数字模式',
  alphanumeric: '字母数字模式',
  byte: '字节模式（UTF-8）',
};

const previewSize = computed(() => Math.min(size.value, 320));

const levelHint = computed(
  () => levelOptions.find((item) => item.value === level.value)?.hint ?? '',
);

const usagePercent = computed(() => {
  if (!meta.value) {
    return 0;
  }
  const ratio = (meta.value.usedBits / meta.value.capacityBits) * 100;
  return Math.max(1, Math.min(100, Math.round(ratio)));
});

const modeLabel = computed(() =>
  meta.value ? modeLabels[meta.value.mode] : '',
);

const screenTooSmall = computed(() => {
  if (!meta.value) {
    return false;
  }
  return previewSize.value / (meta.value.size + 8) < 2;
});

const tipText = computed(() =>
  screenTooSmall.value
    ? '当前屏幕尺寸偏小，建议下载 PNG 后再扫码'
    : '用手机相机扫描即可查看内容',
);

function goBack() {
  router.push('/home');
}

function applyPreset(preset: Preset) {
  content.value = preset.value;
}

function reset() {
  content.value = DEFAULT_CONTENT;
  level.value = 'M';
  size.value = DEFAULT_SIZE;
  dark.value = DEFAULT_DARK;
  light.value = DEFAULT_LIGHT;
}

function onGenerated(qr: QrCodeData) {
  meta.value = qr;
  errorMessage.value = '';
}

function onError(text: string) {
  meta.value = null;
  errorMessage.value = text;
}

async function download(format: 'png' | 'svg') {
  if (!qrRef.value) {
    return;
  }
  try {
    await qrRef.value.download(format);
    message.success(`${format.toUpperCase()} 已开始下载`);
  } catch (error) {
    message.error(error instanceof Error ? error.message : '导出失败');
  }
}

watch(content, (value) => {
  if (!value) {
    meta.value = null;
    errorMessage.value = '';
  }
});
</script>

<style lang="less" scoped>
.qr-page {
  min-height: 100vh;
  padding: 0 20px 56px;
  background: linear-gradient(180deg, #eef2ff 0%, #f7f8fc 42%, #fff 100%);

  &__header {
    max-width: 1080px;
    margin: 0 auto;
    padding: 12px 0;
  }

  &__main {
    max-width: 1080px;
    margin: 0 auto;
  }

  &__heading {
    margin: 8px 0 26px;
  }

  &__title {
    margin: 0 0 8px;
    font-size: 28px;
    font-weight: 700;
    color: #23263b;
    letter-spacing: 0.5px;
  }

  &__subtitle {
    margin: 0;
    font-size: 14px;
    line-height: 1.7;
    color: #7b8199;
  }

  &__layout {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
    gap: 22px;
    align-items: start;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 28px;
    padding-top: 22px;
    border-top: 1px dashed #e8ebf5;

    :deep(.ant-btn) {
      height: 40px;
      padding: 0 18px;
      border-radius: 10px;
    }
  }

  &__actions-hint {
    margin: 10px 0 0;
    font-size: 11px;
    color: #9aa0b5;
  }
}

.qr-panel {
  padding: 24px;
  background: #fff;
  border: 1px solid #e9ecf6;
  border-radius: 18px;
  box-shadow: 0 12px 34px rgba(51, 65, 120, 0.07);

  &--preview {
    position: sticky;
    top: 20px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    align-items: center;
  }
}

.qr-field {
  & + & {
    margin-top: 22px;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  &__label {
    font-size: 13px;
    font-weight: 600;
    color: #3d4258;
  }

  &__hint {
    font-size: 12px;
    color: #9aa0b5;
  }

  &__presets {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }

  &--colors {
    display: flex;
    flex-wrap: wrap;
    gap: 28px;
    align-items: center;
  }

  :deep(.ant-input) {
    padding: 12px 14px;
    font-size: 14px;
    line-height: 1.7;
    border-color: #e2e6f2;
    border-radius: 12px;
    resize: none;

    &:hover,
    &:focus {
      border-color: var(--color-primary, #516bd9);
      box-shadow: none;
    }
  }
}

.qr-preset {
  padding: 5px 12px;
  font-size: 12px;
  color: #596080;
  cursor: pointer;
  background: #f5f7ff;
  border: 1px solid #e7ebfa;
  border-radius: 999px;
  transition: all 0.2s ease;

  &:hover {
    color: #516bd9;
    background: #eef2ff;
    border-color: #c9d3f7;
  }
}

.qr-level {
  display: flex;
  width: 100%;

  :deep(.ant-radio-button-wrapper) {
    flex: 1;
    height: 38px;
    padding: 0 4px;
    font-size: 12px;
    line-height: 36px;
    text-align: center;
    white-space: nowrap;
  }
}

.qr-color {
  display: flex;
  gap: 10px;
  align-items: center;

  &__swatch {
    position: relative;
    width: 32px;
    height: 32px;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 9px;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
  }

  &__input {
    position: absolute;
    inset: -6px;
    width: calc(100% + 12px);
    height: calc(100% + 12px);
    padding: 0;
    cursor: pointer;
    border: 0;
    opacity: 0;
  }

  &__value {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 12px;
    color: #7b8199;
  }
}

.qr-preview {
  &__stage {
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 4px 0 2px;
  }

  &__frame {
    display: flex;
    padding: 10px;
    background: #fff;
    border: 1px solid #eef0f8;
    border-radius: 16px;
    box-shadow: 0 10px 24px rgba(51, 65, 120, 0.1);
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;

    :deep(.ant-tag) {
      padding: 2px 10px;
      margin: 0;
      font-size: 12px;
      border-radius: 999px;
    }
  }

  &__usage {
    width: 100%;
    padding: 14px 16px;
    background: #f8f9ff;
    border-radius: 12px;
  }

  &__usage-head {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 12px;
    color: #7b8199;
  }

  &__bar {
    height: 6px;
    overflow: hidden;
    background: #e8ebf8;
    border-radius: 999px;

    span {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, #6d84ea, #516bd9);
      border-radius: inherit;
      transition: width 0.25s ease;
    }
  }

  &__usage-detail {
    margin: 8px 0 0;
    font-size: 11px;
    color: #9aa0b5;
  }

  &__error {
    width: 100%;
    padding: 10px 14px;
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    color: #c0392b;
    background: #fff2f0;
    border: 1px solid #ffd6d2;
    border-radius: 10px;
  }

  &__tip {
    margin: 0;
    font-size: 12px;
    color: #9aa0b5;
  }
}

@media (max-width: 900px) {
  .qr-page {
    padding: 0 14px 40px;

    &__title {
      font-size: 24px;
    }

    &__layout {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .qr-panel {
    padding: 20px;

    &--preview {
      position: static;
    }
  }
}
</style>
