import { Alert, Space } from 'antd';
import type { ComponentNode, Page, Project } from '../domain/types';
import { RenderNode } from '../registry/renderers';
import type { RendererContext } from '../registry/renderers/rendererTypes';
import { getCanvasNodeStyle, getPreviewFrameNodes, getPreviewFrameStyle, isRuntimeNodeHidden, selectPreviewFrame } from './previewLayout';
import { useRuntime } from './runtimeContext';

function RuntimeNode({ page, node, context }: { page: Page; node: ComponentNode; context: RendererContext }) {
  if (isRuntimeNodeHidden(node)) return null;

  const children = node.children?.map((childId) => {
    const child = page.nodes[childId];
    return child ? <RuntimeNode key={child.id} page={page} node={child} context={context} /> : null;
  });
  return (
    <RenderNode node={node} context={context}>
      {children}
    </RenderNode>
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
