export interface VizDataItem {
  id: string;
  label: string;
  value: number;
  category: string;
}

export const MONTHLY_SALES: VizDataItem[] = [
  { id: 'm1', label: '1月', value: 38, category: 'sales' },
  { id: 'm2', label: '2月', value: 52, category: 'sales' },
  { id: 'm3', label: '3月', value: 61, category: 'sales' },
  { id: 'm4', label: '4月', value: 48, category: 'sales' },
  { id: 'm5', label: '5月', value: 72, category: 'sales' },
  { id: 'm6', label: '6月', value: 66, category: 'sales' },
  { id: 'm7', label: '7月', value: 84, category: 'sales' },
  { id: 'm8', label: '8月', value: 78, category: 'sales' },
];

export const REGION_UV: VizDataItem[] = [
  { id: 'r1', label: '华东', value: 92, category: 'region' },
  { id: 'r2', label: '华北', value: 74, category: 'region' },
  { id: 'r3', label: '华南', value: 88, category: 'region' },
  { id: 'r4', label: '西南', value: 56, category: 'region' },
  { id: 'r5', label: '华中', value: 63, category: 'region' },
  { id: 'r6', label: '东北', value: 41, category: 'region' },
];