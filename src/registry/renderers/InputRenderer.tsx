import { Input, Space, Typography } from 'antd';
import type { NodeRendererProps } from './rendererTypes';
import { asString } from './primitive';

export function InputRenderer({ node, context }: NodeRendererProps) {
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Typography.Text type="secondary">{asString(node.props.label, node.name)}</Typography.Text>
      <Input
        placeholder={asString(node.props.placeholder, '请输入')}
        onChange={(event) =>
          context.dispatch?.({
            componentId: node.id,
            event: 'change',
            payload: { field: asString(node.props.fieldKey, node.id), value: event.target.value },
          })
        }
      />
    </Space>
  );
}
