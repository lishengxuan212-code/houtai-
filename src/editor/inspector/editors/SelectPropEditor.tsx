import { Select } from 'antd';
import type { PropSchemaOption } from '../../../registry/types/propSchema';

export function SelectPropEditor({
  value,
  onChange,
  options,
  mode,
}: {
  value: string | number | boolean | (string | number | boolean)[] | undefined;
  onChange: (value: string | number | boolean | (string | number | boolean)[]) => void;
  options: PropSchemaOption[];
  mode?: 'multiple';
}) {
  return <Select {...(mode ? { mode } : {})} value={(value ?? null) as string | number | boolean | (string | number | boolean)[] | null} options={options} onChange={onChange} />;
}
