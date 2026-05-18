import type { FlowNodeData } from './types';
import type { FlowNodeType } from './nodes/labels';

export type ConfigFieldKey = keyof FlowNodeData;

export interface ConfigFieldDef {
  key: ConfigFieldKey;
  label: string;
  type: 'input' | 'textarea' | 'number' | 'switch';
  placeholder?: string;
  min?: number;
}

export const NODE_TYPE_NAMES: Record<FlowNodeType, string> = {
  start: '开始节点',
  process: '处理节点',
  decision: '判断节点',
  end: '结束节点',
};

const COMMON_FIELDS: ConfigFieldDef[] = [
  { key: 'label', label: '组件名称', type: 'input', placeholder: '请输入组件名称' },
  { key: 'description', label: '描述', type: 'textarea', placeholder: '请输入描述' },
  { key: 'enabled', label: '是否启用', type: 'switch' },
  { key: 'remark', label: '备注', type: 'textarea', placeholder: '请输入备注' },
];

const PROCESS_FIELDS: ConfigFieldDef[] = [
  { key: 'assignee', label: '负责人', type: 'input', placeholder: '请输入负责人' },
  { key: 'handler', label: '处理人', type: 'input', placeholder: '请输入处理人' },
  { key: 'timeout', label: '超时时间(分钟)', type: 'number', min: 0 },
];

const DECISION_FIELDS: ConfigFieldDef[] = [
  { key: 'condition', label: '判断条件', type: 'textarea', placeholder: '例如：amount > 1000' },
  { key: 'yesBranch', label: '是分支说明', type: 'input', placeholder: '条件成立时的走向' },
  { key: 'noBranch', label: '否分支说明', type: 'input', placeholder: '条件不成立时的走向' },
];

export const CONFIG_FIELDS_BY_TYPE: Record<FlowNodeType, ConfigFieldDef[]> = {
  start: COMMON_FIELDS,
  end: COMMON_FIELDS,
  process: [
    COMMON_FIELDS[0],
    COMMON_FIELDS[1],
    ...PROCESS_FIELDS,
    COMMON_FIELDS[2],
    COMMON_FIELDS[3],
  ],
  decision: [
    COMMON_FIELDS[0],
    COMMON_FIELDS[1],
    ...DECISION_FIELDS,
    COMMON_FIELDS[2],
    COMMON_FIELDS[3],
  ],
};
