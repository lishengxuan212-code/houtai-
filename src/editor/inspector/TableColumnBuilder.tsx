import { Button, Input, Space, Typography } from 'antd';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { addTableColumn, deleteListItem, moveListItem, type TableColumnConfig, updateTableColumn } from './builderUtils';

export function TableColumnBuilder({ columns, onChange }: { columns: TableColumnConfig[]; onChange: (columns: TableColumnConfig[]) => void }) {
  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Typography.Text strong>表格列</Typography.Text>
      {columns.map((column, index) => (
        <div className="inspector-list-row" key={`${column.key}_${index}`}>
          <Input
            aria-label="列 key"
            value={column.key}
            onChange={(event) => onChange(updateTableColumn(columns, column.key, { key: event.target.value }))}
          />
          <Input
            aria-label="列标题"
            value={column.title}
            onChange={(event) => onChange(updateTableColumn(columns, column.key, { title: event.target.value }))}
          />
          <Button size="small" icon={<ArrowUp size={14} />} onClick={() => onChange(moveListItem(columns, index, 'up'))} />
          <Button size="small" icon={<ArrowDown size={14} />} onClick={() => onChange(moveListItem(columns, index, 'down'))} />
          <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => onChange(deleteListItem(columns, index))} />
        </div>
      ))}
      <Button icon={<Plus size={14} />} onClick={() => onChange(addTableColumn(columns))}>
        新增列
      </Button>
    </Space>
  );
}
