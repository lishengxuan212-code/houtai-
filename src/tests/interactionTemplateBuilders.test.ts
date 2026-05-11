import { describe, expect, it } from 'vitest';
import { InteractionSchema } from '../domain/schemas';
import { buildInteractionTemplate } from '../interactions/templateBuilders';
import { initialProject } from '../store/initialProject';

describe('interaction template builders', () => {
  it('builds buttonOpenModal DSL', () => {
    const result = buildInteractionTemplate(initialProject, {
      templateId: 'buttonOpenModal',
      triggerComponentId: 'button_add_order',
      targetNodeId: 'node_add_order_modal',
    });

    expect(result.errors).toEqual([]);
    expect(result.interactions).toHaveLength(1);
    expect(InteractionSchema.safeParse(result.interactions[0]).success).toBe(true);
    expect(result.interactions[0]?.actions).toEqual([{ type: 'openModal', targetNodeId: 'node_add_order_modal' }]);
  });

  it('builds formSubmit DSL with submit, close, refresh, and success message', () => {
    const result = buildInteractionTemplate(initialProject, {
      templateId: 'formSubmit',
      triggerComponentId: 'node_add_order_form',
      dataSourceId: 'ds_orders',
      targetNodeId: 'node_add_order_modal',
      message: '保存成功',
    });

    expect(result.errors).toEqual([]);
    expect(result.interactions[0]?.actions.map((action) => action.type)).toEqual(['submitMock', 'closeModal', 'refreshData', 'showMessage']);
  });

  it('rejects missing targets', () => {
    const result = buildInteractionTemplate(initialProject, {
      templateId: 'buttonOpenModal',
      triggerComponentId: 'button_add_order',
      targetNodeId: 'missing_modal',
    });

    expect(result.interactions).toEqual([]);
    expect(result.errors).toContain('目标组件不存在');
  });
  it('builds visibility and enablement action templates', () => {
    const show = buildInteractionTemplate(initialProject, {
      templateId: 'showNode',
      triggerComponentId: 'button_add_order',
      targetNodeId: 'node_add_order_modal',
    });
    const disable = buildInteractionTemplate(initialProject, {
      templateId: 'disableNode',
      triggerComponentId: 'button_add_order',
      targetNodeId: 'node_add_order_modal',
    });

    expect(show.errors).toEqual([]);
    expect(show.interactions[0]?.actions).toEqual([{ type: 'showNode', targetNodeId: 'node_add_order_modal' }]);
    expect(disable.errors).toEqual([]);
    expect(disable.interactions[0]?.actions).toEqual([{ type: 'disableNode', targetNodeId: 'node_add_order_modal' }]);
    expect(InteractionSchema.safeParse(show.interactions[0]).success).toBe(true);
    expect(InteractionSchema.safeParse(disable.interactions[0]).success).toBe(true);
  });
});
