import { describe, expect, it } from 'vitest';
import { resizeCanvasRect } from '../editor/canvasResize';

const startCanvas = { x: 40, y: 50, width: 320, height: 180, zIndex: 1, parentFrameId: 'frame_a' };

describe('canvas resize', () => {
  it('keeps image aspect ratio when resizing from a corner', () => {
    expect(resizeCanvasRect({ startCanvas, handle: 'se', deltaX: 160, deltaY: 10, preserveAspectRatio: true })).toMatchObject({
      x: 40,
      y: 50,
      width: 480,
      height: 270,
    });
  });

  it('keeps image aspect ratio and anchors the opposite side from west handles', () => {
    expect(resizeCanvasRect({ startCanvas, handle: 'w', deltaX: -160, deltaY: 0, preserveAspectRatio: true })).toMatchObject({
      x: -120,
      y: 50,
      width: 480,
      height: 270,
    });
  });

  it('keeps regular components freeform resizable', () => {
    expect(resizeCanvasRect({ startCanvas, handle: 'se', deltaX: 40, deltaY: 30 })).toMatchObject({
      width: 360,
      height: 210,
    });
  });
});
