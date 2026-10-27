<template>
  <div class="line-field-page">
    <LineFieldCanvas class="line-field-page__canvas" />

    <header class="line-field-page__header">
      <Button type="text" class="line-field-page__back" @click="goBack">← 返回</Button>
      <h1 class="line-field-page__title">线条力场</h1>
    </header>

    <main class="line-field-page__content">
      <p class="line-field-page__hint">移动鼠标，附近的线条会向光标聚集</p>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { Button } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import LineFieldCanvas from '@/components/line-field/LineFieldCanvas.vue';

const router = useRouter();

function goBack() {
  router.push('/home');
}
</script>

<style lang="less" scoped>
.line-field-page {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  overflow: hidden;
  color: #e8eefc;

  &__canvas {
    position: fixed;
    inset: 0;
    z-index: 0;
  }

  &__header {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    background: linear-gradient(180deg, rgba(8, 12, 24, 0.75), rgba(8, 12, 24, 0));
  }

  &__back {
    color: #c9d7ff !important;
    padding-left: 0;
  }

  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    letter-spacing: 0.04em;
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 72px);
    pointer-events: none;
  }

  &__hint {
    margin: 0;
    padding: 10px 18px;
    border-radius: 999px;
    background: rgba(15, 22, 40, 0.55);
    border: 1px solid rgba(140, 170, 255, 0.25);
    font-size: 14px;
    color: rgba(232, 238, 252, 0.9);
    backdrop-filter: blur(8px);
  }
}
</style>
