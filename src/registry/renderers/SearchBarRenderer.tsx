import { Button, Form, Input, Select, Space } from 'antd';
import type { FieldConfig } from '../../domain/types';
import type { NodeRendererProps } from './rendererTypes';
import { asArray } from './primitive';

export function SearchBarRenderer({ node, context }: NodeRendererProps) {
  const [form] = Form.useForm();
  const fields = asArray<FieldConfig>(node.props.fields, []);
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
            {field.type === 'select' ? (
              <Select style={{ width: 150 }} options={(field.options ?? []).map((item) => ({ label: item, value: item }))} />
            ) : (
              <Input placeholder={`请输入${field.label}`} />
            )}
          </Form.Item>
        );
      })}
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            搜索
          </Button>
          <Button
            onClick={() => {
              form.resetFields();
              context.dispatch?.({ componentId: node.id, event: 'search', payload: { values: {} } });
            }}
          >
            重置
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
