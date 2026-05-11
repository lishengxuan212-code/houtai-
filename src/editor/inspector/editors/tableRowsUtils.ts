import type { JsonRecord } from '../../../domain/types';

type ColumnLike = {
  key?: string;
  dataIndex?: string;
  title?: string;
  label?: string;
};

function isColumnObject(column: unknown): column is ColumnLike {
  return Boolean(column) && typeof column === 'object' && !Array.isArray(column);
}

export function columnKey(column: ColumnLike | string): string {
  if (typeof column === 'string') return column;
  return String(column.key ?? column.dataIndex ?? '');
}

export function columnTitle(column: ColumnLike | string): string {
  if (typeof column === 'string') return column;
  return String(column.title ?? column.label ?? columnKey(column));
}

export function normalizeRowColumns(columns: unknown): Array<{ key: string; title: string }> {
  if (!Array.isArray(columns)) return [];
  return columns
    .map((column) => {
      if (typeof column === 'string') return { key: column, title: column };
      if (!isColumnObject(column)) return undefined;
      const key = columnKey(column);
      return key ? { key, title: columnTitle(column) } : undefined;
    })
    .filter((column): column is { key: string; title: string } => Boolean(column));
}

export function generateRowsFromColumns(columns: unknown, count = 3): JsonRecord[] {
  const normalizedColumns = normalizeRowColumns(columns);
  return Array.from({ length: count }, (_, rowIndex) => {
    const row: JsonRecord = { id: `row_${rowIndex + 1}` };
    for (const column of normalizedColumns) {
      if (column.key) row[column.key] = `${column.title}示例${rowIndex + 1}`;
    }
    return row;
  });
}
