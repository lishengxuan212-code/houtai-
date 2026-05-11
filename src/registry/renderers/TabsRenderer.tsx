import { Tabs } from 'antd';
import type { NodeRendererProps } from './rendererTypes';
import { asArray } from './primitive';

export function TabsRenderer({ node, children, context }: NodeRendererProps) {
  const items = asArray<string | { key?: string; label?: string; title?: string }>(node.content?.items ?? node.props.items, []);
  const activeKey = context.getActiveTab?.(node.id);
  return (
    <>
      <Tabs
        {...(activeKey !== undefined ? { activeKey } : {})}
        items={items.map((item, index) => {
          const label = typeof item === 'string' ? item : (item.label ?? item.title ?? `Tab ${index + 1}`);
          const key = typeof item === 'string' ? item : (item.key ?? label);
          return { key, label };
        })}
        onChange={(value) => context.dispatch?.({ componentId: node.id, event: 'change', payload: { value } })}
      />
      {children}
    </>
  );
}
