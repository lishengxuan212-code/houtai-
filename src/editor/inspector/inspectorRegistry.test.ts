import { describe, expect, it } from 'vitest';
import { GenericInspector } from './GenericInspector';
import { getInspector, hasCustomInspector } from './inspectorRegistry';

describe('inspectorRegistry', () => {
  it('routes V1.1 custom inspectors by component type', () => {
    expect(hasCustomInspector('Button')).toBe(true);
    expect(hasCustomInspector('Table')).toBe(true);
    expect(hasCustomInspector('Form')).toBe(true);
    expect(hasCustomInspector('SearchBar')).toBe(true);
    expect(hasCustomInspector('Modal')).toBe(true);
    expect(hasCustomInspector('Drawer')).toBe(true);
    expect(hasCustomInspector('Section')).toBe(true);
  });

  it('falls back to the generic inspector for unmapped components', () => {
    expect(getInspector('Unknown')).toBe(GenericInspector);
  });
});
