import { Button, DatePicker, Form, Input, InputNumber, Select, Space } from 'antd';
import type { FieldConfig } from '../../domain/types';
import type { NodeRendererProps } from './rendererTypes';
import { asArray, asString } from './primitive';

function SearchFieldControl({ field }: { field: FieldConfig }) {
  if (field.type === 'select' || field.type === 'status') {
    return <Select style={{ width: 150 }} options={(field.options ?? []).map((item) => ({ label: item, value: item }))} />;
  }
  if (field.type === 'number' || field.type === 'money') return <InputNumber style={{ width: 150 }} placeholder={field.label} />;
  if (field.type === 'date') return <DatePicker style={{ width: 150 }} />;
  return <Input placeholder={`请输入${field.label}`} />;
}

export function SearchBarRenderer({ node, context }: NodeRendererProps) {
  const [form] = Form.useForm();
  const fields = asArray<FieldConfig>(node.props.fields, []);
  const submitText = asString(node.props.submitText, '搜索');
  const resetText = asString(node.props.resetText, '重置');

  return (
    <Form
      form={form}
      layout="inline"
      onFinish={(values) => context.dispatch?.({ componentId: node.id, event: 'search', payload: { values } })}
      className="search-bar"
    >
      {fields.map((field) => {
        const label =
          context.mode === 'edit'
            ? (context.inlineEdit?.arrayItemText({
                node,
                arrayProp: 'fields',
                itemKey: field.key,
                labelKey: 'label',
                value: field.label || field.key,
              }) ?? field.label ?? field.key)
            : field.label;
        return (
          <Form.Item key={field.key} name={field.key} label={label}>
            <SearchFieldControl field={field} />
          </Form.Item>
        );
      })}
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            {submitText}
          </Button>
          <Button
            onClick={() => {
              form.resetFields();
              context.dispatch?.({ componentId: node.id, event: 'search', payload: { values: {} } });
            }}
          >
            {resetText}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
