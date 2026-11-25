<template>
  <div class="data-viz-page">
    <header class="data-viz-page__header">
      <Button type="text" class="data-viz-page__back" @click="goBack">← 返回</Button>
      <h1 class="data-viz-page__title">3D 数据可视化</h1>
    </header>

    <aside class="data-viz-page__panel">
      <p class="data-viz-page__label">数据集</p>
      <RadioGroup v-model:value="datasetKey">
        <RadioButton value="monthly">月度销量</RadioButton>
        <RadioButton value="region">区域 UV</RadioButton>
      </RadioGroup>

      <div class="data-viz-page__divider" />

      <p class="data-viz-page__label">当前指向</p>
      <p class="data-viz-page__value">
        {{ hoverItem ? `${hoverItem.label} · ${hoverItem.value}` : '将鼠标移到柱体上' }}
      </p>

      <p class="data-viz-page__label">选中项</p>
      <p class="data-viz-page__value">
        {{ selectedItem ? `${selectedItem.label} · ${selectedItem.value}` : '点击柱体选中' }}
      </p>

      <p class="data-viz-page__tip">拖拽旋转 · 滚轮缩放</p>
    </aside>

    <div ref="stageRef" class="data-viz-page__stage" />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Button, Radio } from 'ant-design-vue';
import { createDataViz3d } from '@/components/data-viz-3d/createDataViz3d';
import { MONTHLY_SALES, REGION_UV, type VizDataItem } from '@/components/data-viz-3d/sampleData';

const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;

const router = useRouter();
const stageRef = ref<HTMLElement>();
const datasetKey = ref<'monthly' | 'region'>('monthly');
const hoverItem = ref<VizDataItem | null>(null);
const selectedItem = ref<VizDataItem | null>(null);

let api: ReturnType<typeof createDataViz3d> | null = null;

function dataset() {
  return datasetKey.value === 'monthly' ? MONTHLY_SALES : REGION_UV;
}

function goBack() {
  router.push('/home');
}

onMounted(() => {
  if (!stageRef.value) return;
  api = createDataViz3d(stageRef.value, {
    onHover: (item) => {
      hoverItem.value = item;
    },
    onSelect: (item) => {
      selectedItem.value = item;
    },
  });
  api.setData(dataset());
});

watch(datasetKey, () => {
  selectedItem.value = null;
  hoverItem.value = null;
  api?.setData(dataset());
});

onUnmounted(() => {
  api?.dispose();
  api = null;
});
</script>

<style lang="less" scoped>
.data-viz-page {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  background: #f4f7fb;
  overflow: hidden;

  &__header {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    background: rgba(244, 247, 251, 0.92);
    border-bottom: 1px solid #e3eaf4;
  }

  &__back {
    padding-left: 0;
  }

  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }

  &__panel {
    position: absolute;
    top: 88px;
    left: 20px;
    z-index: 2;
    width: 240px;
    padding: 16px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid #e2e9f3;
    box-shadow: 0 8px 28px rgba(35, 64, 110, 0.08);
    backdrop-filter: blur(8px);
  }

  &__label {
    margin: 8px 0 6px;
    color: #6b7a90;
    font-size: 12px;
  }

  &__value {
    margin: 0 0 10px;
    color: #1c2a3d;
    font-size: 15px;
    font-weight: 600;
  }

  &__divider {
    height: 1px;
    margin: 12px 0;
    background: #edf2f8;
  }

  &__tip {
    margin: 12px 0 0;
    padding-top: 10px;
    border-top: 1px dashed #dde5f0;
    color: #8a97a8;
    font-size: 12px;
  }

  &__stage {
    position: absolute;
    inset: 64px 0 0;
    z-index: 1;
  }
}

</style>