import type { JsonRecord } from '../../../domain/types';

type ColumnLike = {
  key?: string;
  dataIndex?: string;
  title?: string;
  label?: string;
};

export function columnKey(column: ColumnLike): string {
  return String(column.key ?? column.dataIndex ?? '');
}

export function columnTitle(column: ColumnLike): string {
  return String(column.title ?? column.label ?? columnKey(column));
}

export function generateRowsFromColumns(columns: ColumnLike[], count = 3): JsonRecord[] {
  return Array.from({ length: count }, (_, rowIndex) => {
    const row: JsonRecord = { id: `row_${rowIndex + 1}` };
    for (const column of columns) {
      const key = columnKey(column);
      if (key) row[key] = `${columnTitle(column)}${rowIndex + 1}`;
    }
    return row;
  });
}
