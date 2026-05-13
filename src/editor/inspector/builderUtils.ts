import type { FieldConfig } from '../../domain/types';

export type TableColumnObjectConfig = {
  key: string;
  title: string;
};

export type TableColumnConfig = string | TableColumnObjectConfig;

type Direction = 'up' | 'down';

function nextKey(prefix: string, count: number): string {
  return `${prefix}${count + 1}`;
}

function isObjectColumn(column: TableColumnConfig): column is TableColumnObjectConfig {
  return typeof column !== 'string';
}

export function addTableColumn(columns: TableColumnConfig[]): TableColumnConfig[] {
  if (columns.every((column) => typeof column === 'string')) return [...columns, '新列'];
  return [...columns, { key: nextKey('column', columns.length), title: 'New Column' }];
}

export function updateTableColumn(columns: TableColumnConfig[], key: string, patch: Partial<TableColumnConfig>): TableColumnConfig[] {
  return columns.map((column) => (isObjectColumn(column) && column.key === key ? { ...column, ...(patch as Partial<TableColumnObjectConfig>) } : column));
}

export function addFormField(fields: FieldConfig[]): FieldConfig[] {
  return [...fields, { key: nextKey('field', fields.length), label: 'New Field', type: 'text' }];
}

export function updateFormField(fields: FieldConfig[], key: string, patch: Partial<FieldConfig>): FieldConfig[] {
  return fields.map((field) => (field.key === key ? { ...field, ...patch } : { ...field }));
}

export function deleteListItem<T>(items: T[], index: number): T[] {
  return items.filter((_, itemIndex) => itemIndex !== index);
}

export function moveListItem<T>(items: T[], index: number, direction: Direction): T[] {
  const nextIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return [...items];
  const next = [...items];
  [next[index], next[nextIndex]] = [next[nextIndex]!, next[index]!];
  return next;
}
