<script lang="ts" setup>
import { useVueFlow } from '@vue-flow/core';
import type { Node } from '@vue-flow/core';
import { NODE_LABELS, type FlowNodeType } from './nodes/labels';
import { createDefaultNodeData } from './types';
import type { FlowNodeData } from './types';

const DND_TYPE = 'application/vueflow';

const { project } = useVueFlow();

let nodeId = 0;
function nextId() {
  nodeId += 1;
  return `node_${nodeId}`;
}

function onDragOver(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
}

function buildNodeFromDrop(event: DragEvent): Node<FlowNodeData> | null {
  const type = event.dataTransfer?.getData(DND_TYPE) as FlowNodeType;
  if (!type || !NODE_LABELS[type]) return null;

  const position = project({ x: event.clientX, y: event.clientY });
  return {
    id: nextId(),
    type,
    position,
    data: createDefaultNodeData(type),
  };
}

function syncIdCounter(existingNodes: Node<FlowNodeData>[]) {
  let max = 0;
  for (const node of existingNodes) {
    const match = /^node_(\d+)$/.exec(node.id);
    if (match) {
      max = Math.max(max, Number.parseInt(match[1], 10));
    }
  }
  nodeId = max;
}

defineExpose({ onDragOver, buildNodeFromDrop, syncIdCounter });
</script>

<template />
