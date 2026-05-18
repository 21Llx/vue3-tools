export const NODE_LABELS = {
  start: '开始',
  process: '处理',
  decision: '判断',
  end: '结束',
} as const;

export type FlowNodeType = keyof typeof NODE_LABELS;

export const PALETTE_ITEMS: { type: FlowNodeType; label: string }[] = [
  { type: 'start', label: NODE_LABELS.start },
  { type: 'process', label: NODE_LABELS.process },
  { type: 'decision', label: NODE_LABELS.decision },
  { type: 'end', label: NODE_LABELS.end },
];
