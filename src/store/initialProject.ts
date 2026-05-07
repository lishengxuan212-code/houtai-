import type { Project } from '../domain/types';

const now = new Date().toISOString();

export const initialProject: Project = {
  id: 'project_ecommerce_orders',
  name: '电商订单后台',
  description: '用于验证结构化后台装配、预览交互、AI 检查和 PRD 导出的默认项目。',
  businessType: 'ecommerce',
  version: 1,
  createdAt: now,
  updatedAt: now,
  variables: [
    { id: 'var_selected_row', name: '当前行', scope: 'runtime', value: null },
    { id: 'var_search_params', name: '搜索参数', scope: 'runtime', value: {} },
    { id: 'var_form_mode', name: '表单模式', scope: 'runtime', value: 'create' },
  ],
  dataSources: [
    {
      id: 'ds_orders',
      name: '订单数据',
      type: 'mock',
      fields: [
        { key: 'orderNo', label: '订单号', type: 'text' },
        { key: 'customerName', label: '客户名称', type: 'text' },
        { key: 'amount', label: '订单金额', type: 'money' },
        { key: 'status', label: '订单状态', type: 'status' },
        { key: 'createdAt', label: '下单时间', type: 'date' },
      ],
      records: [
        { id: 'order_1', orderNo: 'SO20260506001', customerName: '上海零售客户', amount: 1288, status: '待发货', createdAt: '2026-05-06' },
        { id: 'order_2', orderNo: 'SO20260506002', customerName: '杭州渠道客户', amount: 568, status: '已发货', createdAt: '2026-05-05' },
        { id: 'order_3', orderNo: 'SO20260506003', customerName: '北京企业客户', amount: 2399, status: '已退款', createdAt: '2026-05-04' },
      ],
    },
    {
      id: 'ds_order_items',
      name: '商品明细',
      type: 'mock',
      fields: [
        { key: 'sku', label: 'SKU', type: 'text' },
        { key: 'name', label: '商品名称', type: 'text' },
        { key: 'quantity', label: '数量', type: 'number' },
        { key: 'price', label: '单价', type: 'money' },
      ],
      records: [
        { id: 'item_1', sku: 'SKU-001', name: '智能终端 A', quantity: 1, price: 899 },
        { id: 'item_2', sku: 'SKU-002', name: '延保服务', quantity: 1, price: 389 },
      ],
    },
    {
      id: 'ds_refunds',
      name: '退款记录',
      type: 'mock',
      fields: [
        { key: 'refundNo', label: '退款单号', type: 'text' },
        { key: 'amount', label: '退款金额', type: 'money' },
        { key: 'reason', label: '退款原因', type: 'text' },
      ],
      records: [],
    },
  ],
  pages: [
    {
      id: 'page_orders',
      name: '订单管理',
      route: '/orders',
      purpose: '查询、查看、新增、退款、删除订单',
      rootNodeId: 'node_orders_root',
      nodes: {
        node_orders_root: {
          id: 'node_orders_root',
          type: 'PageContainer',
          name: '订单管理页面',
          props: { title: '订单管理', description: '查询、查看、新增、退款、删除订单' },
          children: ['node_orders_search', 'node_orders_toolbar', 'node_orders_table', 'node_add_order_modal', 'node_order_detail_drawer'],
        },
        node_orders_search: {
          id: 'node_orders_search',
          type: 'SearchBar',
          name: '订单搜索区',
          props: {
            fields: [
              { key: 'orderNo', label: '订单号', type: 'text' },
              { key: 'customerName', label: '客户名称', type: 'text' },
              { key: 'status', label: '状态', type: 'select', options: ['全部', '待发货', '已发货', '已退款'] },
            ],
          },
        },
        node_orders_toolbar: {
          id: 'node_orders_toolbar',
          type: 'Section',
          name: '操作栏',
          props: { title: '操作' },
          children: ['button_add_order', 'button_export_orders'],
        },
        button_add_order: {
          id: 'button_add_order',
          type: 'Button',
          name: '新增订单按钮',
          props: { text: '新增订单', variant: 'primary', danger: false },
        },
        button_export_orders: {
          id: 'button_export_orders',
          type: 'Button',
          name: '导出按钮',
          props: { text: '导出', variant: 'default', danger: false },
        },
        node_orders_table: {
          id: 'node_orders_table',
          type: 'Table',
          name: '订单表格',
          props: {
            dataSourceId: 'ds_orders',
            columns: [
              { key: 'orderNo', title: '订单号' },
              { key: 'customerName', title: '客户名称' },
              { key: 'amount', title: '订单金额' },
              { key: 'status', title: '订单状态' },
              { key: 'createdAt', title: '下单时间' },
            ],
            actions: ['详情', '退款', '删除', '备注'],
          },
          bindings: { missingFieldDemo: { source: 'field', path: 'ds_orders.missingField' } },
        },
        node_add_order_modal: {
          id: 'node_add_order_modal',
          type: 'Modal',
          name: '新增订单弹窗',
          props: { title: '新增订单' },
          children: ['node_add_order_form'],
        },
        node_add_order_form: {
          id: 'node_add_order_form',
          type: 'Form',
          name: '新增订单表单',
          props: {
            submitText: '提交订单',
            fields: [
              { key: 'orderNo', label: '订单号', type: 'text', required: true },
              { key: 'customerName', label: '客户名称', type: 'text', required: true },
              { key: 'amount', label: '订单金额', type: 'money', required: true },
              { key: 'status', label: '订单状态', type: 'select', options: ['待发货', '已发货'], required: true },
            ],
          },
        },
        node_order_detail_drawer: {
          id: 'node_order_detail_drawer',
          type: 'Drawer',
          name: '订单详情抽屉',
          props: { title: '订单详情' },
          children: ['node_order_detail_card'],
        },
        node_order_detail_card: {
          id: 'node_order_detail_card',
          type: 'Card',
          name: '订单基础信息',
          props: { title: '订单基础信息' },
        },
      },
    },
    {
      id: 'page_order_detail',
      name: '订单详情',
      route: '/orders/detail',
      purpose: '查看订单基础信息和商品明细',
      rootNodeId: 'node_detail_root',
      nodes: {
        node_detail_root: {
          id: 'node_detail_root',
          type: 'PageContainer',
          name: '订单详情页面',
          props: { title: '订单详情', description: '查看订单基础信息和商品明细' },
          children: ['node_detail_card', 'node_item_table', 'button_back_orders'],
        },
        node_detail_card: {
          id: 'node_detail_card',
          type: 'Card',
          name: '订单基础信息',
          props: { title: '订单基础信息' },
        },
        node_item_table: {
          id: 'node_item_table',
          type: 'Table',
          name: '商品明细',
          props: {
            dataSourceId: 'ds_order_items',
            columns: [
              { key: 'sku', title: 'SKU' },
              { key: 'name', title: '商品名称' },
              { key: 'quantity', title: '数量' },
              { key: 'price', title: '单价' },
            ],
            actions: [],
          },
        },
        button_back_orders: {
          id: 'button_back_orders',
          type: 'Button',
          name: '返回按钮',
          props: { text: '返回', variant: 'default', danger: false },
        },
      },
    },
    {
      id: 'page_refunds',
      name: '退款处理',
      route: '/refunds',
      purpose: '处理订单退款申请',
      rootNodeId: 'node_refund_root',
      nodes: {
        node_refund_root: {
          id: 'node_refund_root',
          type: 'PageContainer',
          name: '退款处理页面',
          props: { title: '退款处理', description: '处理订单退款申请' },
          children: ['node_refund_form', 'button_refund_back'],
        },
        node_refund_form: {
          id: 'node_refund_form',
          type: 'Form',
          name: '退款表单',
          props: {
            submitText: '提交退款',
            fields: [
              { key: 'amount', label: '退款金额', type: 'money', required: true },
              { key: 'reason', label: '退款原因', type: 'select', options: ['用户申请', '商品缺货', '重复付款'], required: true },
              { key: 'remark', label: '备注', type: 'text' },
            ],
          },
        },
        button_refund_back: {
          id: 'button_refund_back',
          type: 'Button',
          name: '返回订单列表',
          props: { text: '返回', variant: 'default', danger: false },
        },
      },
    },
  ],
  interactions: [
    {
      id: 'interaction_search_orders',
      name: '搜索刷新订单表格',
      trigger: { componentId: 'node_orders_search', event: 'search' },
      actions: [
        { type: 'setVariable', variableId: 'var_search_params', value: { kind: 'event', path: 'values' } },
        { type: 'refreshData', dataSourceId: 'ds_orders' },
        { type: 'showMessage', level: 'info', message: '订单数据已刷新' },
      ],
      enabled: true,
    },
    {
      id: 'interaction_add_order_open_modal',
      name: '点击新增订单打开弹窗',
      trigger: { componentId: 'button_add_order', event: 'click' },
      actions: [
        { type: 'setVariable', variableId: 'var_form_mode', value: { kind: 'literal', value: 'create' } },
        { type: 'resetForm', targetNodeId: 'node_add_order_form' },
        { type: 'openModal', targetNodeId: 'node_add_order_modal' },
      ],
      enabled: true,
    },
    {
      id: 'interaction_add_order_submit',
      name: '提交新增订单',
      trigger: { componentId: 'node_add_order_form', event: 'submit' },
      actions: [
        { type: 'submitMock', dataSourceId: 'ds_orders', payloadFrom: 'form', operation: 'create' },
        { type: 'closeModal', targetNodeId: 'node_add_order_modal' },
        { type: 'refreshData', dataSourceId: 'ds_orders' },
        { type: 'showMessage', level: 'success', message: '订单已创建' },
      ],
      enabled: true,
    },
    {
      id: 'interaction_row_detail',
      name: '表格行查看详情',
      trigger: { componentId: 'node_orders_table:详情', event: 'click' },
      actions: [
        { type: 'setVariable', variableId: 'var_selected_row', value: { kind: 'event', path: 'row' } },
        { type: 'openModal', targetNodeId: 'node_order_detail_drawer' },
      ],
      enabled: true,
    },
    {
      id: 'interaction_row_refund',
      name: '表格行退款',
      trigger: { componentId: 'node_orders_table:退款', event: 'click' },
      actions: [
        { type: 'setVariable', variableId: 'var_selected_row', value: { kind: 'event', path: 'row' } },
        { type: 'navigate', targetPageId: 'page_refunds' },
      ],
      enabled: true,
    },
    {
      id: 'interaction_delete_without_confirm',
      name: '删除订单缺少二次确认',
      trigger: { componentId: 'node_orders_table:删除', event: 'click' },
      actions: [
        { type: 'submitMock', dataSourceId: 'ds_orders', payloadFrom: 'currentRow', operation: 'delete' },
        { type: 'refreshData', dataSourceId: 'ds_orders' },
        { type: 'showMessage', level: 'success', message: '订单已删除' },
      ],
      enabled: true,
    },
    {
      id: 'interaction_back_orders',
      name: '返回订单管理',
      trigger: { componentId: 'button_back_orders', event: 'click' },
      actions: [{ type: 'navigate', targetPageId: 'page_orders' }],
      enabled: true,
    },
    {
      id: 'interaction_refund_submit',
      name: '提交退款',
      trigger: { componentId: 'node_refund_form', event: 'submit' },
      actions: [
        { type: 'submitMock', dataSourceId: 'ds_refunds', payloadFrom: 'form', operation: 'create' },
        { type: 'showMessage', level: 'success', message: '退款申请已提交' },
        { type: 'navigate', targetPageId: 'page_orders' },
      ],
      enabled: true,
    },
    {
      id: 'interaction_refund_back',
      name: '退款返回',
      trigger: { componentId: 'button_refund_back', event: 'click' },
      actions: [{ type: 'navigate', targetPageId: 'page_orders' }],
      enabled: true,
    },
    {
      id: 'interaction_broken_navigation_demo',
      name: '断链跳转示例',
      trigger: { componentId: 'button_export_orders', event: 'click' },
      actions: [{ type: 'navigate', targetPageId: 'page_missing_export' }],
      enabled: true,
    },
  ],
};
