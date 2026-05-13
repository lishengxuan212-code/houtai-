import { describe, expect, it } from 'vitest';
import { createCanvasImageNode, fitCanvasImageSize } from '../editor/canvasImagePlacement';

describe('canvas image placement', () => {
  it('creates a serializable ImageWidget node for canvas placement', () => {
    const node = createCanvasImageNode({
      src: 'data:image/svg+xml;base64,PHN2Zy8+',
      fileName: 'icon.svg',
      canvas: { x: 40, y: 56, width: 120, height: 90, zIndex: 7, parentFrameId: 'frame_a' },
    });

    expect(node.type).toBe('ImageWidget');
    expect(node.name).toBe('图片：icon.svg');
    expect(node.props).toMatchObject({
      src: 'data:image/svg+xml;base64,PHN2Zy8+',
      alt: 'icon.svg',
      fit: 'contain',
    });
    expect(node.canvas).toEqual({ x: 40, y: 56, width: 120, height: 90, zIndex: 7, parentFrameId: 'frame_a' });
  });

  it('fits large pasted images into a practical canvas size', () => {
    expect(fitCanvasImageSize({ width: 1600, height: 900 })).toEqual({ width: 520, height: 293 });
    expect(fitCanvasImageSize({ width: 80, height: 40 })).toEqual({ width: 80, height: 45 });
    expect(fitCanvasImageSize()).toEqual({ width: 320, height: 180 });
  });
});
