import { Button, Input, Space, Typography } from 'antd';
import { Plus, Trash2 } from 'lucide-react';

export function TableActionBuilder({ actions, onChange }: { actions: string[]; onChange: (actions: string[]) => void }) {
  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Typography.Text strong>行操作按钮</Typography.Text>
      {actions.map((action, index) => (
        <div className="inspector-action-row" key={`${action}_${index}`}>
          <Input value={action} onChange={(event) => onChange(actions.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))} />
          <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => onChange(actions.filter((_item, itemIndex) => itemIndex !== index))} />
        </div>
      ))}
      <Button icon={<Plus size={14} />} onClick={() => onChange([...actions, '新操作'])}>
        新增行操作按钮
      </Button>
    </Space>
  );
}
