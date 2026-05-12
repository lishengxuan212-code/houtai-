import { Modal } from 'antd';
import type { NodeRendererProps } from './rendererTypes';
import { asString } from './primitive';

export function ModalRenderer({ node, children, context }: NodeRendererProps) {
  const title = asString(node.props.title, node.name);
  const body = asString(node.content?.body ?? node.props.content, '');
  const displayTitle = context.mode === 'edit' ? (context.inlineEdit?.text({ node, propKey: 'title', value: title }) ?? title) : title;
  const open = context.mode === 'edit' ? node.props.open !== false : Boolean(context.isNodeOpen?.(node.id));

  return (
    <Modal title={displayTitle} open={open} footer={null} onCancel={() => context.dispatch?.({ componentId: node.id, event: 'click' })} getContainer={false}>
      {body ? <p>{body}</p> : null}
      {children}
    </Modal>
  );
}
