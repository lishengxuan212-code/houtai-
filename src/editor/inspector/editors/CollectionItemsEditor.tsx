import { Button, Input, Space } from 'antd';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

export type CollectionItemConfig = {
  id: string;
  key: string;
  label: string;
  value?: string;
  content?: string;
};

function normalizeItem(item: unknown, index: number): CollectionItemConfig {
  if (typeof item === 'string') return { id: `item${index + 1}`, key: item, label: item, value: item };
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    const record = item as Record<string, unknown>;
    const key = String(record.key ?? record.value ?? record.id ?? `item${index + 1}`);
    const label = String(record.label ?? record.title ?? record.name ?? key);
    return {
      id: String(record.id ?? key),
      key,
      label,
      ...(typeof record.value === 'string' ? { value: record.value } : { value: key }),
      ...(typeof record.content === 'string' ? { content: record.content } : {}),
    };
  }
  return { id: `item${index + 1}`, key: `item${index + 1}`, label: `Item ${index + 1}`, value: `item${index + 1}` };
}

function moveItem<T>(items: T[], index: number, direction: 'up' | 'down'): T[] {
  const next = [...items];
  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

function updateItem(items: CollectionItemConfig[], index: number, patch: Partial<CollectionItemConfig>): CollectionItemConfig[] {
  return items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
}

export function CollectionItemsEditor({
  value,
  onChange,
  addLabel = 'Add item',
}: {
  value: unknown[];
  onChange: (value: CollectionItemConfig[]) => void;
  addLabel?: string;
}) {
  const items = Array.isArray(value) ? value.map(normalizeItem) : [];
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {items.map((item, index) => (
        <div className="inspector-field-row" key={item.id || `${item.key}_${index}`}>
          <Input aria-label="Item label" value={item.label} onChange={(event) => onChange(updateItem(items, index, { label: event.target.value }))} />
          <Input aria-label="Item key" value={item.key} onChange={(event) => onChange(updateItem(items, index, { key: event.target.value, value: event.target.value }))} />
          <Button size="small" icon={<ArrowUp size={14} />} onClick={() => onChange(moveItem(items, index, 'up'))} />
          <Button size="small" icon={<ArrowDown size={14} />} onClick={() => onChange(moveItem(items, index, 'down'))} />
          <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} />
        </div>
      ))}
      <Button
        icon={<Plus size={14} />}
        onClick={() => {
          const nextIndex = items.length + 1;
          onChange([...items, { id: `item${nextIndex}`, key: `item${nextIndex}`, label: `Item ${nextIndex}`, value: `item${nextIndex}` }]);
        }}
      >
        {addLabel}
      </Button>
    </Space>
  );
}
