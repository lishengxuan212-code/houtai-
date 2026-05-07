import { Collapse, Form, Input, InputNumber, Select, Switch, Typography } from 'antd';
import { useEffect } from 'react';
import type { EditableProp, JsonRecord, JsonValue } from '../../domain/types';
import { componentLabel } from '../../registry/componentLabels';
import { AdvancedJsonEditor } from './AdvancedJsonEditor';
import type { InspectorProps } from './types';

function controlFor(prop: EditableProp) {
  switch (prop.control) {
    case 'textarea':
      return <Input.TextArea rows={3} />;
    case 'number':
      return <InputNumber style={{ width: '100%' }} />;
    case 'boolean':
      return <Switch />;
    case 'select':
      return <Select options={prop.options} />;
    case 'json':
      return null;
    default:
      return <Input />;
  }
}

export function GenericInspector({ node, descriptor, updateProps }: InspectorProps) {
  const [form] = Form.useForm();
  const scalarProps = descriptor.editableProps.filter((prop) => prop.control !== 'json');

  useEffect(() => {
    form.setFieldsValue(Object.fromEntries(scalarProps.map((prop) => [prop.key, node.props[prop.key]])));
  }, [form, node.props, scalarProps]);

  return (
    <div className="inspector-stack">
      <Typography.Text strong>
        {node.name} / {componentLabel(node.type)}
      </Typography.Text>
      {scalarProps.length > 0 ? (
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(changed) => {
            const patch: JsonRecord = {};
            for (const [key, value] of Object.entries(changed)) patch[key] = value as JsonValue;
            updateProps(patch);
          }}
        >
          {scalarProps.map((prop) => (
            <Form.Item key={prop.key} label={prop.label} name={prop.key} valuePropName={prop.control === 'boolean' ? 'checked' : 'value'}>
              {controlFor(prop)}
            </Form.Item>
          ))}
        </Form>
      ) : (
        <Typography.Text type="secondary">No visual properties for this component.</Typography.Text>
      )}
      <Collapse
        size="small"
        items={[
          {
            key: 'debug',
            label: 'Advanced / Debug',
            children: <AdvancedJsonEditor key={JSON.stringify(node.props)} value={node.props} onApply={updateProps} />,
          },
        ]}
      />
    </div>
  );
}
