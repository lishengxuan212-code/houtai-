import { Button, Modal, Space } from 'antd';
import type { NodeRendererProps } from './rendererTypes';
import { asArray, asString } from './primitive';

type FooterButton = {
  key?: string;
  id?: string;
  label?: string;
  value?: string;
};

export function ModalRenderer({ node, children, context }: NodeRendererProps) {
  const title = asString(node.props.title, node.name);
  const body = asString(node.content?.body ?? node.props.content, '');
  const footerButtons = asArray<FooterButton>(node.content?.footerButtons ?? node.props.footerButtons, []);
  const displayTitle = context.mode === 'edit' ? (context.inlineEdit?.text({ node, propKey: 'title', value: title }) ?? title) : title;
  const displayBody =
    context.mode === 'edit' && body
      ? (context.inlineEdit?.text({ node, propKey: node.content?.body !== undefined ? 'content.body' : 'content', value: body }) ?? body)
      : body;
  const open = context.mode === 'edit' ? node.props.open !== false : Boolean(context.isNodeOpen?.(node.id));

  return (
    <Modal title={displayTitle} open={open} footer={null} onCancel={() => context.dispatch?.({ componentId: node.id, event: 'click' })} getContainer={false}>
      {displayBody ? <p>{displayBody}</p> : null}
      {children}
      {footerButtons.length ? (
        <Space style={{ marginTop: 16 }}>
          {footerButtons.map((item, index) => {
            const label = asString(item.label ?? item.value ?? item.key ?? item.id, `Button ${index + 1}`);
            const target = `${node.id}:${asString(item.value ?? item.key ?? item.id ?? item.label, label)}`;
            return (
              <Button
                key={target}
                type={index === footerButtons.length - 1 ? 'primary' : 'default'}
                onClick={(event) => {
                  event.stopPropagation();
                  if (context.mode === 'edit') {
                    context.selectInteractionTarget?.(target);
                    return;
                  }
                  context.dispatch?.({ componentId: target, event: 'click', payload: { label } });
                }}
              >
                {label}
              </Button>
            );
          })}
        </Space>
      ) : null}
    </Modal>
  );
}
