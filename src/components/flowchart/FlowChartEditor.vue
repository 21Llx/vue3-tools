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
        @node-click="onNodeClick"
        @pane-click="onPaneClick"
      >
        <FlowDnD ref="flowDndRef" />
        <FlowFitView ref="fitViewRef" />
        <Background pattern-color="#e8e8e8" :gap="16" />
        <Controls />
        <Panel position="top-left" class="flow-editor__panel">
          <span class="flow-editor__tip">拖线连接 · 点击节点右侧配置 · 双击快速改名 · Delete 删除</span>
        </Panel>
      </VueFlow>
    </div>
    <FlowConfigPanel
      v-if="selectedNode"
      :node="selectedNode"
      @update="onNodeConfigUpdate"
      @close="selectedNodeId = null"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick } from 'vue';
import { VueFlow, Panel } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import type { Connection, Edge, Node, NodeMouseEvent } from '@vue-flow/core';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';

import FlowSidebar from './FlowSidebar.vue';
import FlowDnD from './FlowDnD.vue';
import FlowConfigPanel from './FlowConfigPanel.vue';
import FlowFitView from './FlowFitView.vue';
import { nodeTypes } from './nodes';
import type { FlowNodeData } from './types';
import { parseFlowchartJson, type FlowchartImportResult } from './importFlowchart';

const nodes = ref<Node<FlowNodeData>[]>([]);
const edges = ref<Edge[]>([]);
const selectedNodeId = ref<string | null>(null);

const selectedNode = computed(() =>
  nodes.value.find((n) => n.id === selectedNodeId.value) ?? null,
);

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: false,
  style: { stroke: '#516bd9', strokeWidth: 2 },
};

const flowDndRef = ref<InstanceType<typeof FlowDnD>>();
const fitViewRef = ref<InstanceType<typeof FlowFitView>>();

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

function onNodeClick({ node }: NodeMouseEvent) {
  selectedNodeId.value = node.id;
}

function onPaneClick() {
  selectedNodeId.value = null;
}

function onNodeConfigUpdate(data: Partial<FlowNodeData>) {
  if (!selectedNodeId.value) return;
  nodes.value = nodes.value.map((n) =>
    n.id === selectedNodeId.value ? { ...n, data: { ...n.data, ...data } } : n,
  );
}

function clear() {
  nodes.value = [];
  edges.value = [];
  selectedNodeId.value = null;
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

async function importData(input: string | FlowchartImportResult) {
  const parsed = parseFlowchartJson(input);
  nodes.value = parsed.nodes;
  edges.value = parsed.edges;
  selectedNodeId.value = null;
  flowDndRef.value?.syncIdCounter(parsed.nodes);
  await nextTick();
  fitViewRef.value?.fit();
  return parsed;
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
