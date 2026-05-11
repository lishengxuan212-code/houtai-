import type { CSSProperties } from 'react';
import { ensureNodeCanvas, filterNodesForFrame } from '../domain/canvas';
import type { ComponentNode, NodeCanvasConfig, Page, PageFrame } from '../domain/types';

export function selectPreviewFrame(page: Page, activeFrameId?: string): PageFrame | undefined {
  if (!page.frames?.length) return undefined;
  return page.frames.find((frame) => frame.id === activeFrameId) ?? page.frames[0];
}

export function getPreviewFrameNodes(page: Page, frameId: string): ComponentNode[] {
  return filterNodesForFrame(page, frameId, { includeHidden: true });
}

export function getCanvasNodeStyle(node: ComponentNode): CSSProperties {
  const canvas = ensureNodeCanvas(node).canvas as NodeCanvasConfig;
  return {
    position: 'absolute',
    left: canvas.x,
    top: canvas.y,
    width: canvas.width,
    height: canvas.height,
    zIndex: canvas.zIndex,
    overflow: 'hidden',
    boxSizing: 'border-box',
  };
}

export function getPreviewFrameStyle(frame: PageFrame): CSSProperties {
  return {
    position: 'relative',
    width: frame.width,
    height: frame.height,
    overflow: 'hidden',
    backgroundColor: frame.background?.color,
    backgroundImage: frame.background?.imageUrl ? `url(${frame.background.imageUrl})` : undefined,
    backgroundSize: frame.background?.imageUrl ? 'cover' : undefined,
    backgroundPosition: frame.background?.imageUrl ? 'center' : undefined,
  };
}
