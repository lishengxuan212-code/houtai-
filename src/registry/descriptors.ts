import type { ComponentDescriptor } from '../domain/types';
import { antdDescriptors } from './antdDescriptors';
import { prototypeWidgetDescriptors } from './prototypeWidgetDescriptors';

const children = ['Section', 'Card', 'Button', 'Input', 'Select', 'SearchBar', 'Table', 'Form', 'Modal', 'Drawer', 'Tabs', ...prototypeWidgetDescriptors.map((item) => item.type), ...antdDescriptors.map((item) => item.type)];

export const descriptors: ComponentDescriptor[] = [
  {
    type: 'PageContainer',
    displayName: '页面容器',
    category: 'layout',
    defaultProps: { title: '新页面', description: '页面说明' },
    editableProps: [
      { key: 'title', label: '标题', control: 'text' },
      { key: 'description', label: '说明', control: 'textarea' },
    ],
    supportedEvents: [],
    allowedChildren: children,
    canHaveChildren: true,
  },
  {
    type: 'Section',
    displayName: '区块',
    category: 'layout',
    defaultProps: { title: '业务区块' },
    editableProps: [{ key: 'title', label: '标题', control: 'text' }],
    supportedEvents: [],
    allowedChildren: children,
    canHaveChildren: true,
  },
  {
    type: 'Card',
    displayName: '卡片',
    category: 'layout',
    defaultProps: { title: '信息卡片' },
    editableProps: [{ key: 'title', label: '标题', control: 'text' }],
    supportedEvents: [],
    allowedChildren: children,
    canHaveChildren: true,
  },
  {
    type: 'Button',
    displayName: '按钮',
    category: 'navigation',
    defaultProps: { text: '按钮', variant: 'primary', danger: false },
    editableProps: [
      { key: 'text', label: '文案', control: 'text' },
      {
        key: 'variant',
        label: '样式',
        control: 'select',
        options: [
          { label: '主按钮', value: 'primary' },
          { label: '默认', value: 'default' },
          { label: '链接', value: 'link' },
        ],
      },
      { key: 'danger', label: '危险操作', control: 'boolean' },
    ],
    supportedEvents: ['click'],
  },
  {
    type: 'Input',
    displayName: '输入框',
    category: 'form',
    defaultProps: { label: '输入项', placeholder: '请输入', fieldKey: 'keyword' },
    editableProps: [
      { key: 'label', label: '标签', control: 'text' },
      { key: 'placeholder', label: '占位文案', control: 'text' },
      { key: 'fieldKey', label: '字段 key', control: 'text' },
    ],
    supportedEvents: ['change'],
  },
  {
    type: 'Select',
    displayName: '选择器',
    category: 'form',
    defaultProps: { label: '状态', fieldKey: 'status', options: ['全部', '待处理', '已完成'] },
    editableProps: [
      { key: 'label', label: '标签', control: 'text' },
      { key: 'fieldKey', label: '字段 key', control: 'text' },
      { key: 'options', label: '选项 JSON', control: 'json' },
    ],
    supportedEvents: ['change'],
  },
  {
    type: 'SearchBar',
    displayName: '搜索区',
    category: 'business',
    defaultProps: {
      fields: [
        { key: 'orderNo', label: '订单号', type: 'text' },
        { key: 'status', label: '订单状态', type: 'select', options: ['全部', '待支付', '已发货', '已退款'] },
      ],
    },
    editableProps: [{ key: 'fields', label: '字段 JSON', control: 'json' }],
    supportedEvents: ['search', 'change'],
  },
  {
    type: 'Table',
    displayName: '表格',
    category: 'data',
    defaultProps: {
      dataSourceId: 'ds_orders',
      columns: [
        { key: 'orderNo', title: '订单号' },
        { key: 'customerName', title: '客户' },
        { key: 'amount', title: '金额' },
        { key: 'status', title: '状态' },
      ],
      actions: ['详情', '退款', '删除'],
    },
    editableProps: [
      { key: 'dataSourceId', label: '数据源', control: 'text' },
      { key: 'columns', label: '表格列 JSON', control: 'json' },
      { key: 'actions', label: '操作项 JSON', control: 'json' },
    ],
    supportedEvents: ['rowClick', 'click'],
  },
  {
    type: 'Form',
    displayName: '表单',
    category: 'form',
    defaultProps: {
      submitText: '提交',
      fields: [
        { key: 'name', label: '名称', type: 'text', required: true },
        { key: 'remark', label: '备注', type: 'text' },
      ],
    },
    editableProps: [
      { key: 'submitText', label: '提交文案', control: 'text' },
      { key: 'fields', label: '字段 JSON', control: 'json' },
    ],
    supportedEvents: ['submit', 'change'],
  },
  {
    type: 'Modal',
    displayName: '弹窗',
    category: 'feedback',
    defaultProps: { title: '弹窗标题', open: false },
    editableProps: [{ key: 'title', label: '标题', control: 'text' }],
    supportedEvents: [],
    allowedChildren: children,
    canHaveChildren: true,
  },
  {
    type: 'Drawer',
    displayName: '抽屉',
    category: 'feedback',
    defaultProps: { title: '详情抽屉', open: false },
    editableProps: [{ key: 'title', label: '标题', control: 'text' }],
    supportedEvents: [],
    allowedChildren: children,
    canHaveChildren: true,
  },
  {
    type: 'Tabs',
    displayName: '标签页',
    category: 'navigation',
    defaultProps: { items: ['全部', '待处理', '已完成'] },
    editableProps: [{ key: 'items', label: '标签 JSON', control: 'json' }],
    supportedEvents: ['change'],
    allowedChildren: children,
    canHaveChildren: true,
  },
  {
    type: 'Message',
    displayName: '消息占位',
    category: 'feedback',
    defaultProps: { text: '操作成功', level: 'success' },
    editableProps: [
      { key: 'text', label: '文案', control: 'text' },
      {
        key: 'level',
        label: '等级',
        control: 'select',
        options: [
          { label: '成功', value: 'success' },
          { label: '提示', value: 'info' },
          { label: '警告', value: 'warning' },
          { label: '错误', value: 'error' },
        ],
      },
    ],
    supportedEvents: [],
  },
  ...prototypeWidgetDescriptors,
];

const descriptorByType = new Map<string, ComponentDescriptor>();
for (const descriptor of [...antdDescriptors, ...descriptors]) descriptorByType.set(descriptor.type, descriptor);

export const allDescriptors: ComponentDescriptor[] = [...descriptorByType.values()];
