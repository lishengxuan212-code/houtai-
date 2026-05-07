import type { Action, ComponentEvent } from '../domain/types';

export type InteractionTemplate = {
  id: string;
  name: string;
  trigger: ComponentEvent;
  actions: Action[];
};

export const interactionTemplates: InteractionTemplate[] = [
  { id: 'searchRefreshTable', name: '搜索刷新表格', trigger: 'search', actions: [{ type: 'refreshData', dataSourceId: 'ds_orders' }] },
  { id: 'buttonOpenModal', name: '按钮打开弹窗', trigger: 'click', actions: [{ type: 'openModal', targetNodeId: 'node_add_order_modal' }] },
  {
    id: 'modalFormSubmit',
    name: '弹窗表单提交',
    trigger: 'submit',
    actions: [
      { type: 'submitMock', dataSourceId: 'ds_orders', payloadFrom: 'form', operation: 'create' },
      { type: 'closeModal', targetNodeId: 'node_add_order_modal' },
      { type: 'showMessage', level: 'success', message: '提交成功' },
    ],
  },
  { id: 'buttonNavigate', name: '按钮跳转页面', trigger: 'click', actions: [{ type: 'navigate', targetPageId: 'page_orders' }] },
  { id: 'rowOpenDrawer', name: '行点击打开抽屉', trigger: 'rowClick', actions: [{ type: 'openModal', targetNodeId: 'node_order_detail_drawer' }] },
  { id: 'formSubmitShowMessage', name: '表单提交提示', trigger: 'submit', actions: [{ type: 'showMessage', level: 'success', message: '提交成功' }] },
];
