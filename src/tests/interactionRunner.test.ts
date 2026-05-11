import { describe, expect, it } from 'vitest';
import { reorderInteractionActions } from '../interactions/actions';
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
  it('executes multiple actions in declared order against intermediate runtime state', () => {
    const project = {
      ...initialProject,
      variables: [{ id: 'var_form_name', name: 'Form name', scope: 'runtime' as const, value: '' }],
      interactions: [
        {
          id: 'ordered_actions',
          name: 'Ordered actions',
          trigger: { componentId: 'button_add_order', event: 'click' as const },
          enabled: true,
          actions: [
            { type: 'setFormValue' as const, targetNodeId: 'node_add_order_form', field: 'customerName', value: { kind: 'literal' as const, value: 'Acme' } },
            { type: 'setVariable' as const, variableId: 'var_form_name', value: { kind: 'form' as const, formId: 'node_add_order_form', path: 'customerName' } },
          ],
        },
      ],
    };

    const next = runInteraction(project, createRuntimeState(project, 'page_orders'), { componentId: 'button_add_order', event: 'click' });

    expect(next.forms.node_add_order_form).toEqual({ customerName: 'Acme' });
    expect(next.variables.var_form_name).toBe('Acme');
  });

  it('applies runtime action effects for drawers pages props forms tabs scroll and disabled state', () => {
    const project = {
      ...initialProject,
      interactions: [
        {
          id: 'runtime_actions',
          name: 'Runtime actions',
          trigger: { componentId: 'button_add_order', event: 'click' as const },
          enabled: true,
          actions: [
            { type: 'openDrawer' as const, targetNodeId: 'node_order_detail_drawer' },
            { type: 'closeDrawer' as const, targetNodeId: 'node_order_detail_drawer' },
            { type: 'openModal' as const, targetNodeId: 'node_add_order_modal' },
            { type: 'setNodeProp' as const, targetNodeId: 'button_add_order', propKey: 'text', value: { kind: 'literal' as const, value: 'Changed' } },
            { type: 'setFormValue' as const, targetNodeId: 'node_add_order_form', field: 'amount', value: { kind: 'literal' as const, value: 128 } },
            { type: 'resetForm' as const, targetNodeId: 'node_add_order_form' },
            { type: 'selectTab' as const, targetNodeId: 'node_order_tabs', tabKey: 'detail' },
            { type: 'disableNode' as const, targetNodeId: 'button_add_order' },
            { type: 'scrollToNode' as const, targetNodeId: 'node_orders_table' },
            { type: 'showMessage' as const, level: 'info' as const, message: 'Done' },
            { type: 'navigateToPage' as const, targetPageId: 'page_order_detail' },
          ],
        },
      ],
    };

    const next = runInteraction(project, createRuntimeState(project, 'page_orders'), { componentId: 'button_add_order', event: 'click' });

    expect(next.openNodes).toEqual(['node_add_order_modal']);
    expect(next.nodeProps.button_add_order).toEqual({ text: 'Changed' });
    expect(next.forms.node_add_order_form).toEqual({});
    expect(next.activeTabs.node_order_tabs).toBe('detail');
    expect(next.nodeDisabled.button_add_order).toBe(true);
    expect(next.scrollRequests.at(-1)?.targetNodeId).toBe('node_orders_table');
    expect(next.messages.at(-1)?.message).toBe('Done');
    expect(next.currentPageId).toBe('page_order_detail');
  });

  it('reorders interaction actions without mutating the original list', () => {
    const actions = [
      { type: 'showMessage' as const, level: 'info' as const, message: 'First' },
      { type: 'showMessage' as const, level: 'info' as const, message: 'Second' },
      { type: 'showMessage' as const, level: 'info' as const, message: 'Third' },
    ];

    const reordered = reorderInteractionActions(actions, 0, 2);

    expect(reordered.map((action) => (action.type === 'showMessage' ? action.message : ''))).toEqual(['Second', 'Third', 'First']);
    expect(actions.map((action) => (action.type === 'showMessage' ? action.message : ''))).toEqual(['First', 'Second', 'Third']);
  });
});
