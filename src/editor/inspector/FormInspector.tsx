import { Form, Input } from 'antd';
import { useEffect } from 'react';
import type { FieldConfig, JsonRecord, JsonValue } from '../../domain/types';
import { AdvancedJsonEditor } from './AdvancedJsonEditor';
import { FieldListBuilder } from './FieldListBuilder';
import type { InspectorProps } from './types';

function asFields(value: JsonValue | undefined): FieldConfig[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is FieldConfig => item !== null && typeof item === 'object' && 'key' in item && 'label' in item && 'type' in item,
  );
}

export function FormInspector({ node, updateProps }: InspectorProps) {
  const [form] = Form.useForm();
  useEffect(() => {
    form.setFieldsValue({ submitText: node.props.submitText });
  }, [form, node.props.submitText]);

  return (
    <div className="inspector-stack">
      <Form form={form} layout="vertical" onValuesChange={(changed) => updateProps(changed as JsonRecord)}>
        <Form.Item label="提交按钮文案" name="submitText">
          <Input />
        </Form.Item>
      </Form>
      <FieldListBuilder fields={asFields(node.props.fields)} onChange={(fields) => updateProps({ fields: fields as unknown as JsonValue })} />
      <AdvancedJsonEditor key={JSON.stringify(node.props)} value={node.props} onApply={updateProps} />
    </div>
  );
}
