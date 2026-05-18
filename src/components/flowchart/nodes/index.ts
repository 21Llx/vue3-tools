import type { NodeTypes } from '@vue-flow/core';
import StartNode from './StartNode.vue';
import ProcessNode from './ProcessNode.vue';
import DecisionNode from './DecisionNode.vue';
import EndNode from './EndNode.vue';

export { NODE_LABELS, PALETTE_ITEMS, type FlowNodeType } from './labels';

export const nodeTypes: NodeTypes = {
  start: StartNode,
  process: ProcessNode,
  decision: DecisionNode,
  end: EndNode,
};
