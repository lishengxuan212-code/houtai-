import { Drawer } from 'antd';
import type { NodeRendererProps } from './rendererTypes';
import { asString } from './primitive';

export function DrawerRenderer({ node, children, context }: NodeRendererProps) {
  const title = asString(node.props.title, node.name);
  const body = asString(node.content?.body ?? node.props.content, '');
  const displayTitle = context.mode === 'edit' ? (context.inlineEdit?.text({ node, propKey: 'title', value: title }) ?? title) : title;
  const open = context.mode === 'edit' ? node.props.open !== false : Boolean(context.isNodeOpen?.(node.id));

  return (
    <Drawer title={displayTitle} open={open} onClose={() => context.dispatch?.({ componentId: node.id, event: 'click' })} width={520} getContainer={false}>
      {body ? <p>{body}</p> : null}
      {children}
    </Drawer>
  );
}
