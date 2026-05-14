import { describe, expect, it } from 'vitest';
import { computeCanvasSnap, detectEqualSpacing } from '../domain/layoutAssist';

describe('canvas layout assist', () => {
  it('snaps a moving rect to frame edges and reports alignment guides', () => {
    const result = computeCanvasSnap({
      moving: { id: 'moving', x: 4, y: 96, width: 120, height: 48 },
      others: [],
      frame: { id: 'frame', x: 0, y: 0, width: 800, height: 600 },
      threshold: 6,
    });

    expect(result.rect.x).toBe(0);
    expect(result.deltaX).toBe(-4);
    expect(result.guides).toContainEqual({ axis: 'x', position: 0, from: 0, to: 600, kind: 'frame', label: 'Frame left' });
  });

  it('snaps left center and right anchors to nearby component anchors', () => {
    const result = computeCanvasSnap({
      moving: { id: 'moving', x: 197, y: 144, width: 120, height: 48 },
      others: [{ id: 'other', x: 80, y: 40, width: 120, height: 48 }],
      frame: { id: 'frame', x: 0, y: 0, width: 800, height: 600 },
      threshold: 6,
    });

    expect(result.rect.x).toBe(200);
    expect(result.deltaX).toBe(3);
    expect(result.guides.some((guide) => guide.axis === 'x' && guide.position === 200 && guide.kind === 'node')).toBe(true);
  });

  it('detects equal spacing when a moved component matches adjacent gaps', () => {
    const hints = detectEqualSpacing({
      moving: { id: 'middle', x: 180, y: 40, width: 80, height: 48 },
      others: [
        { id: 'left', x: 60, y: 40, width: 80, height: 48 },
        { id: 'right', x: 300, y: 40, width: 80, height: 48 },
      ],
      threshold: 2,
    });

    expect(hints).toContainEqual({ axis: 'x', gap: 40, start: 140, end: 300 });
  });
});
