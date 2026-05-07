import { Select, Space, Typography } from 'antd';
import type { NodeRendererProps } from './rendererTypes';
import { asArray, asString } from './primitive';

export function SelectRenderer({ node, context }: NodeRendererProps) {
  const options = asArray<string | { label?: string; value?: string }>(node.content?.options ?? node.props.options, []);
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Typography.Text type="secondary">{asString(node.props.label, node.name)}</Typography.Text>
      <Select
        style={{ width: '100%' }}
        placeholder="请选择"
        options={options.map((item) => (typeof item === 'string' ? { label: item, value: item } : { label: item.label ?? item.value ?? '', value: item.value ?? item.label ?? '' }))}
        onChange={(value) =>
          context.dispatch?.({
            componentId: node.id,
            event: 'change',
            payload: { field: asString(node.props.fieldKey, node.id), value },
          })
        }
      />
    </Space>
  );
}
