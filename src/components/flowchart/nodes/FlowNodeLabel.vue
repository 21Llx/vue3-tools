<template>
  <span
    v-if="!editing"
    class="flow-node__label nodrag"
    title="双击修改名称"
    @dblclick.stop="startEdit"
  >{{ displayLabel }}</span>
  <input
    v-else
    ref="inputRef"
    v-model="editValue"
    class="flow-node__input nodrag"
    @blur="commitEdit"
    @keydown.enter.prevent="commitEdit"
    @keydown.esc.prevent="cancelEdit"
    @click.stop
    @mousedown.stop
    @pointerdown.stop
  />
</template>

<script lang="ts" setup>
import { ref, computed, nextTick } from 'vue';
import { useNode, useVueFlow } from '@vue-flow/core';
import { NODE_LABELS, type FlowNodeType } from './labels';

interface NodeData {
  label?: string;
}

const { node } = useNode<NodeData>();
const { updateNodeData } = useVueFlow();

const editing = ref(false);
const editValue = ref('');
const inputRef = ref<HTMLInputElement>();

function defaultLabel() {
  return NODE_LABELS[node.type as FlowNodeType] ?? '节点';
}

const displayLabel = computed(() => {
  const label = node.data?.label;
  return label?.trim() ? label : defaultLabel();
});

function startEdit() {
  editing.value = true;
  editValue.value = displayLabel.value;
  nextTick(() => {
    inputRef.value?.focus();
    inputRef.value?.select();
  });
}

function commitEdit() {
  const label = editValue.value.trim() || defaultLabel();
  updateNodeData(node.id, { label });
  editing.value = false;
}

function cancelEdit() {
  editing.value = false;
}
</script>
