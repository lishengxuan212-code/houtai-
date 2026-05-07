import { Button, Checkbox, Input, Space } from 'antd';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

export type MenuItemConfig = {
  id: string;
  key: string;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  icon?: string;
  actionId?: string;
};

function updateItem(items: MenuItemConfig[], index: number, patch: Partial<MenuItemConfig>): MenuItemConfig[] {
  return items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
}

function moveItem<T>(items: T[], index: number, direction: 'up' | 'down'): T[] {
  const next = [...items];
  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

export function MenuItemsEditor({ value, onChange }: { value: MenuItemConfig[]; onChange: (value: MenuItemConfig[]) => void }) {
  const items = Array.isArray(value) ? value : [];
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {items.map((item, index) => (
        <div className="inspector-field-row" key={item.id || `${item.key}_${index}`}>
          <Input aria-label="菜单文字" value={item.label} onChange={(event) => onChange(updateItem(items, index, { label: event.target.value }))} />
          <Input aria-label="菜单 key" value={item.key} onChange={(event) => onChange(updateItem(items, index, { key: event.target.value }))} />
          <Checkbox checked={Boolean(item.disabled)} onChange={(event) => onChange(updateItem(items, index, { disabled: event.target.checked }))}>禁用</Checkbox>
          <Checkbox checked={Boolean(item.danger)} onChange={(event) => onChange(updateItem(items, index, { danger: event.target.checked }))}>危险项</Checkbox>
          <Button size="small" icon={<ArrowUp size={14} />} onClick={() => onChange(moveItem(items, index, 'up'))} />
          <Button size="small" icon={<ArrowDown size={14} />} onClick={() => onChange(moveItem(items, index, 'down'))} />
          <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} />
        </div>
      ))}
      <Button
        icon={<Plus size={14} />}
        onClick={() => {
          const nextIndex = items.length + 1;
          onChange([...items, { id: `item${nextIndex}`, key: `item${nextIndex}`, label: `菜单项${nextIndex}` }]);
        }}
      >
        添加菜单项
      </Button>
    </Space>
  );
}
