import { describe, expect, it } from 'vitest';
import { getComponentDefinition, isFoundationNode, listFoundationComponentDefinitions } from '../registry/componentDefinitionRegistry';

describe('component generation capabilities', () => {
  it('declares foundation nodes separately from higher level components', () => {
    const foundationTypes = listFoundationComponentDefinitions().map((definition) => definition.type);

    expect(foundationTypes).toEqual(expect.arrayContaining(['WhitePanel', 'BodyText', 'Button', 'Input', 'Select', 'TableSkeleton']));
    expect(isFoundationNode('TableSkeleton')).toBe(true);
    expect(isFoundationNode('SearchBar')).toBe(false);
    expect(isFoundationNode('pro.ProTable')).toBe(false);
    expect(getComponentDefinition('TableSkeleton')?.generationRole).toBe('foundation');
    expect(getComponentDefinition('SearchBar')?.generationRole).toBe('enhancement');
  });

  it('exposes AI-readable style capabilities for foundation nodes', () => {
    expect(getComponentDefinition('WhitePanel')?.styleCapabilities).toEqual(expect.arrayContaining(['background', 'border', 'borderRadius', 'shadow']));
    expect(getComponentDefinition('Button')?.styleCapabilities).toEqual(expect.arrayContaining(['background', 'borderRadius']));
    expect(getComponentDefinition('TableSkeleton')?.description).toContain('visual');
  });
});
