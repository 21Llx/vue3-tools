<template>
  <aside class="flow-config-panel">
    <div class="flow-config-panel__header">
      <h3 class="flow-config-panel__title">节点配置</h3>
      <Button type="text" size="small" class="flow-config-panel__close" @click="emit('close')">
        ✕
      </Button>
    </div>

    <div class="flow-config-panel__body">
      <Form layout="vertical" :colon="false">
        <FormItem label="节点 ID">
          <Input :value="node.id" disabled size="small" />
        </FormItem>
        <FormItem label="组件类型">
          <Input :value="typeName" disabled size="small" />
        </FormItem>

        <FormItem
          v-for="field in fields"
          :key="field.key"
          :label="field.label"
        >
          <Input
            v-if="field.type === 'input'"
            :value="getFieldValue(field.key)"
            :placeholder="field.placeholder"
            allow-clear
            @update:value="(v: string) => updateField(field.key, v)"
          />
          <Textarea
            v-else-if="field.type === 'textarea'"
            :value="getFieldValue(field.key)"
            :placeholder="field.placeholder"
            :rows="3"
            allow-clear
            @update:value="(v: string) => updateField(field.key, v)"
          />
          <InputNumber
            v-else-if="field.type === 'number'"
            :value="getFieldValue(field.key)"
            :min="field.min ?? 0"
            class="flow-config-panel__number"
            @update:value="(v: number | null) => updateField(field.key, v ?? 0)"
          />
          <Switch
            v-else-if="field.type === 'switch'"
            :checked="!!getFieldValue(field.key)"
            @update:checked="(v: boolean) => updateField(field.key, v)"
          />
        </FormItem>
      </Form>
    </div>
  </aside>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { Form, FormItem, Input, InputNumber, Switch, Button } from 'ant-design-vue';
import type { Node } from '@vue-flow/core';
import type { FlowNodeData } from './types';
import { CONFIG_FIELDS_BY_TYPE, NODE_TYPE_NAMES } from './nodeConfigSchema';
import type { FlowNodeType } from './nodes/labels';

const Textarea = Input.TextArea;

const props = defineProps<{
  node: Node<FlowNodeData>;
}>();

const emit = defineEmits<{
  update: [data: Partial<FlowNodeData>];
  close: [];
}>();

const nodeType = computed(() => (props.node.type ?? 'process') as FlowNodeType);
const typeName = computed(() => NODE_TYPE_NAMES[nodeType.value] ?? '未知节点');
const fields = computed(() => CONFIG_FIELDS_BY_TYPE[nodeType.value] ?? CONFIG_FIELDS_BY_TYPE.process);

function getNodeData(): FlowNodeData {
  return (props.node.data ?? { label: '' }) as FlowNodeData;
}

function getFieldValue(key: keyof FlowNodeData) {
  return getNodeData()[key];
}

function updateField(key: keyof FlowNodeData, value: unknown) {
  emit('update', { [key]: value } as Partial<FlowNodeData>);
}
</script>
