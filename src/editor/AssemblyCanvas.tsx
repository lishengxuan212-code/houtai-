import { Button, Empty, Space, Tag } from 'antd';
import { EyeOff, Lock, Trash2, Unlock } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent, type MouseEvent as ReactMouseEvent, type WheelEvent } from 'react';
import { getNextFrameZIndex, sortNodesByZIndex } from '../domain/canvas';
import { visibleCanvasNodeIds } from '../domain/canvasViewport';
import type { ComponentNode, NodeCanvasConfig, Page, PageFrame } from '../domain/types';
import { componentLabel } from '../registry/componentLabels';
import { RenderNode } from '../registry/renderers';
import type { RendererContext } from '../registry/renderers/rendererTypes';
import { getComponentDefaultCanvas, saveComponentDefaultProps } from '../store/componentLibraryStore';
import { useCanvasInteractionStore, useCanvasViewportStore } from '../store/editorStores';
import { useProjectStore } from '../store/projectStore';
import { InlineTextEditor, patchArrayItemLabel, patchScalarProp, patchTableCell } from './inlineEdit';
import { incrementMetric, measureMetric } from './performance/performanceMetrics';
import { SaveTemplateModal } from './templates/SaveTemplateModal';

type ResizeHandle = 'n' | 'e' | 's' | 'w' | 'nw' | 'ne' | 'sw' | 'se';
type SelectionBox = { startX: number; startY: number; x: number; y: number; width: number; height: number };

const DEFAULT_FRAME_WIDTH = 1200;
const DEFAULT_FRAME_HEIGHT = 760;
const CANVAS_PADDING = 160;
const MIN_NODE_WIDTH = 80;
const MIN_NODE_HEIGHT = 36;
const MIN_FRAME_WIDTH = 320;
const MIN_FRAME_HEIGHT = 240;
const EDITABLE_SHORTCUT_SELECTOR = [
  'input',
  'textarea',
  'select',
  'button',
  '[contenteditable="true"]',
  '[role="textbox"]',
  '.inline-edit-text',
  '.inline-edit-input',
  '.ant-input',
  '.ant-input-number',
  '.ant-select',
  '.ant-table',
].join(',');

const DEFAULT_NODE_SIZES: Record<string, { width: number; height: number }> = {
  Button: { width: 180, height: 48 },
  Input: { width: 260, height: 72 },
  Select: { width: 260, height: 72 },
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
    ...(node.canvas?.groupId !== undefined ? { groupId: node.canvas.groupId } : {}),
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

function groupedNodeIds(page: Page, node: ComponentNode) {
  const groupId = node.canvas?.groupId;
  if (!groupId) return [node.id];
  return Object.values(page.nodes)
    .filter((candidate) => candidate.canvas?.groupId === groupId)
    .map((candidate) => candidate.id);
}

function isEditableShortcutTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest(EDITABLE_SHORTCUT_SELECTOR));
}

function isTextEditingShortcutTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(
      target.closest([
        'input',
        'textarea',
        'select',
        '[contenteditable="true"]',
        '[role="textbox"]',
        '.inline-edit-text',
        '.inline-edit-input',
        '.ant-input',
        '.ant-input-number',
        '.ant-select',
      ].join(',')),
    )
  );
}

function readScrollBox(element: HTMLElement) {
  return {
    scrollLeft: element.scrollLeft,
    scrollTop: element.scrollTop,
    width: element.clientWidth,
    height: element.clientHeight,
  };
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
      tableCellText: ({ node, rowIndex, columnKey, value }) => (
        <InlineTextEditor
          value={value}
          onCommit={(nextValue) => {
            if (!page) return;
            const hasDataRows = Array.isArray(node.data?.rows);
            if (hasDataRows) {
              apply({ type: 'updateNodeData', pageId: page.id, nodeId: node.id, data: { ...(node.data ?? {}), rows: patchTableCell(node.data?.rows, rowIndex, columnKey, nextValue) } });
              return;
            }
            apply({ type: 'updateNodeProps', pageId: page.id, nodeId: node.id, props: { rows: patchTableCell(node.props.rows ?? node.props.data, rowIndex, columnKey, nextValue) } });
          }}
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
  const children = sortNodesByZIndex(node.children?.map((childId) => page.nodes[childId]).filter((child): child is ComponentNode => child !== undefined && !child.canvas?.hidden) ?? []).map((child) => (
    <NestedRenderNode key={child.id} page={page} node={child} activeFrameId={activeFrameId} context={context} />
  ));

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
  const selectedNodeIds = useProjectStore((state) => state.selectedNodeIds);
  const apply = useProjectStore((state) => state.apply);
  const selectNodes = useProjectStore((state) => state.selectNodes);
  const deleteSelectedNode = useProjectStore((state) => state.deleteSelectedNode);
  const beginInteraction = useCanvasInteractionStore((state) => state.beginInteraction);
  const updateInteraction = useCanvasInteractionStore((state) => state.updateInteraction);
  const endInteraction = useCanvasInteractionStore((state) => state.endInteraction);
  const activeInteraction = useCanvasInteractionStore((state) => state.active);
  const spacePanActive = useCanvasViewportStore((state) => state.spacePanActive);
  const selected = selectedNodeIds.includes(node.id);
  const locked = Boolean(canvas.locked);
  const dragPreviewCanvas =
    activeInteraction?.kind === 'drag' && selectedNodeIds.includes(activeInteraction.nodeId) && selected && !locked
      ? {
          ...canvas,
          x: canvas.x + activeInteraction.previewCanvas.x - activeInteraction.startCanvas.x,
          y: canvas.y + activeInteraction.previewCanvas.y - activeInteraction.startCanvas.y,
        }
      : undefined;
  const resizePreviewCanvas = activeInteraction?.kind === 'resize' && activeInteraction.nodeId === node.id ? activeInteraction.previewCanvas : undefined;
  const visualCanvas = dragPreviewCanvas ?? resizePreviewCanvas;

  const persistCanvas = (patch: Partial<NodeCanvasConfig>) => {
    apply({ type: 'updateNodeCanvas', pageId: page.id, nodeId: node.id, canvas: { ...canvas, ...patch, parentFrameId: activeFrameId } });
  };

  const startDrag = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (spacePanActive) return;
    if (event.shiftKey) return;
    if (event.button !== 0 || locked || (event.target as HTMLElement).closest('.canvas-node-toolbar, .resize-handle, .inline-edit-text, .inline-edit-input')) return;
    event.preventDefault();
    event.stopPropagation();
    const relatedNodeIds = groupedNodeIds(page, node);
    const dragSelection = selectedNodeIds.includes(node.id) ? selectedNodeIds : relatedNodeIds;
    if (!selectedNodeIds.includes(node.id)) selectNodes(relatedNodeIds);

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
      if (dragSelection.length > 1 && dragSelection.includes(node.id)) {
        useProjectStore.getState().selectNodes(dragSelection);
        useProjectStore.getState().moveSelectedCanvasBy(node.id, latestCanvas.x - startCanvas.x, latestCanvas.y - startCanvas.y);
        return;
      }
      persistCanvas({
        x: latestCanvas.x,
        y: latestCanvas.y,
      });
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp, { once: true });
  };

  const startResize = (handle: ResizeHandle) => (event: ReactMouseEvent<HTMLSpanElement>) => {
    if (spacePanActive) return;
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

      if (handle.includes('w')) {
        const width = Math.max(MIN_NODE_WIDTH, startCanvas.width - deltaX);
        next.width = Math.round(width);
        next.x = Math.round(startCanvas.x + startCanvas.width - width);
      } else if (handle.includes('e')) {
        next.width = Math.max(MIN_NODE_WIDTH, Math.round(startCanvas.width + deltaX));
      }

      if (handle.includes('n')) {
        const height = Math.max(MIN_NODE_HEIGHT, startCanvas.height - deltaY);
        next.height = Math.round(height);
        next.y = Math.round(startCanvas.y + startCanvas.height - height);
      } else if (handle.includes('s')) {
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
        if (event.shiftKey) {
          const relatedNodeIds = groupedNodeIds(page, node);
          const next = selectedNodeIds.includes(node.id)
            ? selectedNodeIds.filter((selectedId) => !relatedNodeIds.includes(selectedId))
            : [...new Set([...selectedNodeIds, ...relatedNodeIds])];
          selectNodes(next);
          return;
        }
        const relatedNodeIds = groupedNodeIds(page, node);
        selectNodes(relatedNodeIds);
      }}
      onMouseDown={startDrag}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!selectedNodeIds.includes(node.id)) selectNodes(groupedNodeIds(page, node));
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
        ? (['n', 'e', 's', 'w', 'nw', 'ne', 'sw', 'se'] as const).map((handle) => (
            <span aria-label={`resize-${handle}`} className={`resize-handle ${handle}`} key={handle} onMouseDown={startResize(handle)} />
          ))
        : null}
    </div>
  );
}

export function AssemblyCanvas() {
  incrementMetric('canvasRender');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | undefined>();
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | undefined>();
  const [frameResizePreview, setFrameResizePreview] = useState<PageFrame | undefined>();
  const [viewportBox, setViewportBox] = useState({ scrollLeft: 0, scrollTop: 0, width: 0, height: 0 });
  const [viewportPanning, setViewportPanning] = useState(false);
  const project = useProjectStore((state) => state.project);
  const currentPageId = useProjectStore((state) => state.currentPageId);
  const currentFrameId = useProjectStore((state) => state.currentFrameId);
  const selectedNodeId = useProjectStore((state) => state.selectedNodeId);
  const selectedNodeIds = useProjectStore((state) => state.selectedNodeIds);
  const zoom = useCanvasViewportStore((state) => state.zoom);
  const spacePanActive = useCanvasViewportStore((state) => state.spacePanActive);
  const setZoom = useCanvasViewportStore((state) => state.setZoom);
  const setSpacePanActive = useCanvasViewportStore((state) => state.setSpacePanActive);
  const activeInteractionNodeId = useCanvasInteractionStore((state) => state.active?.nodeId);
  const setVisibleNodeCount = useCanvasInteractionStore((state) => state.setVisibleNodeCount);
  const apply = useProjectStore((state) => state.apply);
  const selectNode = useProjectStore((state) => state.selectNode);
  const selectNodes = useProjectStore((state) => state.selectNodes);
  const selectFrame = useProjectStore((state) => state.selectFrame);
  const copySelectedNodes = useProjectStore((state) => state.copySelectedNodes);
  const pasteClipboard = useProjectStore((state) => state.pasteClipboard);
  const undo = useProjectStore((state) => state.undo);
  const redo = useProjectStore((state) => state.redo);
  const bringSelectedToFront = useProjectStore((state) => state.bringSelectedToFront);
  const sendSelectedToBack = useProjectStore((state) => state.sendSelectedToBack);
  const moveSelectedForward = useProjectStore((state) => state.moveSelectedForward);
  const moveSelectedBackward = useProjectStore((state) => state.moveSelectedBackward);
  const groupSelectedNodes = useProjectStore((state) => state.groupSelectedNodes);
  const ungroupSelectedNode = useProjectStore((state) => state.ungroupSelectedNode);
  const deleteSelectedNode = useProjectStore((state) => state.deleteSelectedNode);
  const addComponentToParent = useProjectStore((state) => state.addComponentToParent);
  const page = project.pages.find((item) => item.id === currentPageId);
  const scrollRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const suppressNextFrameClick = useRef(false);
  const pageFrame = page ? (page.frames?.find((frame) => frame.id === currentFrameId) ?? page.frames?.[0] ?? defaultFrameForPage(page)) : undefined;
  const context = useRendererContext(page, project);
  const selectedNode = selectedNodeId && page ? page.nodes[selectedNodeId] : undefined;

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
      .sort((left, right) => left.canvas.zIndex - right.canvas.zIndex || left.canvas.y - right.canvas.y || left.canvas.x - right.canvas.x || left.node.id.localeCompare(right.node.id)));
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

  const updateViewportBox = useCallback((element: HTMLElement) => {
    setViewportBox(readScrollBox(element));
  }, []);

  const centerActiveFrame = useCallback(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement || !pageFrame) return;
    const nextScrollLeft = Math.max(0, Math.round((CANVAS_PADDING + pageFrame.x + pageFrame.width / 2) * zoom - scrollElement.clientWidth / 2));
    const nextScrollTop = Math.max(0, Math.round((CANVAS_PADDING + pageFrame.y + pageFrame.height / 2) * zoom - scrollElement.clientHeight / 2));
    scrollElement.scrollLeft = nextScrollLeft;
    scrollElement.scrollTop = nextScrollTop;
    updateViewportBox(scrollElement);
  }, [pageFrame, updateViewportBox, zoom]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (isTextEditingShortcutTarget(event.target)) return;
        event.preventDefault();
        deleteSelectedNode();
        return;
      }
      if (isEditableShortcutTarget(event.target)) return;
      if (event.key === ' ') {
        event.preventDefault();
        if (!event.repeat) setSpacePanActive(true);
        return;
      }
      if (event.key === 'Home') {
        event.preventDefault();
        centerActiveFrame();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setContextMenu(undefined);
        selectNodes([]);
        return;
      }
      const command = event.ctrlKey || event.metaKey;
      if (!command) return;
      if (event.key.toLowerCase() === 'c') {
        event.preventDefault();
        copySelectedNodes();
        return;
      }
      if (event.key.toLowerCase() === 'v') {
        event.preventDefault();
        pasteClipboard();
        return;
      }
      if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (event.key.toLowerCase() === 'g') {
        event.preventDefault();
        if (event.shiftKey) ungroupSelectedNode();
        else groupSelectedNodes();
        return;
      }
      if (event.key === ']') {
        event.preventDefault();
        if (event.shiftKey) bringSelectedToFront();
        else moveSelectedForward();
        return;
      }
      if (event.key === '[') {
        event.preventDefault();
        if (event.shiftKey) sendSelectedToBack();
        else moveSelectedBackward();
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === ' ') setSpacePanActive(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    bringSelectedToFront,
    centerActiveFrame,
    copySelectedNodes,
    deleteSelectedNode,
    groupSelectedNodes,
    moveSelectedBackward,
    moveSelectedForward,
    pasteClipboard,
    redo,
    selectNodes,
    sendSelectedToBack,
    setSpacePanActive,
    undo,
    ungroupSelectedNode,
  ]);

  if (!page || !pageFrame) return null;

  const visualPageFrame = frameResizePreview ?? pageFrame;

  function handleWheel(event: WheelEvent<HTMLElement>) {
    if (!event.ctrlKey && !event.metaKey) return;
    if (isEditableShortcutTarget(event.target)) return;
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    setZoom(Math.min(1.8, Math.max(0.5, Number((zoom + direction * 0.08).toFixed(2)))));
  }

  function startViewportPan(event: ReactMouseEvent<HTMLElement>) {
    if (isEditableShortcutTarget(event.target)) return;
    const canPan = event.button === 1 || (event.button === 0 && spacePanActive);
    if (!canPan) return;
    event.preventDefault();
    event.stopPropagation();
    setContextMenu(undefined);
    setViewportPanning(true);

    const target = event.currentTarget;
    const startX = event.clientX;
    const startY = event.clientY;
    const startScrollLeft = target.scrollLeft;
    const startScrollTop = target.scrollTop;

    const onMove = (moveEvent: globalThis.MouseEvent) => {
      target.scrollLeft = startScrollLeft - (moveEvent.clientX - startX);
      target.scrollTop = startScrollTop - (moveEvent.clientY - startY);
      updateViewportBox(target);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      setViewportPanning(false);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp, { once: true });
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

  function pointInFrame(event: Pick<globalThis.MouseEvent, 'clientX' | 'clientY'>) {
    const rect = frameRef.current?.getBoundingClientRect();
    return {
      x: Math.max(0, Math.round((event.clientX - (rect?.left ?? 0)) / zoom)),
      y: Math.max(0, Math.round((event.clientY - (rect?.top ?? 0)) / zoom)),
    };
  }

  function startBoxSelect(event: ReactMouseEvent<HTMLDivElement>) {
    if (spacePanActive || event.button !== 0 || isEditableShortcutTarget(event.target)) return;
    if (event.target !== event.currentTarget && !(event.target as HTMLElement).classList.contains('canvas-page-frame-label')) return;
    const start = pointInFrame(event.nativeEvent);
    let latest: SelectionBox = { startX: start.x, startY: start.y, x: start.x, y: start.y, width: 0, height: 0 };
    let moved = false;

    const onMove = (moveEvent: globalThis.MouseEvent) => {
      const point = pointInFrame(moveEvent);
      moved = moved || Math.abs(point.x - start.x) > 3 || Math.abs(point.y - start.y) > 3;
      latest = {
        startX: start.x,
        startY: start.y,
        x: Math.min(start.x, point.x),
        y: Math.min(start.y, point.y),
        width: Math.abs(point.x - start.x),
        height: Math.abs(point.y - start.y),
      };
      setSelectionBox(latest);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      setSelectionBox(undefined);
      if (!moved) return;
      suppressNextFrameClick.current = true;
      const right = latest.x + latest.width;
      const bottom = latest.y + latest.height;
      selectNodes(
        frameEntries
          .filter(({ canvas }) => canvas.x < right && canvas.x + canvas.width > latest.x && canvas.y < bottom && canvas.y + canvas.height > latest.y)
          .map(({ node }) => node.id),
      );
    };

    setContextMenu(undefined);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp, { once: true });
  }

  function startFrameResize(handle: ResizeHandle) {
    return (event: ReactMouseEvent<HTMLSpanElement>) => {
      if (spacePanActive || !page || !pageFrame || selectedNodeId !== page.rootNodeId) return;
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startY = event.clientY;
      const startFrame = { ...pageFrame };
      let latestFrame = startFrame;
      let animationFrame: number | undefined;

      const onMove = (moveEvent: globalThis.MouseEvent) => {
        const deltaX = (moveEvent.clientX - startX) / zoom;
        const deltaY = (moveEvent.clientY - startY) / zoom;
        const next: Partial<PageFrame> = {};

        if (handle.includes('w')) {
          const width = Math.max(MIN_FRAME_WIDTH, startFrame.width - deltaX);
          next.width = Math.round(width);
          next.x = Math.round(startFrame.x + startFrame.width - width);
        } else if (handle.includes('e')) {
          next.width = Math.max(MIN_FRAME_WIDTH, Math.round(startFrame.width + deltaX));
        }

        if (handle.includes('n')) {
          const height = Math.max(MIN_FRAME_HEIGHT, startFrame.height - deltaY);
          next.height = Math.round(height);
          next.y = Math.round(startFrame.y + startFrame.height - height);
        } else if (handle.includes('s')) {
          next.height = Math.max(MIN_FRAME_HEIGHT, Math.round(startFrame.height + deltaY));
        }

        latestFrame = { ...startFrame, ...next };
        if (animationFrame !== undefined) return;
        animationFrame = window.requestAnimationFrame(() => {
          animationFrame = undefined;
          setFrameResizePreview(latestFrame);
        });
      };

      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame);
        setFrameResizePreview(undefined);
        apply({
          type: 'updatePageFrame',
          pageId: page.id,
          frameId: pageFrame.id,
          patch: {
            x: latestFrame.x,
            y: latestFrame.y,
            width: latestFrame.width,
            height: latestFrame.height,
          },
        });
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp, { once: true });
    };
  }

  function closeContextMenu() {
    setContextMenu(undefined);
  }

  function renameSelectedFromContextMenu() {
    if (!selectedNode) return;
    const nextName = window.prompt('重命名组件', selectedNode.name);
    if (!nextName?.trim()) return;
    useProjectStore.getState().renameSelectedNode(nextName.trim());
  }

  function toggleSelectedLock() {
    if (!page || !selectedNodeId || !selectedNode) return;
    apply({ type: 'setNodeCanvasLocked', pageId: page.id, nodeId: selectedNodeId, locked: !selectedNode.canvas?.locked });
  }

  function hideSelectedNode() {
    if (!page || !selectedNodeId || !selectedNode) return;
    apply({ type: 'setNodeCanvasHidden', pageId: page.id, nodeId: selectedNodeId, hidden: true });
  }

  function saveSelectedAsDefault() {
    if (!selectedNode) return;
    saveComponentDefaultProps(selectedNode.type, selectedNode.props, new Date().toISOString(), selectedNode.canvas);
  }

  function runContextAction(action: () => void) {
    action();
    closeContextMenu();
  }

  return (
    <section
      ref={scrollRef}
      className={`assembly-canvas${spacePanActive ? ' space-pan-ready' : ''}${viewportPanning ? ' panning' : ''}`}
      onClick={() => {
        setContextMenu(undefined);
        selectNode(page.rootNodeId);
      }}
      onMouseDown={startViewportPan}
      onWheel={handleWheel}
      onScroll={(event) => {
        updateViewportBox(event.currentTarget);
      }}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes('application/x-admin-component')) event.preventDefault();
      }}
    >
      <div className="canvas-zoom-indicator">{Math.round(zoom * 100)}%</div>
      <div
        className="canvas-scroll-sizer"
        style={{
          width: Math.ceil((CANVAS_PADDING * 2 + visualPageFrame.x + visualPageFrame.width) * zoom),
          height: Math.ceil((CANVAS_PADDING * 2 + visualPageFrame.y + visualPageFrame.height) * zoom),
        }}
      >
        <div
          className="assembly-zoom-surface canvas-workspace"
          style={{
            transform: `scale(${zoom})`,
            width: CANVAS_PADDING * 2 + visualPageFrame.x + visualPageFrame.width,
            height: CANVAS_PADDING * 2 + visualPageFrame.y + visualPageFrame.height,
            padding: CANVAS_PADDING,
          }}
        >
        <div
          ref={frameRef}
          data-testid="canvas-page-frame"
          className={`canvas-page-frame${selectedNodeId === page.rootNodeId ? ' selected' : ''}`}
          style={{ width: visualPageFrame.width, height: visualPageFrame.height, marginLeft: visualPageFrame.x, marginTop: visualPageFrame.y, background: pageFrame.background?.color ?? '#ffffff' }}
          onClick={(event) => {
            event.stopPropagation();
            if (suppressNextFrameClick.current) {
              suppressNextFrameClick.current = false;
              return;
            }
            selectNode(page.rootNodeId);
          }}
          onMouseDown={startBoxSelect}
          onDragOver={(event) => {
            if (event.dataTransfer.types.includes('application/x-admin-component')) event.preventDefault();
          }}
          onDrop={(event) => {
            const type = event.dataTransfer.getData('application/x-admin-component');
            if (!type) return;
            event.preventDefault();
            event.stopPropagation();
            const point = dropPointInFrame(event);
            const size = getComponentDefaultCanvas(type) ?? DEFAULT_NODE_SIZES[type] ?? { width: 220, height: 96 };
            addComponentToParent(type, page.rootNodeId, {
              ...point,
              ...size,
              zIndex: getNextFrameZIndex(page, pageFrame.id),
              parentFrameId: pageFrame.id,
            });
          }}
        >
          <div className="canvas-page-frame-label">{pageFrame.name}</div>
          {selectedNodeId === page.rootNodeId
            ? (['nw', 'ne', 'sw', 'se'] as const).map((handle) => (
                <span aria-label={`resize-frame-${handle}`} className={`resize-handle frame-resize-handle ${handle}`} key={handle} onMouseDown={startFrameResize(handle)} />
              ))
            : null}
          {selectionBox ? (
            <div
              className="canvas-selection-box"
              data-testid="canvas-selection-box"
              style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.width, height: selectionBox.height }}
            />
          ) : null}
          {frameEntries.length === 0 ? (
            <div className="canvas-empty-state">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="从左侧组件库拖入组件" />
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
              <Button size="small" aria-label="context-copy" onClick={() => runContextAction(copySelectedNodes)}>复制</Button>
              <Button size="small" aria-label="context-paste" onClick={() => runContextAction(pasteClipboard)}>粘贴</Button>
              <Button size="small" aria-label="context-rename" onClick={() => runContextAction(renameSelectedFromContextMenu)}>重命名</Button>
              <Button size="small" aria-label="context-lock" onClick={() => runContextAction(toggleSelectedLock)}>{selectedNode?.canvas?.locked ? '解锁' : '锁定'}</Button>
              <Button size="small" aria-label="context-hide" onClick={() => runContextAction(hideSelectedNode)}>隐藏</Button>
              <Button size="small" aria-label="context-bring-front" onClick={() => runContextAction(bringSelectedToFront)}>置于顶层</Button>
              <Button size="small" aria-label="context-move-forward" onClick={() => runContextAction(moveSelectedForward)}>上移一层</Button>
              <Button size="small" aria-label="context-move-backward" onClick={() => runContextAction(moveSelectedBackward)}>下移一层</Button>
              <Button size="small" aria-label="context-send-back" onClick={() => runContextAction(sendSelectedToBack)}>置于底层</Button>
              <Button size="small" aria-label="context-group" onClick={() => runContextAction(groupSelectedNodes)}>组合</Button>
              <Button size="small" aria-label="context-ungroup" onClick={() => runContextAction(ungroupSelectedNode)}>取消组合</Button>
              <Button size="small" aria-label="context-save-default" onClick={() => runContextAction(saveSelectedAsDefault)}>保存为默认</Button>
              <Button size="small" aria-label="context-save-template" onClick={() => { setSaveTemplateOpen(true); closeContextMenu(); }}>保存为模板</Button>
              <Button size="small" aria-label="context-delete" danger onClick={() => runContextAction(deleteSelectedNode)}>删除</Button>
            </div>
          ) : null}
          <SaveTemplateModal open={saveTemplateOpen} onClose={() => setSaveTemplateOpen(false)} />
        </div>
        </div>
      </div>
    </section>
  );
}
