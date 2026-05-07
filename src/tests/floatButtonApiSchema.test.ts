import { describe, expect, it } from 'vitest';
import { getComponentDefinition } from '../registry/componentDefinitionRegistry';
import { createNode } from '../registry/createNode';

function fieldPaths(type: string): string[] {
  const definition = getComponentDefinition(type);
  return [
    ...(definition?.propSchema ?? []),
    ...(definition?.contentSchema ?? []),
    ...(definition?.interactionSchema ?? []),
  ].flatMap((group) => group.fields.map((field) => field.path));
}

describe('FloatButton API schema', () => {
  it('registers FloatButton common API as editable contract fields', () => {
    const definition = getComponentDefinition('FloatButton');

    expect(definition?.apiSchema?.sections.map((section) => section.key)).toContain('common');
    expect(fieldPaths('FloatButton')).toEqual(
      expect.arrayContaining([
        'props.icon',
        'props.content',
        'props.tooltip',
        'props.type',
        'props.shape',
        'props.href',
        'props.target',
        'props.htmlType',
        'props.badge',
        'events.onClick',
      ]),
    );
    expect(definition?.propSchema.find((group) => group.title === '基础')?.fields.map((field) => field.path)).toEqual(
      expect.arrayContaining(['props.type', 'props.shape', 'props.htmlType']),
    );
  });

  it('registers FloatButton.Group and BackTop as separate draggable variants', () => {
    const group = getComponentDefinition('FloatButton.Group');
    const backTop = getComponentDefinition('FloatButton.BackTop');

    expect(group?.nameZh).toBe('悬浮按钮组');
    expect(backTop?.nameZh).toBe('返回顶部');
    expect(fieldPaths('FloatButton.Group')).toEqual(
      expect.arrayContaining(['props.shape', 'props.trigger', 'props.open', 'props.placement', 'props.closeIcon', 'events.onOpenChange', 'events.onClick']),
    );
    expect(fieldPaths('FloatButton.BackTop')).toEqual(expect.arrayContaining(['props.duration', 'props.target', 'props.visibilityHeight', 'events.onClick']));
  });

  it('creates each FloatButton variant with variant-specific defaults', () => {
    expect(createNode('FloatButton').props).toMatchObject({ shape: 'circle', type: 'default' });
    expect(createNode('FloatButton.Group').props).toMatchObject({ shape: 'circle', trigger: 'click', placement: 'top' });
    expect(createNode('FloatButton.BackTop').props).toMatchObject({ duration: 450, visibilityHeight: 400 });
  });
});
