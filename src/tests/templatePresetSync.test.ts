import { describe, expect, it } from 'vitest';
import type { ComponentNode } from '../domain/types';
import { componentPresetToTemplate, templateToComponentPreset } from '../templates/templateOperations';
import { createComponentPreset } from '../registry/componentPresetRegistry';

describe('template preset sync', () => {
  it('converts component presets and component templates while preserving props', () => {
    const preset = createComponentPreset({
      name: '订单高级表格',
      baseComponentType: 'pro.ProTable',
      category: '订单',
      props: { headerTitle: '订单列表', columns: [{ key: 'orderNo', title: '订单号' }] },
      now: '2026-05-07T00:00:00.000Z',
    });

    const template = componentPresetToTemplate(preset);
    const roundTrip = templateToComponentPreset(template, '2026-05-07T00:00:00.000Z');

    expect(template.type).toBe('componentPreset');
    expect((template.content.nodes[template.content.rootNodeId] as ComponentNode).props.headerTitle).toBe('订单列表');
    expect(roundTrip.baseComponentType).toBe('pro.ProTable');
    expect(roundTrip.props.columns).toEqual([{ key: 'orderNo', title: '订单号' }]);
  });
});
