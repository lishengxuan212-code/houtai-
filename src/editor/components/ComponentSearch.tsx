import { Input } from 'antd';

export function ComponentSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <Input.Search allowClear placeholder="搜索组件中文或英文" value={value} onChange={(event) => onChange(event.target.value)} />;
}
