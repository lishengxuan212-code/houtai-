import { Button, Form, Input, InputNumber, Select, Space } from 'antd';
import type { FieldConfig } from '../../domain/types';
import type { NodeRendererProps } from './rendererTypes';
import { asArray, asString } from './primitive';

export function FormRenderer({ node, context }: NodeRendererProps) {
  const [form] = Form.useForm();
  const fields = asArray<FieldConfig>(node.content?.fields ?? node.props.fields, []);
  if (context.mode === 'edit') {
    return (
      <div className="design-form-renderer" data-testid={`design-renderer-${node.id}`}>
        {fields.map((field) => (
          <label className="design-form-field" key={field.key}>
            <span>
              {context.inlineEdit?.arrayItemText({
                node,
                arrayProp: 'fields',
                itemKey: field.key,
                labelKey: 'label',
                value: field.label || field.key,
              }) ?? field.label ?? field.key}
            </span>
            <div className="design-form-control">{field.type === 'select' || field.type === 'status' ? 'Select' : field.type === 'number' || field.type === 'money' ? 'Number' : 'Input'}</div>
          </label>
        ))}
        <div className="design-form-actions">{asString(node.props.submitText, '提交')}</div>
      </div>
    );
  }
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(values) => context.dispatch?.({ componentId: node.id, event: 'submit', payload: { values, formId: node.id } })}
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
            : field.label || field.key;
        return (
          <Form.Item key={field.key} name={field.key} label={label} rules={[{ required: Boolean(field.required), message: `请输入${field.label || field.key}` }]}>
            {field.type === 'number' || field.type === 'money' ? (
              <InputNumber style={{ width: '100%' }} />
            ) : field.type === 'select' || field.type === 'status' ? (
              <Select options={(field.options ?? []).map((item) => ({ label: item, value: item }))} />
            ) : (
              <Input />
            )}
          </Form.Item>
        );
      })}
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            {asString(node.props.submitText, '提交')}
          </Button>
          <Button onClick={() => form.resetFields()}>重置</Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
