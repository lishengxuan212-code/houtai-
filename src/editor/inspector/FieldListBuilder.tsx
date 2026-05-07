import { Button, Checkbox, Input, Select, Space, Typography } from 'antd';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { FieldConfig } from '../../domain/types';
import { addFormField, deleteListItem, moveListItem, updateFormField } from './builderUtils';

const typeOptions = [
  { label: 'Text', value: 'text' },
  { label: 'Number', value: 'number' },
  { label: 'Select', value: 'select' },
  { label: 'Date', value: 'date' },
  { label: 'Money', value: 'money' },
  { label: 'Status', value: 'status' },
];

function optionsText(field: FieldConfig): string {
  return (field.options ?? []).join('\n');
}

export function FieldListBuilder({ fields, onChange }: { fields: FieldConfig[]; onChange: (fields: FieldConfig[]) => void }) {
  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Typography.Text strong>字段</Typography.Text>
      {fields.map((field, index) => (
        <div className="inspector-field-row" key={`${field.key}_${index}`}>
          <Input aria-label="字段 key" value={field.key} onChange={(event) => onChange(updateFormField(fields, field.key, { key: event.target.value }))} />
          <Input aria-label="字段标签" value={field.label} onChange={(event) => onChange(updateFormField(fields, field.key, { label: event.target.value }))} />
          <Select
            aria-label="字段类型"
            value={field.type}
            options={typeOptions}
            onChange={(type: FieldConfig['type']) => onChange(updateFormField(fields, field.key, { type }))}
          />
          <Checkbox checked={Boolean(field.required)} onChange={(event) => onChange(updateFormField(fields, field.key, { required: event.target.checked }))}>
            必填
          </Checkbox>
          <Input.TextArea
            aria-label="字段选项"
            rows={2}
            placeholder="每行一个选项"
            value={optionsText(field)}
            onChange={(event) =>
              onChange(updateFormField(fields, field.key, { options: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean) }))
            }
          />
          <div className="inspector-row-actions">
            <Button size="small" icon={<ArrowUp size={14} />} onClick={() => onChange(moveListItem(fields, index, 'up'))} />
            <Button size="small" icon={<ArrowDown size={14} />} onClick={() => onChange(moveListItem(fields, index, 'down'))} />
            <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => onChange(deleteListItem(fields, index))} />
          </div>
        </div>
      ))}
      <Button icon={<Plus size={14} />} onClick={() => onChange(addFormField(fields))}>
        新增字段
      </Button>
    </Space>
  );
}
