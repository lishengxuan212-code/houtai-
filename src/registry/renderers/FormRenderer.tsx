import { Button, Form, Input, InputNumber, Select, Space } from 'antd';
import { useEffect } from 'react';
import type { FieldConfig } from '../../domain/types';
import type { NodeRendererProps } from './rendererTypes';
import { asArray, asString } from './primitive';

export function FormRenderer({ node, context }: NodeRendererProps) {
  const [form] = Form.useForm();
  const runtimeValues = context.getFormValues?.(node.id);
  useEffect(() => {
    if (context.mode !== 'preview' || !runtimeValues) return;
    form.setFieldsValue(runtimeValues);
    if (Object.keys(runtimeValues).length === 0) form.resetFields();
  }, [context.mode, form, runtimeValues]);
  const fields = asArray<FieldConfig>(node.content?.fields ?? node.props.fields, []);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(values) => context.dispatch?.({ componentId: node.id, event: 'submit', payload: { values, formId: node.id } })}
    >
      {fields.map((field) => {
        const fallbackLabel = field.label || field.key;
        const label =
          context.mode === 'edit'
            ? (context.inlineEdit?.arrayItemText({
                node,
                arrayProp: 'fields',
                itemKey: field.key,
                labelKey: 'label',
                value: fallbackLabel,
              }) ?? fallbackLabel)
            : fallbackLabel;
        return (
          <Form.Item key={field.key} name={field.key} label={label} rules={[{ required: Boolean(field.required), message: `请输入${fallbackLabel}` }]}>
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
