import { Card, Space, Typography } from 'antd';
import type { CSSProperties, ReactNode } from 'react';
import { normalizeContainerLayout } from '../../domain/layout';
import type { ComponentNode } from '../../domain/types';
import type { NodeRendererProps } from './rendererTypes';
import { asString } from './primitive';

export function PageContainerRenderer({ node, children }: NodeRendererProps) {
  const regions = node.props.regions && typeof node.props.regions === 'object' && !Array.isArray(node.props.regions) ? node.props.regions : {};
  const showTitle = regions.showTitle !== false;
  const showDescription = regions.showDescription !== false;
  const showToolbar = regions.showToolbar === true;
  const showContent = regions.showContent !== false;
  const showFooter = regions.showFooter === true;
  return (
    <main className="runtime-page">
      <div className="runtime-page-header">
        {showTitle ? <Typography.Title level={3}>{asString(node.props.title, node.name)}</Typography.Title> : null}
        {showDescription ? <Typography.Text type="secondary">{asString(node.props.description)}</Typography.Text> : null}
      </div>
      {showToolbar ? <div className="runtime-page-toolbar">工具栏区</div> : null}
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {showContent ? children : null}
      </Space>
      {showFooter ? <div className="runtime-page-footer">底部操作区</div> : null}
    </main>
  );
}

export function SectionRenderer({ node, children, context }: NodeRendererProps) {
  const title = asString(node.props.title, node.name);
  return (
    <section className="runtime-section">
      <Typography.Title level={5}>{context.inlineEdit?.text({ node, propKey: 'title', value: title }) ?? title}</Typography.Title>
      <LayoutChildren node={node} context={context}>{children}</LayoutChildren>
    </section>
  );
}

export function CardRenderer({ node, children, context }: NodeRendererProps) {
  const title = asString(node.props.title, node.name);
  return (
    <Card title={context.inlineEdit?.text({ node, propKey: 'title', value: title }) ?? title} size="small">
      <LayoutChildren node={node} context={context}>{children}</LayoutChildren>
    </Card>
  );
}

function LayoutChildren({ node, children, context }: { node: ComponentNode; children: ReactNode; context: NodeRendererProps['context'] }) {
  const layout = normalizeContainerLayout(node.containerLayout);
  const style: CSSProperties = { gap: layout.gap };
  if (layout.mode === 'stack') {
    style.alignItems =
      layout.align === 'center' ? 'center' : layout.align === 'right' ? 'flex-end' : layout.align === 'stretch' ? 'stretch' : 'flex-start';
    style.justifyContent = layout.justify === 'center' ? 'center' : layout.justify === 'bottom' ? 'flex-end' : 'flex-start';
  }
  if (layout.mode === 'row') {
    style.alignItems =
      layout.align === 'center' ? 'center' : layout.align === 'bottom' ? 'flex-end' : layout.align === 'stretch' ? 'stretch' : 'flex-start';
    style.justifyContent =
      layout.justify === 'center' ? 'center' : layout.justify === 'right' ? 'flex-end' : layout.justify === 'between' ? 'space-between' : 'flex-start';
  }
  if (layout.mode === 'grid') {
    style.gridTemplateColumns =
      layout.columnWidths && layout.columnWidths.length === layout.columns
        ? layout.columnWidths.map((width) => `${width}fr`).join(' ')
        : `repeat(${layout.columns}, minmax(0, 1fr))`;
    style.alignItems =
      layout.align === 'center' ? 'center' : layout.align === 'bottom' ? 'end' : layout.align === 'stretch' ? 'stretch' : 'start';
    style.justifyItems =
      layout.justify === 'center' ? 'center' : layout.justify === 'right' ? 'end' : layout.justify === 'stretch' ? 'stretch' : 'start';
  }
  if (layout.mode === 'free') {
    style.minHeight = layout.height ?? 240;
  }
  return (
    <div
      className={`layout-content layout-${layout.mode}`}
      style={style}
      onDragOver={context.mode === 'edit' ? (event) => event.preventDefault() : undefined}
      onDrop={
        context.mode === 'edit'
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
              const draggedNodeId = event.dataTransfer.getData('application/x-node-id');
              if (!draggedNodeId || !node.children?.includes(draggedNodeId)) return;
              const frames = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(':scope > .node-frame'));
              if (frames.length === 0) return;
              const isRowLike = layout.mode === 'row' || layout.mode === 'grid';
              const targetIndex = frames.findIndex((frame) => {
                const rect = frame.getBoundingClientRect();
                return isRowLike ? event.clientY < rect.top + rect.height / 2 && event.clientX < rect.left + rect.width : event.clientY < rect.top + rect.height / 2;
              });
              context.reorderNodeToIndex?.(draggedNodeId, node.id, targetIndex < 0 ? frames.length : targetIndex);
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
