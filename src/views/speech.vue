<template>
  <div class="speech-page">
    <header class="speech-page__header">
      <Button type="text" class="speech-page__back" @click="goBack">← 返回</Button>
      <h1 class="speech-page__title">文字朗读</h1>
    </header>

    <main class="speech-page__main">
      <p class="speech-page__desc">输入文字后点击朗读，浏览器会使用语音合成进行播放。</p>

      <Alert
        v-if="!supported"
        type="warning"
        show-icon
        message="当前浏览器不支持语音朗读功能，请使用 Chrome、Edge 或 Safari。"
      />

      <Textarea
        v-model:value="text"
        :rows="8"
        :maxlength="2000"
        show-count
        placeholder="请输入要朗读的文字..."
        class="speech-page__textarea"
      />

      <div class="speech-page__settings">
        <div class="speech-page__setting">
          <span class="speech-page__label">语音</span>
          <Select
            v-model:value="selectedVoice"
            :options="voiceOptions"
            :disabled="!supported || !voices.length"
            placeholder="选择语音"
            class="speech-page__select"
          />
        </div>

        <div class="speech-page__setting">
          <span class="speech-page__label">语速 {{ rate.toFixed(1) }}</span>
          <Slider v-model:value="rate" :min="0.5" :max="2" :step="0.1" :disabled="!supported" />
        </div>

        <div class="speech-page__setting">
          <span class="speech-page__label">音调 {{ pitch.toFixed(1) }}</span>
          <Slider v-model:value="pitch" :min="0.5" :max="2" :step="0.1" :disabled="!supported" />
        </div>

        <div class="speech-page__setting">
          <span class="speech-page__label">音量 {{ Math.round(volume * 100) }}%</span>
          <Slider v-model:value="volume" :min="0" :max="1" :step="0.1" :disabled="!supported" />
        </div>
      </div>

      <p class="speech-page__status">
        <template v-if="speaking && !paused">正在朗读...</template>
        <template v-else-if="paused">已暂停</template>
        <template v-else>就绪</template>
      </p>

      <div class="speech-page__actions">
        <Button type="primary" size="large" :disabled="!supported || !text.trim()" @click="speak">
          朗读
        </Button>
        <Button :disabled="!supported || !speaking || paused" @click="pause">暂停</Button>
        <Button :disabled="!supported || !paused" @click="resume">继续</Button>
        <Button danger :disabled="!supported || (!speaking && !paused)" @click="stop">停止</Button>
        <Button :disabled="!text" @click="clearText">清空</Button>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Alert, Button, Input, Select, Slider } from 'ant-design-vue';
import { useSpeechSynthesis } from '@/composables/useSpeechSynthesis';

const Textarea = Input.TextArea;
const router = useRouter();

const {
  text,
  speaking,
  paused,
  supported,
  voices,
  selectedVoice,
  rate,
  pitch,
  volume,
  speak,
  pause,
  resume,
  stop,
} = useSpeechSynthesis();

const voiceOptions = computed(() =>
  voices.value.map((voice) => ({
    label: `${voice.name} (${voice.lang})`,
    value: voice.name,
  })),
);

function goBack() {
  router.push('/home');
}

function clearText() {
  stop();
  text.value = '';
}
</script>

<style lang="less" scoped>
.speech-page {
  min-height: 100vh;
  background: linear-gradient(160deg, #f0f4ff 0%, #fafafa 45%, #fff 100%);

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    border-bottom: 1px solid #f0f0f0;
    background: rgba(255, 255, 255, 0.9);
  }

  &__back {
    padding-left: 0;
  }

  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #1f1f1f;
  }

  &__main {
    max-width: 720px;
    margin: 0 auto;
    padding: 32px 24px 48px;
  }

  &__desc {
    margin: 0 0 20px;
    color: #666;
    line-height: 1.6;
  }

  &__textarea {
    margin-bottom: 24px;
  }

  &__settings {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 20px;
    padding: 20px;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  &__setting {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__label {
    font-size: 14px;
    color: #333;
    font-weight: 500;
  }

  &__select {
    width: 100%;
  }

  &__status {
    margin: 0 0 20px;
    color: #516bd9;
    font-weight: 500;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
}
</style>
