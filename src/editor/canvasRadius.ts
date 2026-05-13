import type { JsonValue, NodeCanvasConfig } from '../domain/types';

export function numberProp(value: JsonValue | undefined, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function clampCanvasCornerRadius(radius: number, size: Pick<NodeCanvasConfig, 'width' | 'height'>): number {
  const maxRadius = Math.max(0, Math.floor(Math.min(size.width, size.height) / 2));
  return Math.min(maxRadius, Math.max(0, Math.round(radius)));
}

export function dragCanvasCornerRadius(params: {
  startRadius: number;
  deltaX: number;
  deltaY: number;
  width: number;
  height: number;
}): number {
  return clampCanvasCornerRadius(params.startRadius + params.deltaX, params);
}
