import type { ContainerLayoutConfig, NodeLayoutConfig } from './types';

export function normalizeContainerLayout(layout: ContainerLayoutConfig | undefined): ContainerLayoutConfig {
  if (!layout) return { mode: 'stack', gap: 12, align: 'left', justify: 'top' };
  if (layout.mode === 'grid') {
    return {
      ...layout,
      columns: Math.min(12, Math.max(1, Math.trunc(layout.columns))),
      gap: layout.gap ?? 12,
      align: layout.align ?? 'top',
      justify: layout.justify ?? 'stretch',
    };
  }
  if (layout.mode === 'row') return { ...layout, gap: layout.gap ?? 12, align: layout.align ?? 'top', justify: layout.justify ?? 'left' };
  if (layout.mode === 'stack') return { ...layout, gap: layout.gap ?? 12, align: layout.align ?? 'left', justify: layout.justify ?? 'top' };
  return { ...layout, gap: layout.gap ?? 12 };
}

function snap(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

export function clampFreeNodeLayout(
  layout: NodeLayoutConfig,
  bounds: { width: number; height: number; gridSize?: number },
): Required<Pick<NodeLayoutConfig, 'x' | 'y' | 'width' | 'height'>> {
  const width = layout.width ?? 160;
  const height = layout.height ?? 80;
  const gridSize = bounds.gridSize ?? 16;
  const rawX = Math.min(Math.max(layout.x ?? 0, 0), Math.max(bounds.width - width, 0));
  const rawY = Math.min(Math.max(layout.y ?? 0, 0), Math.max(bounds.height - height, 0));
  return {
    x: Math.min(snap(rawX, gridSize), Math.max(bounds.width - width, 0)),
    y: Math.min(snap(rawY, gridSize), Math.max(bounds.height - height, 0)),
    width,
    height,
  };
}
