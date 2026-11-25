<template>
  <div class="infinite-loom-page">
    <header class="infinite-loom-page__header">
      <Button type="text" class="infinite-loom-page__back" @click="goBack">← 返回</Button>
      <h1 class="infinite-loom-page__title">无限织机</h1>
    </header>

    <p class="infinite-loom-page__desc">
      横向图片流由多条丝带拼合；靠近屏幕边缘时，丝带会以不同速度散开并融入白色背景。
    </p>

    <div ref="stageRef" class="infinite-loom-page__stage" />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Button } from 'ant-design-vue';
import { createInfiniteLoom } from '@/components/infinite-loom/createInfiniteLoom';

const router = useRouter();
const stageRef = ref<HTMLElement>();
let disposeScene: (() => void) | null = null;

function goBack() {
  router.push('/home');
}

onMounted(() => {
  if (!stageRef.value) return;
  disposeScene = createInfiniteLoom(stageRef.value).dispose;
});

onUnmounted(() => {
  disposeScene?.();
  disposeScene = null;
});
</script>

<style lang="less" scoped>
.infinite-loom-page {
  min-height: 100vh;
  background: #ffffff;
  color: #1a1a1a;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px 8px;
    flex-shrink: 0;
  }

  &__back {
    padding-left: 0;
  }

  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    letter-spacing: 0.04em;
  }

  &__desc {
    margin: 0;
    padding: 0 24px 12px;
    color: #666;
    font-size: 14px;
    line-height: 1.6;
    flex-shrink: 0;
  }

  &__stage {
    flex: 1;
    min-height: calc(100vh - 120px);
    width: 100%;
    overflow: hidden;
    background: #fff;
  }
}
</style>