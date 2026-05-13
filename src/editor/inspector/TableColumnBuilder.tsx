import { Button, Input, Space, Typography } from 'antd';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { addTableColumn, deleteListItem, moveListItem, type TableColumnConfig } from './builderUtils';

function columnTitle(column: TableColumnConfig): string {
  return typeof column === 'string' ? column : column.title;
}

function updateColumnTitle(columns: TableColumnConfig[], index: number, title: string): TableColumnConfig[] {
  return columns.map((column, columnIndex) => {
    if (columnIndex !== index) return column;
    if (typeof column === 'string') return { key: column, title };
    return { ...column, title };
  });
}

export function TableColumnBuilder({ columns, onChange }: { columns: TableColumnConfig[]; onChange: (columns: TableColumnConfig[]) => void }) {
  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Typography.Text strong>表格列</Typography.Text>
      {columns.map((column, index) => {
        const title = columnTitle(column);
        return (
          <div className="inspector-table-column-row" key={`column_${index}`}>
            <label className="inspector-column-field">
              <span>列名</span>
              <Input aria-label={`${title || `第 ${index + 1} 列`} 列名`} value={title} onChange={(event) => onChange(updateColumnTitle(columns, index, event.target.value))} />
            </label>
            <div className="inspector-column-actions">
              <Button size="small" icon={<ArrowUp size={14} />} onClick={() => onChange(moveListItem(columns, index, 'up'))} />
              <Button size="small" icon={<ArrowDown size={14} />} onClick={() => onChange(moveListItem(columns, index, 'down'))} />
              <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => onChange(deleteListItem(columns, index))} />
            </div>
          </div>
        );
      })}
      <Button icon={<Plus size={14} />} onClick={() => onChange(addTableColumn(columns))}>
        新增列
      </Button>
    </Space>
  );
}
