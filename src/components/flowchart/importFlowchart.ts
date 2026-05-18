import type { Edge, Node } from '@vue-flow/core';
import { NODE_LABELS, type FlowNodeType } from './nodes/labels';
import { createDefaultNodeData, type FlowNodeData } from './types';

export interface FlowchartExportData {
  nodes: Array<{
    id: string;
    type?: string;
    position: { x: number; y: number };
    data?: Partial<FlowNodeData>;
  }>;
  edges: Array<{
    id?: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
  }>;
}

const VALID_TYPES = new Set<string>(Object.keys(NODE_LABELS));

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parsePosition(value: unknown, index: number) {
  if (!isObject(value)) {
    throw new Error(`第 ${index + 1} 个节点缺少有效的 position（需包含 x、y 数字）`);
  }
  const x = value.x;
  const y = value.y;
  if (typeof x !== 'number' || typeof y !== 'number' || Number.isNaN(x) || Number.isNaN(y)) {
    throw new Error(`第 ${index + 1} 个节点的 position.x / position.y 必须为数字`);
  }
  return { x, y };
}

function normalizeNodeType(type: unknown): FlowNodeType {
  if (typeof type === 'string' && VALID_TYPES.has(type)) {
    return type as FlowNodeType;
  }
  return 'process';
}

function normalizeNodeData(type: FlowNodeType, data: unknown): FlowNodeData {
  const defaults = createDefaultNodeData(type);
  if (!isObject(data)) return defaults;

  const label =
    typeof data.label === 'string' && data.label.trim() ? data.label.trim() : defaults.label;

  return {
    ...defaults,
    ...data,
    label,
  };
}

function normalizeNode(item: unknown, index: number): Node<FlowNodeData> {
  if (!isObject(item)) {
    throw new Error(`nodes[${index}] 格式无效`);
  }

  const id =
    typeof item.id === 'string' && item.id.trim()
      ? item.id.trim()
      : `node_import_${index + 1}`;

  const type = normalizeNodeType(item.type);
  const position = parsePosition(item.position, index);
  const data = normalizeNodeData(type, item.data);

  return { id, type, position, data };
}

function normalizeEdge(item: unknown, index: number, nodeIds: Set<string>): Edge {
  if (!isObject(item)) {
    throw new Error(`edges[${index}] 格式无效`);
  }

  const source = typeof item.source === 'string' ? item.source : '';
  const target = typeof item.target === 'string' ? item.target : '';

  if (!source || !target) {
    throw new Error(`第 ${index + 1} 条连线缺少 source 或 target`);
  }
  if (!nodeIds.has(source)) {
    throw new Error(`连线 source「${source}」对应的节点不存在`);
  }
  if (!nodeIds.has(target)) {
    throw new Error(`连线 target「${target}」对应的节点不存在`);
  }

  const id =
    typeof item.id === 'string' && item.id.trim()
      ? item.id.trim()
      : `edge_${source}-${target}-${index}`;

  return {
    id,
    source,
    target,
    sourceHandle: typeof item.sourceHandle === 'string' ? item.sourceHandle : undefined,
    targetHandle: typeof item.targetHandle === 'string' ? item.targetHandle : undefined,
    type: 'smoothstep',
  };
}

export interface FlowchartImportResult {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
}

export function parseFlowchartJson(input: string | unknown): FlowchartImportResult {
  let raw: unknown = input;

  if (typeof input === 'string') {
    const text = input.trim();
    if (!text) throw new Error('JSON 内容不能为空');
    try {
      raw = JSON.parse(text);
    } catch {
      throw new Error('JSON 解析失败，请检查格式是否正确');
    }
  }

  if (!isObject(raw)) {
    throw new Error('根对象必须是包含 nodes、edges 的 JSON 对象');
  }

  if (!Array.isArray(raw.nodes)) {
    throw new Error('缺少 nodes 数组');
  }
  if (raw.nodes.length === 0) {
    throw new Error('nodes 不能为空');
  }

  const nodes = raw.nodes.map((item, index) => normalizeNode(item, index));

  const idSet = new Set<string>();
  for (const node of nodes) {
    if (idSet.has(node.id)) {
      throw new Error(`节点 id「${node.id}」重复`);
    }
    idSet.add(node.id);
  }

  const edgesInput = Array.isArray(raw.edges) ? raw.edges : [];
  const edges = edgesInput.map((item, index) => normalizeEdge(item, index, idSet));

  return { nodes, edges };
}
