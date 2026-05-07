import { describe, expect, it } from 'vitest';
import { createComponentPreset, createNodeFromComponentPreset } from '../registry/componentPresetRegistry';

describe('component presets', () => {
  it('creates serializable presets and nodes without changing the base component definition', () => {
    const preset = createComponentPreset({
      name: 'Order ProTable',
      baseComponentType: 'pro.ProTable',
      category: 'Orders',
      props: {
        headerTitle: 'Order List',
        columns: [{ key: 'orderNo', title: 'Order No', valueType: 'text', search: true }],
      },
      now: '2026-05-07T00:00:00.000Z',
    });

    const node = createNodeFromComponentPreset(preset);

    expect(preset.id).toMatch(/^preset_/);
    expect(node.type).toBe('pro.ProTable');
    expect(node.name).toBe('Order ProTable');
    expect(node.props.headerTitle).toBe('Order List');
    expect(JSON.parse(JSON.stringify(preset))).toEqual(preset);
  });
});
