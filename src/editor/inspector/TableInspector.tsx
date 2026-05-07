import { Form, Input } from 'antd';
import { useEffect } from 'react';
import type { JsonRecord, JsonValue } from '../../domain/types';
import { AdvancedJsonEditor } from './AdvancedJsonEditor';
import { TableActionBuilder } from './TableActionBuilder';
import { TableColumnBuilder } from './TableColumnBuilder';
import type { TableColumnConfig } from './builderUtils';
import type { InspectorProps } from './types';

function asColumns(value: JsonValue | undefined): TableColumnConfig[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is TableColumnConfig => item !== null && typeof item === 'object' && 'key' in item && 'title' in item);
}

function asActions(value: JsonValue | undefined): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function TableInspector({ node, updateProps }: InspectorProps) {
  const [form] = Form.useForm();
  useEffect(() => {
    form.setFieldsValue({ dataSourceId: node.props.dataSourceId });
  }, [form, node.props.dataSourceId]);

  return (
    <div className="inspector-stack">
      <Form form={form} layout="vertical" onValuesChange={(changed) => updateProps(changed as JsonRecord)}>
        <Form.Item label="数据源" name="dataSourceId">
          <Input />
        </Form.Item>
      </Form>
      <TableColumnBuilder columns={asColumns(node.props.columns)} onChange={(columns) => updateProps({ columns: columns as unknown as JsonValue })} />
      <TableActionBuilder actions={asActions(node.props.actions)} onChange={(actions) => updateProps({ actions })} />
      <AdvancedJsonEditor key={JSON.stringify(node.props)} value={node.props} onApply={updateProps} />
    </div>
  );
}
