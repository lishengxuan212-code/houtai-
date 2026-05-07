import { Drawer } from 'antd';
import type { NodeRendererProps } from './rendererTypes';
import { asString } from './primitive';

export function DrawerRenderer({ node, children, context }: NodeRendererProps) {
  const title = asString(node.props.title, node.name);
  const body = asString(node.content?.body ?? node.props.content, '');
  if (context.mode === 'edit') {
    return (
      <div className="runtime-section">
        <strong>{context.inlineEdit?.text({ node, propKey: 'title', value: title }) ?? title}</strong>
        {body ? <p>{body}</p> : null}
        <div style={{ marginTop: 12 }}>{children}</div>
      </div>
    );
  }
  const open = Boolean(context.isNodeOpen?.(node.id));
  return (
    <Drawer title={title} open={open} onClose={() => context.dispatch?.({ componentId: node.id, event: 'click' })} width={520}>
      {body ? <p>{body}</p> : null}
      {children}
    </Drawer>
  );
}
