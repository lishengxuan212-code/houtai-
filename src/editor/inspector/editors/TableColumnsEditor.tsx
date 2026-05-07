import { TableColumnBuilder } from '../TableColumnBuilder';
import type { TableColumnConfig } from '../builderUtils';

export function TableColumnsEditor({ value, onChange }: { value: TableColumnConfig[]; onChange: (value: TableColumnConfig[]) => void }) {
  return <TableColumnBuilder columns={Array.isArray(value) ? value : []} onChange={onChange} />;
}
