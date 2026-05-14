import { createId } from './ids';
import type { ComponentNode, NodeCanvasConfig, Page, PageFrame } from './types';

export type CreatePageFrameInput = PageFrame;
export type FrameNodeFilterOptions = {
  includeHidden?: boolean;
};
export type CloneNodesOptions = {
  idFactory?: (oldId: string) => string;
  offset?: { x: number; y: number };
  targetFrameId?: string;
  placeAtHighestLayer?: boolean;
};
export type CloneNodesResult = {
  nodes: Record<string, ComponentNode>;
  rootIds: string[];
  idMap: Record<string, string>;
};
export type LayerZIndexPatch = {
  nodeId: string;
  zIndex: number;
};
export type CanvasAlignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';
export type DistributionDirection = 'horizontal' | 'vertical';
export type CanvasSizeMatch = 'width' | 'height' | 'both';

const DEFAULT_CANVAS: NodeCanvasConfig = {
  x: 0,
  y: 0,
  width: 160,
  height: 80,
  zIndex: 0,
};

function cloneNode(node: ComponentNode): ComponentNode {
  return structuredClone(node) as ComponentNode;
}

function withCanvas(node: ComponentNode, canvas: NodeCanvasConfig): ComponentNode {
  return { ...cloneNode(node), canvas };
}

function canvasFor(node: ComponentNode, defaults: Partial<NodeCanvasConfig> = {}): NodeCanvasConfig {
  return {
    x: node.canvas?.x ?? node.layout?.x ?? defaults.x ?? DEFAULT_CANVAS.x,
    y: node.canvas?.y ?? node.layout?.y ?? defaults.y ?? DEFAULT_CANVAS.y,
    width: node.canvas?.width ?? node.layout?.width ?? defaults.width ?? DEFAULT_CANVAS.width,
    height: node.canvas?.height ?? node.layout?.height ?? defaults.height ?? DEFAULT_CANVAS.height,
    zIndex: node.canvas?.zIndex ?? defaults.zIndex ?? DEFAULT_CANVAS.zIndex,
    ...(node.canvas?.locked !== undefined ? { locked: node.canvas.locked } : {}),
    ...(node.canvas?.hidden !== undefined ? { hidden: node.canvas.hidden } : {}),
    ...(node.canvas?.rotation !== undefined ? { rotation: node.canvas.rotation } : {}),
    ...(node.canvas?.parentFrameId !== undefined ? { parentFrameId: node.canvas.parentFrameId } : {}),
    ...(node.canvas?.groupId ? { groupId: node.canvas.groupId } : {}),
  };
}

function collectSubtreeIds(page: Page, nodeId: string, ids: Set<string>): void {
  if (ids.has(nodeId)) return;
  const node = page.nodes[nodeId];
  if (!node) return;
  ids.add(nodeId);
  node.children?.forEach((childId) => collectSubtreeIds(page, childId, ids));
}

function sortedByCanvas(nodes: ComponentNode[]): ComponentNode[] {
  return sortNodesByZIndex(nodes);
}

function getUnlockedNodes(nodes: ComponentNode[]): ComponentNode[] {
  return nodes.filter((item) => !canvasFor(item).locked);
}

function getSelectionBounds(nodes: ComponentNode[]) {
  const canvases = nodes.map((item) => canvasFor(item));
  return {
    left: Math.min(...canvases.map((item) => item.x)),
    top: Math.min(...canvases.map((item) => item.y)),
    right: Math.max(...canvases.map((item) => item.x + item.width)),
    bottom: Math.max(...canvases.map((item) => item.y + item.height)),
  };
}

export function ensureNodeCanvas(node: ComponentNode, defaults: Partial<NodeCanvasConfig> = {}): ComponentNode {
  return withCanvas(node, canvasFor(node, defaults));
}

export function createPageFrame(input: CreatePageFrameInput): PageFrame {
  return structuredClone(input) as PageFrame;
}

export function assignNodeToFrame(node: ComponentNode, frameId: string): ComponentNode {
  const canvas = { ...canvasFor(node), parentFrameId: frameId };
  return withCanvas(node, canvas);
}

export function filterNodesForFrame(page: Page, frameId: string, options: FrameNodeFilterOptions = {}): ComponentNode[] {
  const hasFrames = Boolean(page.frames?.length);
  const nodes = Object.values(page.nodes)
    .map((item) => ensureNodeCanvas(item))
    .filter((item) => {
      const canvas = item.canvas ?? DEFAULT_CANVAS;
      if (!options.includeHidden && canvas.hidden) return false;
      if (!hasFrames) return true;
      return canvas.parentFrameId === frameId;
    });

  return sortedByCanvas(nodes);
}

function nodeBelongsToFrame(node: ComponentNode, frameId: string): boolean {
  return node.canvas?.parentFrameId === frameId;
}

function frameLayerNodes(page: Page, frameId: string): ComponentNode[] {
  return Object.values(page.nodes).filter((node) => node.id !== page.rootNodeId && nodeBelongsToFrame(node, frameId));
}

export function sortNodesByZIndex(nodes: ComponentNode[]): ComponentNode[] {
  return [...nodes].sort((left, right) => {
    const leftCanvas = canvasFor(left);
    const rightCanvas = canvasFor(right);
    return leftCanvas.zIndex - rightCanvas.zIndex || leftCanvas.y - rightCanvas.y || leftCanvas.x - rightCanvas.x || left.id.localeCompare(right.id);
  });
}

export function getFrameMaxZIndex(page: Page, frameId: string): number {
  return Math.max(0, ...frameLayerNodes(page, frameId).map((node) => node.canvas?.zIndex ?? 0));
}

export function getNextFrameZIndex(page: Page, frameId: string): number {
  return getFrameMaxZIndex(page, frameId) + 1;
}

export function bringNodeToFrontByZIndex(page: Page, nodeId: string, frameId: string): LayerZIndexPatch[] {
  const node = page.nodes[nodeId];
  if (!node || node.id === page.rootNodeId || !nodeBelongsToFrame(node, frameId)) return [];
  return [{ nodeId, zIndex: getNextFrameZIndex(page, frameId) }];
}

export function sendNodeToBackByZIndex(page: Page, nodeId: string, frameId: string): LayerZIndexPatch[] {
  const node = page.nodes[nodeId];
  if (!node || node.id === page.rootNodeId || !nodeBelongsToFrame(node, frameId)) return [];
  const minZ = Math.min(0, ...frameLayerNodes(page, frameId).map((item) => item.canvas?.zIndex ?? 0));
  return [{ nodeId, zIndex: minZ - 1 }];
}

function swapAdjacentLayer(page: Page, nodeId: string, frameId: string, direction: 'forward' | 'backward'): LayerZIndexPatch[] {
  const layers = sortNodesByZIndex(frameLayerNodes(page, frameId));
  const index = layers.findIndex((node) => node.id === nodeId);
  const targetIndex = direction === 'forward' ? index + 1 : index - 1;
  const node = layers[index];
  const target = layers[targetIndex];
  if (!node || !target) return [];
  return [
    { nodeId: node.id, zIndex: target.canvas?.zIndex ?? 0 },
    { nodeId: target.id, zIndex: node.canvas?.zIndex ?? 0 },
  ];
}

export function moveNodeForwardByZIndex(page: Page, nodeId: string, frameId: string): LayerZIndexPatch[] {
  return swapAdjacentLayer(page, nodeId, frameId, 'forward');
}

export function moveNodeBackwardByZIndex(page: Page, nodeId: string, frameId: string): LayerZIndexPatch[] {
  return swapAdjacentLayer(page, nodeId, frameId, 'backward');
}

export function reorderLayerStackByZIndex(page: Page, orderedNodeIds: string[], frameId: string): LayerZIndexPatch[] {
  const validIds = new Set(frameLayerNodes(page, frameId).map((node) => node.id));
  return orderedNodeIds
    .filter((nodeId) => validIds.has(nodeId))
    .map((nodeId, index) => ({ nodeId, zIndex: index + 1 }));
}

export function cloneNodesWithNewIds(page: Page, nodeIds: string[], options: CloneNodesOptions = {}): CloneNodesResult {
  const subtreeIds = new Set<string>();
  nodeIds.forEach((nodeId) => collectSubtreeIds(page, nodeId, subtreeIds));

  const idFactory = options.idFactory ?? ((oldId: string) => createId(`${oldId}_copy`));
  const idMap: Record<string, string> = {};
  for (const oldId of subtreeIds) {
    idMap[oldId] = idFactory(oldId);
  }

  const nodes: Record<string, ComponentNode> = {};
  for (const oldId of subtreeIds) {
    const source = page.nodes[oldId];
    const newId = idMap[oldId];
    if (!source || !newId) continue;

    const cloned = cloneNode(source);
    cloned.id = newId;
    if (cloned.children) cloned.children = cloned.children.map((childId) => idMap[childId] ?? childId);
    if (cloned.canvas || cloned.layout || options.offset || options.targetFrameId) {
      const canvas = canvasFor(cloned);
      if (options.offset) {
        canvas.x += options.offset.x;
        canvas.y += options.offset.y;
      }
      if (options.targetFrameId) canvas.parentFrameId = options.targetFrameId;
      cloned.canvas = canvas;
    }
    nodes[newId] = cloned;
  }

  if (options.placeAtHighestLayer && options.targetFrameId) {
    let zIndex = getNextFrameZIndex(page, options.targetFrameId);
    for (const rootId of resultSubtreeOrder(rootIdsFromMap(nodeIds, idMap), nodes)) {
      const node = nodes[rootId];
      if (!node) continue;
      node.canvas = { ...canvasFor(node), parentFrameId: options.targetFrameId, zIndex };
      zIndex += 1;
    }
  }

  return {
    nodes,
    rootIds: nodeIds.map((nodeId) => idMap[nodeId]).filter((nodeId): nodeId is string => Boolean(nodeId)),
    idMap,
  };
}

function rootIdsFromMap(nodeIds: string[], idMap: Record<string, string>): string[] {
  return nodeIds.map((nodeId) => idMap[nodeId]).filter((nodeId): nodeId is string => Boolean(nodeId));
}

function resultSubtreeOrder(rootIds: string[], nodes: Record<string, ComponentNode>): string[] {
  const ordered: string[] = [];
  const visit = (nodeId: string) => {
    if (ordered.includes(nodeId)) return;
    ordered.push(nodeId);
    nodes[nodeId]?.children?.forEach(visit);
  };
  rootIds.forEach(visit);
  return ordered;
}

export function setNodeCanvasLocked(node: ComponentNode, locked: boolean): ComponentNode {
  return withCanvas(node, { ...canvasFor(node), locked });
}

export function setNodeCanvasHidden(node: ComponentNode, hidden: boolean): ComponentNode {
  return withCanvas(node, { ...canvasFor(node), hidden });
}

export function alignNodesByCanvas(nodes: ComponentNode[], alignment: CanvasAlignment): ComponentNode[] {
  const unlocked = getUnlockedNodes(nodes);
  if (unlocked.length === 0) return nodes.map((item) => ensureNodeCanvas(item));

  const bounds = getSelectionBounds(unlocked);
  return nodes.map((item) => {
    const canvas = canvasFor(item);
    if (canvas.locked) return withCanvas(item, canvas);

    if (alignment === 'left') canvas.x = bounds.left;
    if (alignment === 'center') canvas.x = bounds.left + (bounds.right - bounds.left - canvas.width) / 2;
    if (alignment === 'right') canvas.x = bounds.right - canvas.width;
    if (alignment === 'top') canvas.y = bounds.top;
    if (alignment === 'middle') canvas.y = bounds.top + (bounds.bottom - bounds.top - canvas.height) / 2;
    if (alignment === 'bottom') canvas.y = bounds.bottom - canvas.height;

    return withCanvas(item, canvas);
  });
}

export function distributeNodesByCanvas(nodes: ComponentNode[], direction: DistributionDirection): ComponentNode[] {
  const indexed = nodes.map((item, index) => ({ item, index, canvas: canvasFor(item) }));
  const unlocked = indexed.filter(({ canvas }) => !canvas.locked);
  if (unlocked.length < 3) return indexed.map(({ item, canvas }) => withCanvas(item, canvas));

  const axis = direction === 'horizontal' ? 'x' : 'y';
  const size = direction === 'horizontal' ? 'width' : 'height';
  const sorted = [...unlocked].sort((left, right) => left.canvas[axis] - right.canvas[axis]);
  const start = sorted[0]!.canvas[axis];
  const end = sorted[sorted.length - 1]!.canvas[axis] + sorted[sorted.length - 1]!.canvas[size];
  const totalSize = sorted.reduce((sum, entry) => sum + entry.canvas[size], 0);
  const gap = (end - start - totalSize) / (sorted.length - 1);

  let cursor = start;
  const nextCanvases = new Map<number, NodeCanvasConfig>();
  for (const entry of sorted) {
    nextCanvases.set(entry.index, { ...entry.canvas, [axis]: cursor });
    cursor += entry.canvas[size] + gap;
  }

  return indexed.map(({ item, index, canvas }) => withCanvas(item, nextCanvases.get(index) ?? canvas));
}

export function matchNodesCanvasSize(nodes: ComponentNode[], match: CanvasSizeMatch): ComponentNode[] {
  const unlocked = nodes.map((item) => ({ item, canvas: canvasFor(item) })).filter(({ canvas }) => !canvas.locked);
  const source = unlocked[0]?.canvas;
  if (!source) return nodes.map((item) => ensureNodeCanvas(item));

  return nodes.map((item) => {
    const canvas = canvasFor(item);
    if (canvas.locked) return withCanvas(item, canvas);
    return withCanvas(item, {
      ...canvas,
      width: match === 'width' || match === 'both' ? source.width : canvas.width,
      height: match === 'height' || match === 'both' ? source.height : canvas.height,
    });
  });
}
