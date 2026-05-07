import type { Project } from './types';

export type FieldImpactItem = {
  type: 'dataSourceField' | 'recordValue' | 'tableColumn';
  label: string;
};

export type FieldKeyImpact = {
  dataSourceId: string;
  fromKey: string;
  toKey: string;
  items: FieldImpactItem[];
  conflicts: string[];
  canAutoSync: boolean;
};

export function buildFieldKeyImpact(project: Project, request: { dataSourceId: string; fromKey: string; toKey: string }): FieldKeyImpact {
  const items: FieldImpactItem[] = [];
  const conflicts: string[] = [];
  const source = project.dataSources.find((item) => item.id === request.dataSourceId);
  if (!source) {
    return { ...request, items, conflicts: ['数据源不存在'], canAutoSync: false };
  }

  if (source.fields.some((field) => field.key === request.toKey)) conflicts.push('目标 key 已存在');
  if (source.fields.some((field) => field.key === request.fromKey)) items.push({ type: 'dataSourceField', label: source.name });

  for (const record of source.records) {
    if (Object.prototype.hasOwnProperty.call(record, request.toKey)) conflicts.push(`示例数据已存在字段 ${request.toKey}`);
    if (Object.prototype.hasOwnProperty.call(record, request.fromKey)) items.push({ type: 'recordValue', label: source.name });
  }

  for (const page of project.pages) {
    for (const node of Object.values(page.nodes)) {
      if (node.type !== 'Table' || node.props.dataSourceId !== request.dataSourceId || !Array.isArray(node.props.columns)) continue;
      if (node.props.columns.some((column) => column && typeof column === 'object' && 'key' in column && column.key === request.fromKey)) {
        items.push({ type: 'tableColumn', label: `${page.name} / ${node.name}` });
      }
    }
  }

  return { ...request, items, conflicts, canAutoSync: conflicts.length === 0 };
}
