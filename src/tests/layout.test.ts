import { describe, expect, it } from 'vitest';
import { clampFreeNodeLayout, normalizeContainerLayout } from '../domain/layout';

describe('layout helpers', () => {
  it('defaults containers to stack layout', () => {
    expect(normalizeContainerLayout(undefined)).toEqual({ mode: 'stack', gap: 12, align: 'left', justify: 'top' });
  });

  it('normalizes grid column count to a usable range', () => {
    expect(normalizeContainerLayout({ mode: 'grid', columns: 0, gap: 8 })).toEqual({
      mode: 'grid',
      columns: 1,
      gap: 8,
      align: 'top',
      justify: 'stretch',
    });
    expect(normalizeContainerLayout({ mode: 'grid', columns: 20, gap: 8 })).toEqual({
      mode: 'grid',
      columns: 12,
      gap: 8,
      align: 'top',
      justify: 'stretch',
    });
  });

  it('clamps and snaps free node positions inside the parent', () => {
    expect(clampFreeNodeLayout({ x: 333, y: -20, width: 120, height: 60 }, { width: 300, height: 200, gridSize: 16 })).toEqual({
      x: 176,
      y: 0,
      width: 120,
      height: 60,
    });
  });
});
