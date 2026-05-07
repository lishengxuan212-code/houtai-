import { describe, expect, it } from 'vitest';
import { getDescriptor } from '../registry/componentRegistry';
import { getComponentDefinition, listComponentDefinitions } from '../registry/componentDefinitionRegistry';
import { createNode } from '../registry/createNode';

const prototypeWidgetTypes = [
  'H1',
  'H2',
  'H3',
  'BodyText',
  'HelperText',
  'LinkText',
  'ErrorText',
  'Annotation',
  'StickyNote',
  'Rectangle',
  'Circle',
  'Line',
  'Arrow',
  'ImageWidget',
  'IconWidget',
  'Placeholder',
  'DividerWidget',
  'HotZone',
  'ModuleTitle',
  'PageTitle',
  'StatusLabel',
  'AmountText',
  'NumericText',
  'TimeText',
];

describe('prototype widget registry', () => {
  it('registers all S2.3 prototype widgets as descriptors and component definitions', () => {
    const definitionTypes = new Set(listComponentDefinitions().map((definition) => definition.type));

    for (const type of prototypeWidgetTypes) {
      expect(getDescriptor(type), type).toBeDefined();
      expect(definitionTypes.has(type), type).toBe(true);
      expect(createNode(type).props).toEqual(expect.objectContaining(getDescriptor(type)?.defaultProps));
    }
  });

  it('gives text widgets visual style fields instead of raw JSON fields', () => {
    const h1 = getComponentDefinition('H1');
    const fieldPaths = h1?.propSchema.flatMap((group) => group.fields.map((field) => field.path)) ?? [];
    const editors = h1?.propSchema.flatMap((group) => group.fields.map((field) => field.editor)) ?? [];

    expect(fieldPaths).toEqual(
      expect.arrayContaining([
        'props.content',
        'props.fontSize',
        'props.fontWeight',
        'props.color',
        'props.fontFamily',
        'props.lineHeight',
        'props.letterSpacing',
        'props.align',
        'props.underline',
        'props.strikethrough',
        'props.background',
        'props.border',
        'props.radius',
        'props.padding',
        'props.width',
        'props.height',
        'props.wrapping',
        'props.ellipsis',
      ]),
    );
    expect(editors).not.toContain('json');
  });

  it('uses clear preview labels for component cards and metadata', () => {
    expect(getDescriptor('H1')?.displayName).toBe('H1');
    expect(getDescriptor('BodyText')?.displayName).toBe('body text');
    expect(getDescriptor('HelperText')?.displayName).toBe('helper text');
    expect(getDescriptor('LinkText')?.displayName).toBe('link text');
    expect(getDescriptor('ErrorText')?.displayName).toBe('error text');
    expect(getDescriptor('StatusLabel')?.displayName).toBe('status text');
    expect(getDescriptor('AmountText')?.displayName).toBe('amount text');
  });
});
