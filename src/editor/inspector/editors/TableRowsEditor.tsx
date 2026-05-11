import { Button, Input, Space } from 'antd';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { JsonRecord } from '../../../domain/types';
import { generateRowsFromColumns, normalizeRowColumns } from './tableRowsUtils';

type ColumnLike = {
  key?: string;
  dataIndex?: string;
  title?: string;
  label?: string;
};

function moveItem<T>(items: T[], index: number, direction: 'up' | 'down'): T[] {
  const next = [...items];
  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

function updateCell(rows: JsonRecord[], index: number, key: string, value: string): JsonRecord[] {
  return rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row));
}

export function TableRowsEditor({ value, columns, onChange }: { value: JsonRecord[]; columns: ColumnLike[]; onChange: (value: JsonRecord[]) => void }) {
  const rows = Array.isArray(value) ? value : [];
  const visibleColumns = normalizeRowColumns(columns);
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {rows.map((row, rowIndex) => (
        <div className="inspector-field-row" key={String(row.id ?? rowIndex)}>
          {visibleColumns.map((column) => (
            <Input key={column.key} aria-label={column.title} value={String(row[column.key] ?? '')} onChange={(event) => onChange(updateCell(rows, rowIndex, column.key, event.target.value))} />
          ))}
          <Button size="small" icon={<ArrowUp size={14} />} onClick={() => onChange(moveItem(rows, rowIndex, 'up'))} />
          <Button size="small" icon={<ArrowDown size={14} />} onClick={() => onChange(moveItem(rows, rowIndex, 'down'))} />
          <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => onChange(rows.filter((_, index) => index !== rowIndex))} />
        </div>
      ))}
      <Space>
        <Button icon={<Plus size={14} />} onClick={() => onChange([...rows, { id: `row_${rows.length + 1}`, ...Object.fromEntries(visibleColumns.map((column) => [column.key, ''])) } as JsonRecord])}>
          添加行
        </Button>
        <Button onClick={() => onChange(generateRowsFromColumns(columns))}>根据列生成示例行</Button>
        <Button onClick={() => onChange([])}>清空行数据</Button>
      </Space>
    </Space>
  );
}
