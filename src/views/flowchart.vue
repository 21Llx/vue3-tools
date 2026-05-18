<template>
  <div class="flowchart-page">
    <header class="flowchart-page__header">
      <h1 class="flowchart-page__title">流程图设计器</h1>
      <Space>
        <Button @click="goHome">返回首页</Button>
        <Button @click="handleClear">清空画布</Button>
        <Button type="primary" @click="handleExport">导出 JSON</Button>
      </Space>
    </header>
    <FlowChartEditor ref="editorRef" />
    <Modal
      v-model:open="exportVisible"
      title="流程图数据"
      width="640px"
      :footer="null"
    >
      <pre class="flowchart-page__json">{{ exportJson }}</pre>
      <div class="flowchart-page__modal-actions">
        <Button type="primary" @click="copyJson">复制到剪贴板</Button>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Button, Space, Modal, message } from 'ant-design-vue';
import FlowChartEditor from '@/components/flowchart/FlowChartEditor.vue';
import '@/components/flowchart/flowchart.less';

const router = useRouter();
const editorRef = ref<InstanceType<typeof FlowChartEditor>>();
const exportVisible = ref(false);
const exportJson = ref('');

function goHome() {
  router.push('/home');
}

function handleClear() {
  editorRef.value?.clear();
  message.success('画布已清空');
}

function handleExport() {
  const data = editorRef.value?.exportData();
  if (!data) return;
  exportJson.value = JSON.stringify(data, null, 2);
  exportVisible.value = true;
}

async function copyJson() {
  try {
    await navigator.clipboard.writeText(exportJson.value);
    message.success('已复制到剪贴板');
  } catch {
    message.error('复制失败，请手动选择文本复制');
  }
}
</script>

<style lang="less" scoped>
.flowchart-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    background: #fff;
    border-bottom: 1px solid #e8e8e8;
    flex-shrink: 0;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }

  &__json {
    max-height: 400px;
    overflow: auto;
    padding: 12px;
    background: #f5f5f5;
    border-radius: 6px;
    font-size: 12px;
    line-height: 1.5;
    margin: 0;
  }

  &__modal-actions {
    margin-top: 12px;
    text-align: right;
  }
}
</style>
