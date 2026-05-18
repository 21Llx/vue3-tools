<template>
  <div class="flow-editor">
    <FlowSidebar />
    <div class="flow-editor__canvas">
      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        :node-types="nodeTypes"
        :default-edge-options="defaultEdgeOptions"
        :delete-key-code="['Backspace', 'Delete']"
        :zoom-on-double-click="false"
        fit-view-on-init
        @dragover="onDragOver"
        @drop="onDrop"
        @connect="onConnect"
      >
        <FlowDnD ref="flowDndRef" />
        <Background pattern-color="#e8e8e8" :gap="16" />
        <Controls />
        <Panel position="top-left" class="flow-editor__panel">
          <span class="flow-editor__tip">从节点边缘拖线连接 · 双击节点改名 · 选中后按 Delete 删除</span>
        </Panel>
      </VueFlow>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { VueFlow, Panel } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import type { Connection, Edge, Node } from '@vue-flow/core';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';

import FlowSidebar from './FlowSidebar.vue';
import FlowDnD from './FlowDnD.vue';
import { nodeTypes } from './nodes';

const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: false,
  style: { stroke: '#516bd9', strokeWidth: 2 },
};

const flowDndRef = ref<InstanceType<typeof FlowDnD>>();

function onDragOver(event: DragEvent) {
  flowDndRef.value?.onDragOver(event);
}

function onDrop(event: DragEvent) {
  event.preventDefault();
  const newNode = flowDndRef.value?.buildNodeFromDrop(event);
  if (newNode) {
    nodes.value = [...nodes.value, newNode];
  }
}

function onConnect(connection: Connection) {
  edges.value = [
    ...edges.value,
    {
      ...connection,
      id: `edge_${connection.source}-${connection.target}-${Date.now()}`,
    },
  ];
}

function clear() {
  nodes.value = [];
  edges.value = [];
}

function exportData() {
  return {
    nodes: nodes.value.map(({ id, type, position, data }) => ({ id, type, position, data })),
    edges: edges.value.map(({ id, source, target, sourceHandle, targetHandle }) => ({
      id,
      source,
      target,
      sourceHandle,
      targetHandle,
    })),
  };
}

function importData(data: { nodes: Node[]; edges: Edge[] }) {
  nodes.value = data.nodes ?? [];
  edges.value = data.edges ?? [];
}

defineExpose({ clear, exportData, importData });
</script>

<style lang="less" scoped>
.flow-editor {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.flow-editor__canvas {
  flex: 1;
  position: relative;
  background: #fafafa;
}

.flow-editor__panel {
  margin: 8px;
}

.flow-editor__tip {
  font-size: 12px;
  color: #666;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 10px;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
</style>
