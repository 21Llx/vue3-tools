import { NODE_LABELS, type FlowNodeType } from './nodes/labels';

export interface FlowNodeData {
  label: string;
  description?: string;
  assignee?: string;
  handler?: string;
  condition?: string;
  yesBranch?: string;
  noBranch?: string;
  timeout?: number;
  enabled?: boolean;
  remark?: string;
}

export function createDefaultNodeData(type: FlowNodeType): FlowNodeData {
  const base: FlowNodeData = {
    label: NODE_LABELS[type],
    description: '',
    enabled: true,
    remark: '',
  };

  if (type === 'process') {
    return { ...base, assignee: '', handler: '', timeout: 0 };
  }
  if (type === 'decision') {
    return { ...base, condition: '', yesBranch: '', noBranch: '' };
  }
  return base;
}
