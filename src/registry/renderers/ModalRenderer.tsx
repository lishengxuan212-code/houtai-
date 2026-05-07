import { Modal } from 'antd';
import type { NodeRendererProps } from './rendererTypes';
import { asString } from './primitive';

export function ModalRenderer({ node, children, context }: NodeRendererProps) {
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
    <Modal title={title} open={open} footer={null} onCancel={() => context.dispatch?.({ componentId: node.id, event: 'click' })}>
      {body ? <p>{body}</p> : null}
      {children}
    </Modal>
  );
}
