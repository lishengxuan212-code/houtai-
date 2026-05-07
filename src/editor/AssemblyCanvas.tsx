import { Button, Empty, Space, Tag } from 'antd';
import { EyeOff, Lock, Trash2, Unlock } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent, type MouseEvent as ReactMouseEvent, type WheelEvent } from 'react';
import { visibleCanvasNodeIds } from '../domain/canvasViewport';
import type { ComponentNode, NodeCanvasConfig, Page, PageFrame } from '../domain/types';
import { componentLabel } from '../registry/componentLabels';
import { RenderNode } from '../registry/renderers';
import type { RendererContext } from '../registry/renderers/rendererTypes';
import { useCanvasInteractionStore, useCanvasViewportStore } from '../store/editorStores';
import { useProjectStore } from '../store/projectStore';
import { InlineTextEditor, patchArrayItemLabel, patchScalarProp } from './inlineEdit';
import { incrementMetric, measureMetric } from './performance/performanceMetrics';

type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';

const DEFAULT_FRAME_WIDTH = 1200;
const DEFAULT_FRAME_HEIGHT = 760;
const CANVAS_PADDING = 160;
const MIN_NODE_WIDTH = 80;
const MIN_NODE_HEIGHT = 36;

const DEFAULT_NODE_SIZES: Record<string, { width: number; height: number }> = {
  Button: { width: 180, height: 48 },
  Input: { width: 240, height: 44 },
  Select: { width: 240, height: 44 },
  SearchBar: { width: 840, height: 112 },
  Table: { width: 860, height: 300 },
  Form: { width: 520, height: 320 },
  Card: { width: 360, height: 180 },
  Section: { width: 760, height: 180 },
  Modal: { width: 520, height: 280 },
  Drawer: { width: 420, height: 360 },
};

function defaultFrameForPage(page: Page): PageFrame {
  return {
    id: `frame_${page.id}_default`,
    name: page.name,
    x: 0,
    y: 0,
    width: DEFAULT_FRAME_WIDTH,
    height: DEFAULT_FRAME_HEIGHT,
    zIndex: 0,
    background: { color: '#ffffff' },
  };
}

function sizeForNode(node: ComponentNode) {
  const defaultSize = DEFAULT_NODE_SIZES[node.type] ?? { width: 220, height: 96 };
  return {
    width: node.canvas?.width ?? node.layout?.width ?? defaultSize.width,
    height: node.canvas?.height ?? node.layout?.height ?? defaultSize.height,
  };
}

function fallbackCanvasForNode(node: ComponentNode, index: number, frameId: string): NodeCanvasConfig {
  const size = sizeForNode(node);
  return {
    x: node.canvas?.x ?? node.layout?.x ?? 48,
    y: node.canvas?.y ?? node.layout?.y ?? 48 + index * 96,
    width: size.width,
    height: size.height,
    zIndex: node.canvas?.zIndex ?? index + 1,
    ...(node.canvas?.locked !== undefined ? { locked: node.canvas.locked } : {}),
    ...(node.canvas?.hidden !== undefined ? { hidden: node.canvas.hidden } : {}),
    ...(node.canvas?.rotation !== undefined ? { rotation: node.canvas.rotation } : {}),
    parentFrameId: node.canvas?.parentFrameId ?? frameId,
  };
}

function buildParentMap(page: Page) {
  const parents = new Map<string, string>();
  for (const node of Object.values(page.nodes)) {
    node.children?.forEach((childId) => parents.set(childId, node.id));
  }
  return parents;
}

function nextZIndex(page: Page, frameId: string) {
  return (
    Math.max(
      0,
      ...Object.values(page.nodes)
        .filter((node) => node.canvas?.parentFrameId === frameId)
        .map((node) => node.canvas?.zIndex ?? 0),
    ) + 1
  );
}

function useRendererContext(page: Page | undefined, project: ReturnType<typeof useProjectStore.getState>['project']): RendererContext {
  const apply = useProjectStore((state) => state.apply);
  const selectNode = useProjectStore((state) => state.selectNode);
  const reorderNodeToIndex = useProjectStore((state) => state.reorderNodeToIndex);

  return {
    mode: 'edit',
    getData: (id) => project.dataSources.find((item) => item.id === id)?.records ?? [],
    selectInteractionTarget: selectNode,
    reorderNodeToIndex,
    inlineEdit: {
      text: ({ node, propKey, value }) => (
        <InlineTextEditor
          value={value}
          onCommit={(nextValue) =>
            page
              ? apply({ type: 'updateNodeProps', pageId: page.id, nodeId: node.id, props: patchScalarProp(node.props, propKey, nextValue) })
              : undefined
          }
        />
      ),
      arrayItemText: ({ node, arrayProp, itemKey, labelKey, value }) => (
        <InlineTextEditor
          value={value}
          onCommit={(nextValue) =>
            page
              ? apply({
                  type: 'updateNodeProps',
                  pageId: page.id,
                  nodeId: node.id,
                  props: patchArrayItemLabel(node.props, arrayProp, itemKey, labelKey, nextValue),
                })
              : undefined
          }
        />
      ),
    },
  };
}

function NestedRenderNode({
  page,
  node,
  activeFrameId,
  context,
}: {
  page: Page;
  node: ComponentNode;
  activeFrameId: string;
  context: RendererContext;
}) {
  const children = node.children?.map((childId) => {
    const child = page.nodes[childId];
    if (!child || child.canvas?.hidden) return null;
    return <NestedRenderNode key={child.id} page={page} node={child} activeFrameId={activeFrameId} context={context} />;
  });

  return (
    <RenderNode node={node} context={context}>
      {children}
    </RenderNode>
  );
}

function CanvasNodeFrame({
  page,
  node,
  canvas,
  activeFrameId,
  context,
  onContextMenu,
}: {
  page: Page;
  node: ComponentNode;
  canvas: NodeCanvasConfig;
  activeFrameId: string;
  context: RendererContext;
  onContextMenu: (point: { x: number; y: number }) => void;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  incrementMetric('nodeRender');
  const selectedNodeId = useProjectStore((state) => state.selectedNodeId);
  const apply = useProjectStore((state) => state.apply);
  const selectNode = useProjectStore((state) => state.selectNode);
  const deleteSelectedNode = useProjectStore((state) => state.deleteSelectedNode);
  const beginInteraction = useCanvasInteractionStore((state) => state.beginInteraction);
  const updateInteraction = useCanvasInteractionStore((state) => state.updateInteraction);
  const endInteraction = useCanvasInteractionStore((state) => state.endInteraction);
  const activeInteraction = useCanvasInteractionStore((state) => (state.active?.nodeId === node.id ? state.active : undefined));
  const selected = selectedNodeId === node.id;
  const locked = Boolean(canvas.locked);
  const visualCanvas = activeInteraction?.previewCanvas;

  const persistCanvas = (patch: Partial<NodeCanvasConfig>) => {
    apply({ type: 'updateNodeCanvas', pageId: page.id, nodeId: node.id, canvas: { ...canvas, ...patch, parentFrameId: activeFrameId } });
  };

  const startDrag = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || locked || (event.target as HTMLElement).closest('.canvas-node-toolbar, .resize-handle, .inline-edit-text, .inline-edit-input')) return;
    event.preventDefault();
    event.stopPropagation();
    selectNode(node.id);

    const startX = event.clientX;
    const startY = event.clientY;
    const startCanvas = { ...canvas };
    let latestCanvas = startCanvas;
    let frameId: number | undefined;

    beginInteraction({
      kind: 'drag',
      pageId: page.id,
      nodeId: node.id,
      frameId: activeFrameId,
      startPointer: { x: startX, y: startY },
      startCanvas,
      previewCanvas: startCanvas,
    });

    const onMove = (moveEvent: globalThis.MouseEvent) => {
      latestCanvas = {
        ...startCanvas,
        x: Math.round(startCanvas.x + moveEvent.clientX - startX),
        y: Math.round(startCanvas.y + moveEvent.clientY - startY),
      };
      if (frameId !== undefined) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = undefined;
        updateInteraction(latestCanvas);
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      if (frameId !== undefined) window.cancelAnimationFrame(frameId);
      endInteraction();
      persistCanvas({
        x: latestCanvas.x,
        y: latestCanvas.y,
      });
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp, { once: true });
  };

  const startResize = (corner: ResizeCorner) => (event: ReactMouseEvent<HTMLSpanElement>) => {
    if (locked) return;
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const startCanvas = { ...canvas };
    let latestCanvas = startCanvas;
    let frameId: number | undefined;

    beginInteraction({
      kind: 'resize',
      pageId: page.id,
      nodeId: node.id,
      frameId: activeFrameId,
      startPointer: { x: startX, y: startY },
      startCanvas,
      previewCanvas: startCanvas,
    });

    const onMove = (moveEvent: globalThis.MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const next: Partial<NodeCanvasConfig> = {};

      if (corner.includes('w')) {
        const width = Math.max(MIN_NODE_WIDTH, startCanvas.width - deltaX);
        next.width = Math.round(width);
        next.x = Math.round(startCanvas.x + startCanvas.width - width);
      } else {
        next.width = Math.max(MIN_NODE_WIDTH, Math.round(startCanvas.width + deltaX));
      }

      if (corner.includes('n')) {
        const height = Math.max(MIN_NODE_HEIGHT, startCanvas.height - deltaY);
        next.height = Math.round(height);
        next.y = Math.round(startCanvas.y + startCanvas.height - height);
      } else {
        next.height = Math.max(MIN_NODE_HEIGHT, Math.round(startCanvas.height + deltaY));
      }

      latestCanvas = { ...startCanvas, ...next };
      if (frameId !== undefined) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = undefined;
        updateInteraction(latestCanvas);
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      if (frameId !== undefined) window.cancelAnimationFrame(frameId);
      endInteraction();
      persistCanvas({
        x: latestCanvas.x,
        y: latestCanvas.y,
        width: latestCanvas.width,
        height: latestCanvas.height,
      });
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp, { once: true });
  };

  const style: CSSProperties = {
    position: 'absolute',
    left: canvas.x,
    top: canvas.y,
    width: visualCanvas?.width ?? canvas.width,
    height: visualCanvas?.height ?? canvas.height,
    zIndex: canvas.zIndex,
    ...(visualCanvas
      ? {
          transform: `translate(${visualCanvas.x - canvas.x}px, ${visualCanvas.y - canvas.y}px)`,
        }
      : {}),
  };

  return (
    <div
      ref={nodeRef}
      data-node-id={node.id}
      data-testid={`canvas-node-${node.id}`}
      className={`canvas-node-frame${selected ? ' selected' : ''}${locked ? ' locked' : ''}`}
      style={style}
      onClick={(event) => {
        event.stopPropagation();
        selectNode(node.id);
      }}
      onMouseDown={startDrag}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        selectNode(node.id);
        onContextMenu({ x: canvas.x + 12, y: canvas.y + 12 });
      }}
    >
      {selected ? (
        <div className="canvas-node-toolbar">
          <Space size={4}>
            <Tag color={locked ? 'default' : 'blue'}>{componentLabel(node.type)}</Tag>
            <Button
              aria-label={locked ? 'unlock-node' : 'lock-node'}
              size="small"
              icon={locked ? <Unlock size={14} /> : <Lock size={14} />}
              onClick={(event) => {
                event.stopPropagation();
                apply({ type: 'setNodeCanvasLocked', pageId: page.id, nodeId: node.id, locked: !locked });
              }}
            />
            <Button
              aria-label="hide-node"
              size="small"
              icon={<EyeOff size={14} />}
              onClick={(event) => {
                event.stopPropagation();
                apply({ type: 'setNodeCanvasHidden', pageId: page.id, nodeId: node.id, hidden: true });
              }}
            />
            <Button
              aria-label="delete-node"
              size="small"
              danger
              icon={<Trash2 size={14} />}
              onClick={(event) => {
                event.stopPropagation();
                deleteSelectedNode();
              }}
            />
          </Space>
        </div>
      ) : null}
      <div className="canvas-node-renderer">
        <NestedRenderNode page={page} node={node} activeFrameId={activeFrameId} context={context} />
      </div>
      {selected && !locked
        ? (['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
            <span aria-label={`resize-${corner}`} className={`resize-handle ${corner}`} key={corner} onMouseDown={startResize(corner)} />
          ))
        : null}
    </div>
  );
}

export function AssemblyCanvas() {
  incrementMetric('canvasRender');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | undefined>();
  const [viewportBox, setViewportBox] = useState({ scrollLeft: 0, scrollTop: 0, width: 0, height: 0 });
  const project = useProjectStore((state) => state.project);
  const currentPageId = useProjectStore((state) => state.currentPageId);
  const currentFrameId = useProjectStore((state) => state.currentFrameId);
  const selectedNodeId = useProjectStore((state) => state.selectedNodeId);
  const selectedNodeIds = useProjectStore((state) => state.selectedNodeIds);
  const zoom = useCanvasViewportStore((state) => state.zoom);
  const setZoom = useCanvasViewportStore((state) => state.setZoom);
  const activeInteractionNodeId = useCanvasInteractionStore((state) => state.active?.nodeId);
  const setVisibleNodeCount = useCanvasInteractionStore((state) => state.setVisibleNodeCount);
  const apply = useProjectStore((state) => state.apply);
  const selectNode = useProjectStore((state) => state.selectNode);
  const selectFrame = useProjectStore((state) => state.selectFrame);
  const copySelectedNodes = useProjectStore((state) => state.copySelectedNodes);
  const pasteClipboard = useProjectStore((state) => state.pasteClipboard);
  const bringSelectedToFront = useProjectStore((state) => state.bringSelectedToFront);
  const sendSelectedToBack = useProjectStore((state) => state.sendSelectedToBack);
  const groupSelectedNodes = useProjectStore((state) => state.groupSelectedNodes);
  const ungroupSelectedNode = useProjectStore((state) => state.ungroupSelectedNode);
  const deleteSelectedNode = useProjectStore((state) => state.deleteSelectedNode);
  const addComponentToParent = useProjectStore((state) => state.addComponentToParent);
  const page = project.pages.find((item) => item.id === currentPageId);
  const scrollRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const pageFrame = page ? (page.frames?.find((frame) => frame.id === currentFrameId) ?? page.frames?.[0] ?? defaultFrameForPage(page)) : undefined;
  const context = useRendererContext(page, project);

  useEffect(() => {
    if (!page || page.frames?.length) return;
    const frame = defaultFrameForPage(page);
    apply({ type: 'addPageFrame', pageId: page.id, frame });
    selectFrame(frame.id);
  }, [apply, page, selectFrame]);

  useEffect(() => {
    if (!page || !pageFrame) return;
    if (currentFrameId !== pageFrame.id) selectFrame(pageFrame.id);
  }, [currentFrameId, page, pageFrame, selectFrame]);

  const parentMap = useMemo(() => (page ? buildParentMap(page) : new Map<string, string>()), [page]);
  const frameEntries = useMemo(() => {
    if (!page || !pageFrame) return [];
    return measureMetric('canvasFrameEntries', () => Object.values(page.nodes)
      .filter((node) => {
        if (node.id === page.rootNodeId || node.canvas?.hidden) return false;
        const parentId = parentMap.get(node.id);
        const explicitlyInFrame = node.canvas?.parentFrameId === pageFrame.id;
        const legacyRootChild = !node.canvas?.parentFrameId && parentId === page.rootNodeId;
        return (explicitlyInFrame && (!parentId || parentId === page.rootNodeId)) || legacyRootChild;
      })
      .map((node, index) => ({ node, canvas: fallbackCanvasForNode(node, index, pageFrame.id) }))
      .sort((left, right) => left.canvas.zIndex - right.canvas.zIndex || left.canvas.y - right.canvas.y || left.canvas.x - right.canvas.x));
  }, [page, pageFrame, parentMap]);

  const viewport = useMemo(() => {
    if (!pageFrame || viewportBox.width === 0 || viewportBox.height === 0) {
      return { x: 0, y: 0, width: pageFrame?.width ?? DEFAULT_FRAME_WIDTH, height: pageFrame?.height ?? DEFAULT_FRAME_HEIGHT };
    }
    return {
      x: Math.max(0, Math.round((viewportBox.scrollLeft - CANVAS_PADDING) / zoom)),
      y: Math.max(0, Math.round((viewportBox.scrollTop - CANVAS_PADDING) / zoom)),
      width: Math.round(viewportBox.width / zoom),
      height: Math.round(viewportBox.height / zoom),
    };
  }, [pageFrame, viewportBox, zoom]);

  const visibleNodeIds = useMemo(
    () =>
      visibleCanvasNodeIds({
        entries: frameEntries.map(({ node, canvas }) => ({ nodeId: node.id, canvas })),
        viewport,
        selectedNodeIds,
        ...(activeInteractionNodeId ? { draggingNodeId: activeInteractionNodeId } : {}),
      }),
    [activeInteractionNodeId, frameEntries, selectedNodeIds, viewport],
  );

  useEffect(() => {
    setVisibleNodeCount(visibleNodeIds.size);
  }, [setVisibleNodeCount, visibleNodeIds.size]);

  useEffect(() => {
    if (!page || !pageFrame) return;
    for (const { node, canvas } of frameEntries) {
      if (node.canvas?.parentFrameId === pageFrame.id) continue;
      apply({ type: 'updateNodeCanvas', pageId: page.id, nodeId: node.id, canvas });
    }
  }, [apply, frameEntries, page, pageFrame]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const command = event.ctrlKey || event.metaKey;
      if (!command) return;
      if (event.key.toLowerCase() === 'c') {
        event.preventDefault();
        copySelectedNodes();
      }
      if (event.key.toLowerCase() === 'v') {
        event.preventDefault();
        pasteClipboard();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [copySelectedNodes, pasteClipboard]);

  if (!page || !pageFrame) return null;

  function handleWheel(event: WheelEvent<HTMLElement>) {
    if (!event.ctrlKey) return;
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    setZoom(Math.min(1.8, Math.max(0.5, Number((zoom + direction * 0.08).toFixed(2)))));
  }

  function dropPointInFrame(event: DragEvent<HTMLElement>) {
    const rect = frameRef.current?.getBoundingClientRect();
    const clientX = Number.isFinite(event.clientX) ? event.clientX : rect?.left ?? 0;
    const clientY = Number.isFinite(event.clientY) ? event.clientY : rect?.top ?? 0;
    return {
      x: Math.max(0, Math.round((clientX - (rect?.left ?? 0)) / zoom)),
      y: Math.max(0, Math.round((clientY - (rect?.top ?? 0)) / zoom)),
    };
  }

  return (
    <section
      ref={scrollRef}
      className="assembly-canvas"
      onClick={() => {
        setContextMenu(undefined);
        selectNode(page.rootNodeId);
      }}
      onWheel={handleWheel}
      onScroll={(event) => {
        setViewportBox({
          scrollLeft: event.currentTarget.scrollLeft,
          scrollTop: event.currentTarget.scrollTop,
          width: event.currentTarget.clientWidth,
          height: event.currentTarget.clientHeight,
        });
      }}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes('application/x-admin-component')) event.preventDefault();
      }}
    >
      <div className="canvas-zoom-indicator">{Math.round(zoom * 100)}%</div>
      <div
        className="assembly-zoom-surface canvas-workspace"
        style={{
          transform: `scale(${zoom})`,
          width: `${100 / zoom}%`,
          minHeight: `${100 / zoom}%`,
          padding: CANVAS_PADDING,
        }}
      >
        <div
          ref={frameRef}
          data-testid="canvas-page-frame"
          className={`canvas-page-frame${selectedNodeId === page.rootNodeId ? ' selected' : ''}`}
          style={{ width: pageFrame.width, height: pageFrame.height, background: pageFrame.background?.color ?? '#ffffff' }}
          onClick={(event) => {
            event.stopPropagation();
            selectNode(page.rootNodeId);
          }}
          onDragOver={(event) => {
            if (event.dataTransfer.types.includes('application/x-admin-component')) event.preventDefault();
          }}
          onDrop={(event) => {
            const type = event.dataTransfer.getData('application/x-admin-component');
            if (!type) return;
            event.preventDefault();
            event.stopPropagation();
            const point = dropPointInFrame(event);
            const size = DEFAULT_NODE_SIZES[type] ?? { width: 220, height: 96 };
            addComponentToParent(type, page.rootNodeId, {
              ...point,
              ...size,
              zIndex: nextZIndex(page, pageFrame.id),
              parentFrameId: pageFrame.id,
            });
          }}
        >
          <div className="canvas-page-frame-label">{pageFrame.name}</div>
          {frameEntries.length === 0 ? (
            <div className="canvas-empty-state">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Drop components from the library" />
            </div>
          ) : (
            frameEntries.map(({ node, canvas }) => (
              visibleNodeIds.has(node.id) ? (
                <CanvasNodeFrame key={node.id} page={page} node={node} canvas={canvas} activeFrameId={pageFrame.id} context={context} onContextMenu={setContextMenu} />
              ) : null
          ))
          )}
          {contextMenu ? (
            <div
              className="canvas-context-menu"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onClick={(event) => event.stopPropagation()}
            >
              <Button size="small" onClick={() => { copySelectedNodes(); setContextMenu(undefined); }}>Copy</Button>
              <Button size="small" onClick={() => { pasteClipboard(); setContextMenu(undefined); }}>Paste</Button>
              <Button size="small" onClick={() => { bringSelectedToFront(); setContextMenu(undefined); }}>Bring front</Button>
              <Button size="small" onClick={() => { sendSelectedToBack(); setContextMenu(undefined); }}>Send back</Button>
              <Button size="small" onClick={() => { groupSelectedNodes(); setContextMenu(undefined); }}>Group</Button>
              <Button size="small" onClick={() => { ungroupSelectedNode(); setContextMenu(undefined); }}>Ungroup</Button>
              <Button size="small" danger onClick={() => { deleteSelectedNode(); setContextMenu(undefined); }}>Delete</Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
