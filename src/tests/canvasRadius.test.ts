import { describe, expect, it } from 'vitest';
import { clampCanvasCornerRadius, dragCanvasCornerRadius } from '../editor/canvasRadius';

describe('canvas corner radius drag', () => {
  it('converts a horizontal Axure-style handle drag into component radius', () => {
    expect(dragCanvasCornerRadius({ startRadius: 8, deltaX: 22, deltaY: 80, width: 120, height: 80 })).toBe(30);
  });

  it('clamps radius to half of the shorter component side', () => {
    expect(clampCanvasCornerRadius(999, { width: 120, height: 80 })).toBe(40);
    expect(dragCanvasCornerRadius({ startRadius: 20, deltaX: -80, deltaY: -12, width: 120, height: 80 })).toBe(0);
  });
});
