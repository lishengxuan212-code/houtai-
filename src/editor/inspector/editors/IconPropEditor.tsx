import { Input } from 'antd';

export function IconPropEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <Input placeholder="Icon name" value={value} onChange={(event) => onChange(event.target.value)} />;
}
