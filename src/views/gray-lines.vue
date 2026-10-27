<template>
  <div class="gray-lines-page">
    <GrayLinesCanvas class="gray-lines-page__canvas" />

    <header class="gray-lines-page__header">
      <Button type="text" class="gray-lines-page__back" @click="goBack">← 返回</Button>
      <h1 class="gray-lines-page__title">灰度线条</h1>
    </header>

    <p class="gray-lines-page__hint">点击画面，附近线条会被推开并继续微动</p>
  </div>
</template>

<script lang="ts" setup>
import { Button } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import GrayLinesCanvas from '@/components/line-field/GrayLinesCanvas.vue';

const router = useRouter();

function goBack() {
  router.push('/home');
}
</script>

<style lang="less" scoped>
.gray-lines-page {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  overflow: hidden;
  background: #0e0e0e;

  &__canvas {
    position: fixed;
    inset: 0;
    z-index: 1;
  }

  &__hint {
    position: fixed;
    left: 50%;
    bottom: 28px;
    z-index: 1;
    transform: translateX(-50%);
    margin: 0;
    padding: 8px 16px;
    border-radius: 999px;
    font-size: 13px;
    color: rgba(240, 240, 240, 0.75);
    background: rgba(20, 20, 20, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.12);
    pointer-events: none;
  }

  &__header {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    background: linear-gradient(180deg, rgba(14, 14, 14, 0.85), rgba(14, 14, 14, 0));
  }

  &__back {
    color: #d0d0d0 !important;
    padding-left: 0;
  }

  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 500;
    color: #f0f0f0;
    letter-spacing: 0.06em;
  }
}
</style>
