import { describe, expect, it } from 'vitest';
import { createNode } from '../registry/createNode';
import { createComponentPreset } from '../registry/componentPresetRegistry';
import { clearComponentLibraryState, getComponentDefaultOverrides, restoreComponentDefaultProps, saveComponentDefaultProps, saveComponentPreset } from '../store/componentLibraryStore';

describe('component library editor state', () => {
  it('saves default props for future nodes without changing existing node props', () => {
    clearComponentLibraryState();
    const existing = createNode('Button');

    saveComponentDefaultProps('Button', { text: '确认' }, '2026-05-07T00:00:00.000Z');
    const next = createNode('Button');

    expect(existing.props.text).not.toBe('确认');
    expect(next.props.text).toBe('确认');
    expect(getComponentDefaultOverrides().Button?.text).toBe('确认');
  });

  it('restores system defaults and persists component presets separately', () => {
    clearComponentLibraryState();
    saveComponentDefaultProps('Button', { text: '确认' }, '2026-05-07T00:00:00.000Z');
    restoreComponentDefaultProps('Button');
    const preset = createComponentPreset({
      name: '主要确认按钮',
      baseComponentType: 'Button',
      category: '通用',
      props: { text: '确认', variant: 'primary', danger: false },
      now: '2026-05-07T00:00:00.000Z',
    });

    saveComponentPreset(preset);

    expect(createNode('Button').props.text).not.toBe('确认');
    expect(getComponentDefaultOverrides().Button).toBeUndefined();
  });
});
