import type { NodeCanvasConfig } from '../domain/types';

const MIN_WIDTH = 80;
const MIN_HEIGHT = 36;

type ResizeHandle = 'n' | 'e' | 's' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

export function resizeCanvasRect(params: {
  startCanvas: NodeCanvasConfig;
  handle: ResizeHandle;
  deltaX: number;
  deltaY: number;
  preserveAspectRatio?: boolean;
  minWidth?: number;
  minHeight?: number;
}): NodeCanvasConfig {
  const minWidth = params.minWidth ?? MIN_WIDTH;
  const minHeight = params.minHeight ?? MIN_HEIGHT;
  const { startCanvas, handle, deltaX, deltaY } = params;

  if (!params.preserveAspectRatio) {
    const next = { ...startCanvas };
    if (handle.includes('w')) {
      const width = Math.max(minWidth, startCanvas.width - deltaX);
      next.width = Math.round(width);
      next.x = Math.round(startCanvas.x + startCanvas.width - width);
    } else if (handle.includes('e')) {
      next.width = Math.max(minWidth, Math.round(startCanvas.width + deltaX));
    }

    if (handle.includes('n')) {
      const height = Math.max(minHeight, startCanvas.height - deltaY);
      next.height = Math.round(height);
      next.y = Math.round(startCanvas.y + startCanvas.height - height);
    } else if (handle.includes('s')) {
      next.height = Math.max(minHeight, Math.round(startCanvas.height + deltaY));
    }
    return next;
  }

  const aspectRatio = startCanvas.width / Math.max(1, startCanvas.height);
  const widthFromHorizontal = handle.includes('w') ? startCanvas.width - deltaX : handle.includes('e') ? startCanvas.width + deltaX : undefined;
  const heightFromVertical = handle.includes('n') ? startCanvas.height - deltaY : handle.includes('s') ? startCanvas.height + deltaY : undefined;
  const widthFromVertical = heightFromVertical === undefined ? undefined : heightFromVertical * aspectRatio;
  const targetWidth = Math.max(minWidth, widthFromHorizontal ?? widthFromVertical ?? startCanvas.width);
  const verticalTargetWidth = Math.max(minWidth, widthFromVertical ?? targetWidth);
  const nextWidth = Math.round(handle.length === 2 && widthFromHorizontal !== undefined && widthFromVertical !== undefined
    ? Math.max(targetWidth, verticalTargetWidth)
    : targetWidth);
  const nextHeight = Math.max(minHeight, Math.round(nextWidth / aspectRatio));
  const next = { ...startCanvas, width: nextWidth, height: nextHeight };

  if (handle.includes('w')) next.x = Math.round(startCanvas.x + startCanvas.width - nextWidth);
  if (handle.includes('n')) next.y = Math.round(startCanvas.y + startCanvas.height - nextHeight);
  return next;
}
