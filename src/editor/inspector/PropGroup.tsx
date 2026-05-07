import { Form, Typography } from 'antd';
import type { JsonRecord } from '../../domain/types';
import { getValueAtPropPath } from '../../domain/operations/componentPropertyOperations';
import type { PropSchemaGroup } from '../../registry/types/propSchema';
import { PropFieldRenderer } from './PropFieldRenderer';

export function PropGroup({
  group,
  propsValue,
  onChange,
  nodePropsValue = propsValue,
}: {
  group: PropSchemaGroup;
  propsValue: JsonRecord;
  onChange: (props: JsonRecord) => void;
  nodePropsValue?: JsonRecord;
}) {
  const visibleFields = group.fields.filter((field) => {
    if (field.editor === 'json' || field.editor === 'codePreview') return false;
    if (!field.visibleWhen) return true;
    const actual = getValueAtPropPath(propsValue, field.visibleWhen.path);
    const expected = field.visibleWhen.value ?? field.visibleWhen.equals;
    if (field.visibleWhen.operator === 'exists') return actual !== undefined && actual !== null && actual !== '';
    if (field.visibleWhen.operator === 'notEquals') return actual !== expected;
    return actual === expected;
  });
  if (visibleFields.length === 0) return null;

  return (
    <div className="inspector-prop-group">
      <Typography.Text strong>{group.title}</Typography.Text>
      <Form layout="vertical">
        {visibleFields.map((field) => (
          <PropFieldRenderer key={field.path} field={field} propsValue={propsValue} nodePropsValue={nodePropsValue} onChange={onChange} />
        ))}
      </Form>
    </div>
  );
}
