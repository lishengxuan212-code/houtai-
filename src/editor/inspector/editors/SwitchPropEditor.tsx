import { Switch } from 'antd';

export function SwitchPropEditor({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  return <Switch checked={value} onChange={onChange} />;
}
