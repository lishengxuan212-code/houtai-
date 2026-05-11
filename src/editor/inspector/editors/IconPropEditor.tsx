import { Input } from 'antd';

export function IconPropEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <Input placeholder="图标名称" value={value} onChange={(event) => onChange(event.target.value)} />;
}
