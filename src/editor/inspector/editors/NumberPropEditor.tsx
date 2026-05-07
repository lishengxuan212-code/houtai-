import { InputNumber } from 'antd';

export function NumberPropEditor({ value, onChange }: { value: number | undefined; onChange: (value: number) => void }) {
  return <InputNumber style={{ width: '100%' }} value={value ?? null} onChange={(next) => onChange(Number(next ?? 0))} />;
}
