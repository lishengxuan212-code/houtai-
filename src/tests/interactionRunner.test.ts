import { describe, expect, it } from 'vitest';
import { runInteraction } from '../interactions/runner';
import { createRuntimeState } from '../runtime/runtimeState';
import { initialProject } from '../store/initialProject';

describe('interaction runner', () => {
  it('opens modal from button click', () => {
    const state = createRuntimeState(initialProject, 'page_orders');
    const next = runInteraction(initialProject, state, { componentId: 'button_add_order', event: 'click' });
    expect(next.openNodes).toContain('node_add_order_modal');
  });

  it('submits form, closes modal, refreshes data, and shows message', () => {
    const state = { ...createRuntimeState(initialProject, 'page_orders'), openNodes: ['node_add_order_modal'] };
    const next = runInteraction(initialProject, state, {
      componentId: 'node_add_order_form',
      event: 'submit',
      payload: { values: { orderNo: 'SO-NEW', customerName: '测试客户', amount: 99, status: '待发货' } },
    });
    expect(next.openNodes).not.toContain('node_add_order_modal');
    expect(next.data.ds_orders?.[0]?.orderNo).toBe('SO-NEW');
    expect(next.messages.at(-1)?.message).toBe('订单已创建');
  });

  it('navigates between pages', () => {
    const state = createRuntimeState(initialProject, 'page_order_detail');
    const next = runInteraction(initialProject, state, { componentId: 'button_back_orders', event: 'click' });
    expect(next.currentPageId).toBe('page_orders');
  });

  it('sets current row from table action', () => {
    const row = { id: 'order_1', orderNo: 'SO1' };
    const state = createRuntimeState(initialProject, 'page_orders');
    const next = runInteraction(initialProject, state, { componentId: 'node_orders_table:详情', event: 'click', payload: { row } });
    expect(next.currentRow).toEqual(row);
    expect(next.openNodes).toContain('node_order_detail_drawer');
  });

  it('refreshes data from search trigger', () => {
    const state = createRuntimeState(initialProject, 'page_orders');
    const next = runInteraction(initialProject, state, { componentId: 'node_orders_search', event: 'search', payload: { values: { status: '已发货' } } });
    expect(next.refreshCount.ds_orders).toBe(1);
    expect(next.variables.var_search_params).toEqual({ status: '已发货' });
  });
});
