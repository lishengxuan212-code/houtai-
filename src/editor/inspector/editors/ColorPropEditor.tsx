import { Input } from 'antd';

export function ColorPropEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <Input type="color" value={value || '#1677ff'} onChange={(event) => onChange(event.target.value)} />;
}
