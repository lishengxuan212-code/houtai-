import { Alert, Space } from 'antd';
import { useEffect, useRef } from 'react';
import { sortNodesByZIndex } from '../domain/canvas';
import type { ComponentNode, Page, Project } from '../domain/types';
import { RenderNode } from '../registry/renderers';
import type { RendererContext } from '../registry/renderers/rendererTypes';
import { getCanvasNodeStyle, getPreviewFrameNodes, getPreviewFrameStyle, selectPreviewFrame } from './previewLayout';
import { useRuntime } from './runtimeContext';

function RuntimeNode({ page, node, context }: { page: Page; node: ComponentNode; context: RendererContext }) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollRequest = context.getLatestScrollRequest?.(node.id);
  useEffect(() => {
    if (scrollRequest) ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [scrollRequest]);
  if (!context.isNodeVisible?.(node.id)) return null;
  const runtimeProps = context.getNodeProps?.(node.id);
  const runtimeNode = runtimeProps && Object.keys(runtimeProps).length > 0 ? { ...node, props: { ...node.props, ...runtimeProps } } : node;

  const children = sortNodesByZIndex(runtimeNode.children?.map((childId) => page.nodes[childId]).filter((child): child is ComponentNode => child !== undefined) ?? []).map((child) => (
    <RuntimeNode key={child.id} page={page} node={child} context={context} />
  ));
  return (
    <div ref={ref} className="runtime-node-fill" data-testid={`runtime-node-fill-${node.id}`} style={{ width: '100%', height: '100%' }}>
      <RenderNode node={runtimeNode} context={context}>
        {children}
      </RenderNode>
    </div>
  );
}

function RuntimeCanvasFrame({ page, frameId, context }: { page: Page; frameId: string; context: RendererContext }) {
  const frame = page.frames?.find((item) => item.id === frameId);
  if (!frame) return null;
  const nodes = getPreviewFrameNodes(page, frame.id);
  const frameNodeIds = new Set(nodes.map((node) => node.id));
  const parentIds = new Map<string, string>();
  for (const item of Object.values(page.nodes)) {
    item.children?.forEach((childId) => parentIds.set(childId, item.id));
  }
  const rootNodes = nodes.filter((node) => !frameNodeIds.has(parentIds.get(node.id) ?? ''));

  return (
    <div className="runtime-frame-preview" data-testid={`runtime-frame-${frame.id}`} style={getPreviewFrameStyle(frame)}>
      {rootNodes.map((node) => (
        <div key={node.id} className="runtime-canvas-node" data-testid={`runtime-canvas-node-${node.id}`} style={getCanvasNodeStyle(node)}>
          <RuntimeNode page={page} node={node} context={context} />
        </div>
      ))}
    </div>
  );
}

export function RuntimeRenderer({ project, activeFrameId }: { project: Project; activeFrameId?: string }) {
  const runtime = useRuntime();
  const page = project.pages.find((item) => item.id === runtime.state.currentPageId) ?? project.pages[0];
  const root = page?.nodes[page.rootNodeId];
  if (!page || !root) return <Alert type="error" message="Current page cannot render" />;
  const frame = selectPreviewFrame(page, activeFrameId);

  const context: RendererContext = {
    mode: 'preview',
    dispatch: runtime.dispatch,
    getData: runtime.getData,
    isNodeOpen: runtime.isNodeOpen,
    isNodeDisabled: runtime.isNodeDisabled,
    isNodeVisible: runtime.isNodeVisible,
    getNodeProps: runtime.getNodeProps,
    getFormValues: runtime.getFormValues,
    getActiveTab: runtime.getActiveTab,
    getLatestScrollRequest: runtime.getLatestScrollRequest,
  };

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      {runtime.state.messages.slice(-3).map((message) => (
        <Alert key={message.id} type={message.level} message={message.message} showIcon />
      ))}
      {frame ? <RuntimeCanvasFrame page={page} frameId={frame.id} context={context} /> : <RuntimeNode page={page} node={root} context={context} />}
    </Space>
  );
}
