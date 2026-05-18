<template>
  <div class="flowchart-page">
    <header class="flowchart-page__header">
      <h1 class="flowchart-page__title">流程图设计器</h1>
      <Space>
        <Button @click="goHome">返回首页</Button>
        <Button @click="handleClear">清空画布</Button>
        <Button @click="openImport">导入 JSON</Button>
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
    <Modal
      v-model:open="importVisible"
      title="导入流程图 JSON"
      width="720px"
      ok-text="导入"
      cancel-text="取消"
      :confirm-loading="importing"
      @ok="handleImport"
    >
      <div class="flowchart-page__import-toolbar">
        <input
          ref="fileInputRef"
          type="file"
          accept=".json,application/json"
          class="flowchart-page__file-input"
          @change="onFileSelected"
        />
        <Button @click="triggerFileSelect">选择 JSON 文件</Button>
        <Button type="link" @click="fillSampleJson">填入示例</Button>
      </div>
      <Textarea
        v-model:value="importJson"
        :rows="16"
        placeholder='请粘贴导出的 JSON，格式：{ "nodes": [...], "edges": [...] }'
        class="flowchart-page__import-textarea"
      />
      <p class="flowchart-page__import-hint">导入将替换当前画布内容</p>
    </Modal>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Button, Space, Modal, Input, message } from 'ant-design-vue';
import FlowChartEditor from '@/components/flowchart/FlowChartEditor.vue';
import '@/components/flowchart/flowchart.less';

const Textarea = Input.TextArea;

const router = useRouter();
const editorRef = ref<InstanceType<typeof FlowChartEditor>>();
const exportVisible = ref(false);
const exportJson = ref('');
const importVisible = ref(false);
const importJson = ref('');
const importing = ref(false);
const fileInputRef = ref<HTMLInputElement>();

const SAMPLE_JSON = `{
  "nodes": [
    { "id": "node_1", "type": "start", "position": { "x": 100, "y": 80 }, "data": { "label": "开始" } },
    { "id": "node_2", "type": "process", "position": { "x": 100, "y": 200 }, "data": { "label": "提交申请", "assignee": "张三" } },
    { "id": "node_3", "type": "decision", "position": { "x": 100, "y": 340 }, "data": { "label": "是否通过", "condition": "approved === true" } },
    { "id": "node_4", "type": "end", "position": { "x": 100, "y": 500 }, "data": { "label": "结束" } }
  ],
  "edges": [
    { "id": "e1", "source": "node_1", "target": "node_2" },
    { "id": "e2", "source": "node_2", "target": "node_3" },
    { "id": "e3", "source": "node_3", "target": "node_4", "sourceHandle": "bottom" }
  ]
}`;

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

function openImport() {
  importJson.value = '';
  importVisible.value = true;
}

function fillSampleJson() {
  importJson.value = SAMPLE_JSON;
}

function triggerFileSelect() {
  fileInputRef.value?.click();
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    importJson.value = String(reader.result ?? '');
    message.success(`已读取文件：${file.name}`);
  };
  reader.onerror = () => {
    message.error('文件读取失败');
  };
  reader.readAsText(file, 'utf-8');
  input.value = '';
}

async function handleImport() {
  if (!editorRef.value) return;

  importing.value = true;
  try {
    const result = await editorRef.value.importData(importJson.value);
    importVisible.value = false;
    message.success(`导入成功：${result.nodes.length} 个节点，${result.edges.length} 条连线`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '导入失败';
    message.error(msg);
  } finally {
    importing.value = false;
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

  &__import-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  &__file-input {
    display: none;
  }

  &__import-textarea {
    font-family: Consolas, Monaco, 'Courier New', monospace;
    font-size: 12px;
  }

  &__import-hint {
    margin: 8px 0 0;
    font-size: 12px;
    color: #999;
  }
}
</style>
