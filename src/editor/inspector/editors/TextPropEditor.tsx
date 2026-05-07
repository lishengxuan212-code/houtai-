import { Input } from 'antd';

export function TextPropEditor({ value, onChange, textarea = false, ariaLabel }: { value: string; onChange: (value: string) => void; textarea?: boolean; ariaLabel?: string }) {
  if (textarea) return <Input.TextArea aria-label={ariaLabel ?? 'textarea-prop'} rows={3} value={value} onChange={(event) => onChange(event.target.value)} />;
  return <Input aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)} />;
}
