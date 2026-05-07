import type { NodeCanvasConfig } from './types';

export type CanvasViewportBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CanvasViewportEntry = {
  nodeId: string;
  canvas: NodeCanvasConfig;
};

function intersects(left: CanvasViewportBounds, right: CanvasViewportBounds): boolean {
  return left.x < right.x + right.width && left.x + left.width > right.x && left.y < right.y + right.height && left.y + left.height > right.y;
}

export function nodeIntersectsViewport(canvas: NodeCanvasConfig, viewport: CanvasViewportBounds, overscan = 120): boolean {
  return intersects(
    {
      x: canvas.x,
      y: canvas.y,
      width: canvas.width,
      height: canvas.height,
    },
    {
      x: viewport.x - overscan,
      y: viewport.y - overscan,
      width: viewport.width + overscan * 2,
      height: viewport.height + overscan * 2,
    },
  );
}

export function visibleCanvasNodeIds({
  entries,
  viewport,
  selectedNodeIds = [],
  draggingNodeId,
  editingNodeId,
}: {
  entries: CanvasViewportEntry[];
  viewport: CanvasViewportBounds;
  selectedNodeIds?: string[];
  draggingNodeId?: string;
  editingNodeId?: string;
}): Set<string> {
  const keep = new Set<string>(selectedNodeIds);
  if (draggingNodeId) keep.add(draggingNodeId);
  if (editingNodeId) keep.add(editingNodeId);

  for (const entry of entries) {
    if (keep.has(entry.nodeId) || nodeIntersectsViewport(entry.canvas, viewport)) keep.add(entry.nodeId);
  }

  return keep;
}
