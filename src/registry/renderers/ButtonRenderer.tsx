import { Button } from 'antd';
import type { NodeRendererProps } from './rendererTypes';
import { asBoolean, asString } from './primitive';

export function ButtonRenderer({ node, context }: NodeRendererProps) {
  const variant = asString(node.props.variant, 'primary');
  const text = asString(node.props.text, node.name);
  return (
    <Button
      type={variant === 'primary' ? 'primary' : variant === 'link' ? 'link' : 'default'}
      danger={asBoolean(node.props.danger)}
      disabled={context.isNodeDisabled?.(node.id) === true}
      onClick={() => context.dispatch?.({ componentId: node.id, event: 'click' })}
    >
      {context.inlineEdit?.text({ node, propKey: 'text', value: text }) ?? text}
    </Button>
  );
}
