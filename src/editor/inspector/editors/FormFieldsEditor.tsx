import type { FieldConfig } from '../../../domain/types';
import { FieldListBuilder } from '../FieldListBuilder';

export function FormFieldsEditor({ value, onChange }: { value: FieldConfig[]; onChange: (value: FieldConfig[]) => void }) {
  return <FieldListBuilder fields={Array.isArray(value) ? value : []} onChange={onChange} />;
}
