<script lang="ts" setup>
import { useVueFlow } from '@vue-flow/core';
import type { Node } from '@vue-flow/core';
import { NODE_LABELS, type FlowNodeType } from './nodes/labels';

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

function buildNodeFromDrop(event: DragEvent): Node | null {
  const type = event.dataTransfer?.getData(DND_TYPE) as FlowNodeType;
  if (!type || !NODE_LABELS[type]) return null;

  const position = project({ x: event.clientX, y: event.clientY });
  return {
    id: nextId(),
    type,
    position,
    data: { label: NODE_LABELS[type] },
  };
}

defineExpose({ onDragOver, buildNodeFromDrop });
</script>

<template />
