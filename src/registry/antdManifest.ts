import type { ComponentEvent, EditableProp, JsonRecord } from '../domain/types';

export type LibraryCategory = '通用' | '布局' | '导航' | '数据录入' | '数据展示' | '反馈' | '其他' | '重型组件';
export type LibrarySource = 'system' | 'antd' | 'ant-design-icons' | 'pro-components';
export type RenderKind = 'visual' | 'layout' | 'feedbackAction' | 'system' | 'iconPicker' | 'pro';

export type LibraryComponentDescriptor = {
  key: string;
  nameEn: string;
  nameZh: string;
  category: LibraryCategory;
  source: LibrarySource;
  renderKind: RenderKind;
  draggable: boolean;
  enabled: boolean;
  disabledReason?: string;
  description: string;
  defaultProps: JsonRecord;
  editableProps: EditableProp[];
  supportedEvents: ComponentEvent[];
};

export const libraryCategories: LibraryCategory[] = ['通用', '布局', '导航', '数据录入', '数据展示', '反馈', '其他', '重型组件'];

const textProp = (key: string, label: string): EditableProp => ({ key, label, control: 'text' });
const jsonProp = (key: string, label: string): EditableProp => ({ key, label, control: 'json' });

function item(
  category: LibraryCategory,
  nameEn: string,
  nameZh: string,
  options: Partial<LibraryComponentDescriptor> = {},
): LibraryComponentDescriptor {
  const renderKind = options.renderKind ?? (category === '布局' ? 'layout' : 'visual');
  const source = options.source ?? 'antd';
  const enabled = options.enabled ?? true;
  const draggable = options.draggable ?? (enabled && renderKind !== 'feedbackAction' && renderKind !== 'system' && renderKind !== 'iconPicker');
  return {
    key: nameEn,
    nameEn,
    nameZh,
    category,
    source,
    renderKind,
    draggable,
    enabled,
    description: options.description ?? `${nameZh}，来自 Ant Design 官方组件总览。`,
    defaultProps: options.defaultProps ?? { title: nameZh, text: nameZh },
    editableProps: options.editableProps ?? [textProp('title', '标题'), textProp('text', '文案')],
    supportedEvents: options.supportedEvents ?? [],
    ...(options.disabledReason ? { disabledReason: options.disabledReason } : {}),
  };
}

const proDisabled = '需安装 Pro Components 后启用';

export const antdLibraryManifest: LibraryComponentDescriptor[] = [
  item('通用', 'Button', '按钮', { defaultProps: { text: '按钮', variant: 'primary', danger: false }, supportedEvents: ['click'] }),
  item('通用', 'FloatButton', '悬浮按钮', { defaultProps: { shape: 'circle', type: 'default', content: '', icon: 'QuestionCircleOutlined' }, supportedEvents: ['click'] }),
  item('通用', 'FloatButton.Group', '悬浮按钮组', { defaultProps: { shape: 'circle', trigger: 'click', placement: 'top' }, supportedEvents: ['click', 'openChange'] }),
  item('通用', 'FloatButton.BackTop', '返回顶部', { defaultProps: { duration: 450, visibilityHeight: 400 }, supportedEvents: ['click'] }),
  item('通用', 'Icon', '图标', { source: 'ant-design-icons', renderKind: 'iconPicker', draggable: false, description: '作为图标选择器使用，不平铺全部图标。' }),
  item('通用', 'Typography', '排版', { defaultProps: { text: '标题文本' }, editableProps: [textProp('text', '文本')] }),

  item('布局', 'Divider', '分割线'),
  item('布局', 'Flex', '弹性布局'),
  item('布局', 'Grid', '栅格'),
  item('布局', 'Row', '行'),
  item('布局', 'Col', '列'),
  item('布局', 'Layout', '布局'),
  item('布局', 'Masonry', '瀑布流'),
  item('布局', 'Space', '间距'),
  item('布局', 'Splitter', '分隔面板'),

  item('导航', 'Anchor', '锚点'),
  item('导航', 'Breadcrumb', '面包屑'),
  item('导航', 'Dropdown', '下拉菜单', { supportedEvents: ['click'] }),
  item('导航', 'Menu', '导航菜单', { defaultProps: { items: ['首页', '订单', '设置'] }, editableProps: [jsonProp('items', '菜单项')] }),
  item('导航', 'Pagination', '分页', { supportedEvents: ['change'] }),
  item('导航', 'Steps', '步骤条', { defaultProps: { items: ['第一步', '第二步', '完成'] }, editableProps: [jsonProp('items', '步骤')] }),
  item('导航', 'Tabs', '标签页', { defaultProps: { items: ['全部', '待处理', '已完成'] }, editableProps: [jsonProp('items', '标签项')], supportedEvents: ['change'] }),

  item('数据录入', 'AutoComplete', '自动完成', { supportedEvents: ['change'] }),
  item('数据录入', 'Cascader', '级联选择', { supportedEvents: ['change'] }),
  item('数据录入', 'Checkbox', '多选框', { supportedEvents: ['change'] }),
  item('数据录入', 'ColorPicker', '颜色选择器', { supportedEvents: ['change'] }),
  item('数据录入', 'DatePicker', '日期选择框', { supportedEvents: ['change'] }),
  item('数据录入', 'Form', '表单', { defaultProps: { submitText: '提交', fields: [{ key: 'name', label: '名称', type: 'text', required: true }] }, editableProps: [textProp('submitText', '提交文案'), jsonProp('fields', '字段')], supportedEvents: ['submit', 'change'] }),
  item('数据录入', 'Input', '输入框', { defaultProps: { label: '输入项', placeholder: '请输入', fieldKey: 'keyword' }, editableProps: [textProp('label', '标签'), textProp('placeholder', '占位文案'), textProp('fieldKey', '字段 key')], supportedEvents: ['change'] }),
  item('数据录入', 'InputNumber', '数字输入框', { supportedEvents: ['change'] }),
  item('数据录入', 'Mentions', '提及', { supportedEvents: ['change'] }),
  item('数据录入', 'Radio', '单选框', { supportedEvents: ['change'] }),
  item('数据录入', 'Rate', '评分', { supportedEvents: ['change'] }),
  item('数据录入', 'Select', '选择器', { defaultProps: { label: '状态', fieldKey: 'status', options: ['全部', '待处理', '已完成'] }, editableProps: [textProp('label', '标签'), textProp('fieldKey', '字段 key'), jsonProp('options', '选项')], supportedEvents: ['change'] }),
  item('数据录入', 'Slider', '滑动输入条', { supportedEvents: ['change'] }),
  item('数据录入', 'Switch', '开关', { supportedEvents: ['change'] }),
  item('数据录入', 'TimePicker', '时间选择框', { supportedEvents: ['change'] }),
  item('数据录入', 'Transfer', '穿梭框', { supportedEvents: ['change'] }),
  item('数据录入', 'TreeSelect', '树选择', { supportedEvents: ['change'] }),
  item('数据录入', 'Upload', '上传', { supportedEvents: ['change'] }),

  item('数据展示', 'Avatar', '头像'),
  item('数据展示', 'Badge', '徽标数'),
  item('数据展示', 'Calendar', '日历'),
  item('数据展示', 'Card', '卡片', { renderKind: 'layout', defaultProps: { title: '信息卡片' } }),
  item('数据展示', 'Carousel', '走马灯'),
  item('数据展示', 'Collapse', '折叠面板'),
  item('数据展示', 'Descriptions', '描述列表'),
  item('数据展示', 'Empty', '空状态'),
  item('数据展示', 'Image', '图片'),
  item('数据展示', 'List', '列表'),
  item('数据展示', 'Popover', '气泡卡片'),
  item('数据展示', 'QRCode', '二维码'),
  item('数据展示', 'Segmented', '分段控制器', { supportedEvents: ['change'] }),
  item('数据展示', 'Statistic', '统计数值'),
  item('数据展示', 'Table', '表格', { defaultProps: { dataSourceId: 'ds_orders', columns: [{ key: 'name', title: '名称' }], actions: ['详情'] }, editableProps: [textProp('dataSourceId', '数据来源'), jsonProp('columns', '表格列'), jsonProp('actions', '操作项')], supportedEvents: ['rowClick', 'click'] }),
  item('数据展示', 'Tag', '标签'),
  item('数据展示', 'Timeline', '时间轴'),
  item('数据展示', 'Tooltip', '文字提示'),
  item('数据展示', 'Tour', '漫游式引导'),
  item('数据展示', 'Tree', '树形控件'),

  item('反馈', 'Alert', '警告提示'),
  item('反馈', 'Drawer', '抽屉', { renderKind: 'layout', defaultProps: { title: '详情抽屉', open: false } }),
  item('反馈', 'Message', '全局提示', { renderKind: 'feedbackAction', draggable: false, description: '动作类组件，用于配置操作后的全局提示。' }),
  item('反馈', 'Modal', '对话框', { renderKind: 'layout', defaultProps: { title: '弹窗标题', open: false } }),
  item('反馈', 'Notification', '通知提醒框', { renderKind: 'feedbackAction', draggable: false, description: '动作类组件，用于配置操作后的通知提醒。' }),
  item('反馈', 'Popconfirm', '气泡确认框'),
  item('反馈', 'Progress', '进度条'),
  item('反馈', 'Result', '结果'),
  item('反馈', 'Skeleton', '骨架屏'),
  item('反馈', 'Spin', '加载中'),
  item('反馈', 'Watermark', '水印'),

  item('其他', 'Affix', '固钉'),
  item('其他', 'BackTop', '回到顶部'),
  item('其他', 'App', '包裹组件', { renderKind: 'system', draggable: false, description: '系统类组件，用于应用上下文包裹。' }),
  item('其他', 'ConfigProvider', '全局化配置', { renderKind: 'system', draggable: false, description: '系统类组件，用于全局配置主题、语言和方向。' }),
  item('其他', 'theme', '主题', { renderKind: 'system', draggable: false, description: '系统类能力，用于读取和配置主题变量。' }),
  item('其他', 'Util', '工具类', { renderKind: 'system', draggable: false, description: '工具类能力，不作为普通视觉块拖入。' }),
  item('其他', 'H1', 'H1', { source: 'system', description: 'Prototype text widget: H1.', defaultProps: { content: 'Page headline' }, editableProps: [textProp('content', 'Content')] }),
  item('其他', 'H2', 'H2', { source: 'system', description: 'Prototype text widget: H2.', defaultProps: { content: 'Section headline' }, editableProps: [textProp('content', 'Content')] }),
  item('其他', 'H3', 'H3', { source: 'system', description: 'Prototype text widget: H3.', defaultProps: { content: 'Module headline' }, editableProps: [textProp('content', 'Content')] }),
  item('其他', 'BodyText', 'body text', { source: 'system', description: 'Prototype text widget: body text.', defaultProps: { content: 'Body text' }, editableProps: [textProp('content', 'Content')] }),
  item('其他', 'HelperText', 'helper text', { source: 'system', description: 'Prototype text widget: helper text.', defaultProps: { content: 'Helper text' }, editableProps: [textProp('content', 'Content')] }),
  item('其他', 'LinkText', 'link text', { source: 'system', description: 'Prototype text widget: link text.', defaultProps: { content: 'Link text' }, editableProps: [textProp('content', 'Content')], supportedEvents: ['click'] }),
  item('其他', 'ErrorText', 'error text', { source: 'system', description: 'Prototype text widget: error text.', defaultProps: { content: 'Error message' }, editableProps: [textProp('content', 'Content')] }),
  item('其他', 'Annotation', 'annotation', { source: 'system', description: 'Prototype annotation widget.', defaultProps: { content: 'Annotation' }, editableProps: [textProp('content', 'Content')] }),
  item('其他', 'StickyNote', 'sticky note', { source: 'system', description: 'Prototype sticky note widget.', defaultProps: { content: 'Sticky note' }, editableProps: [textProp('content', 'Content')] }),
  item('其他', 'Rectangle', 'rectangle', { source: 'system', description: 'Prototype shape widget: rectangle.', defaultProps: { fill: '#ffffff' } }),
  item('其他', 'Circle', 'circle', { source: 'system', description: 'Prototype shape widget: circle.', defaultProps: { fill: '#ffffff' } }),
  item('其他', 'Line', 'line', { source: 'system', description: 'Prototype shape widget: line.', defaultProps: { color: '#9ca3af' } }),
  item('其他', 'Arrow', 'arrow', { source: 'system', description: 'Prototype shape widget: arrow.', defaultProps: { color: '#6b7280' } }),
  item('其他', 'ImageWidget', 'image', { source: 'system', description: 'Prototype media widget: image.', defaultProps: { src: '', alt: 'Image' } }),
  item('其他', 'IconWidget', 'icon', { source: 'system', description: 'Prototype icon widget.', defaultProps: { icon: 'SearchOutlined' } }),
  item('其他', 'Placeholder', 'placeholder', { source: 'system', description: 'Prototype placeholder widget.', defaultProps: { label: 'Placeholder' } }),
  item('其他', 'DividerWidget', 'divider', { source: 'system', description: 'Prototype divider widget.', defaultProps: { text: '' } }),
  item('其他', 'HotZone', 'hot zone', { source: 'system', description: 'Prototype interaction hot zone widget.', defaultProps: { label: 'Hot zone' }, supportedEvents: ['click'] }),
  item('其他', 'ModuleTitle', 'module title', { source: 'system', description: 'Prototype business text widget: module title.', defaultProps: { content: 'Module title' }, editableProps: [textProp('content', 'Content')] }),
  item('其他', 'PageTitle', 'page title', { source: 'system', description: 'Prototype business text widget: page title.', defaultProps: { content: 'Page title' }, editableProps: [textProp('content', 'Content')] }),
  item('其他', 'StatusLabel', 'status text', { source: 'system', description: 'Prototype business text widget: status text.', defaultProps: { content: 'Enabled' }, editableProps: [textProp('content', 'Content')] }),
  item('其他', 'AmountText', 'amount text', { source: 'system', description: 'Prototype business text widget: amount text.', defaultProps: { content: '$12,580.00' }, editableProps: [textProp('content', 'Content')] }),
  item('其他', 'NumericText', 'numeric text', { source: 'system', description: 'Prototype business text widget: numeric text.', defaultProps: { content: '1280' }, editableProps: [textProp('content', 'Content')] }),
  item('其他', 'TimeText', 'time text', { source: 'system', description: 'Prototype business text widget: time text.', defaultProps: { content: '2026-05-07 14:30' }, editableProps: [textProp('content', 'Content')] }),

  item('重型组件', 'ProLayout', '高级布局', { source: 'pro-components', renderKind: 'pro', enabled: true, draggable: true, disabledReason: proDisabled }),
  item('重型组件', 'PageContainer', '高级页面容器', { source: 'pro-components', renderKind: 'pro', enabled: true, draggable: true, disabledReason: proDisabled }),
  item('重型组件', 'ProForm', '高级表单', { source: 'pro-components', renderKind: 'pro', enabled: true, draggable: true, disabledReason: proDisabled }),
  item('重型组件', 'ProTable', '高级表格', { source: 'pro-components', renderKind: 'pro', enabled: true, draggable: true, disabledReason: proDisabled }),
  item('重型组件', 'ProDescriptions', '高级定义列表', { source: 'pro-components', renderKind: 'pro', enabled: true, draggable: true, disabledReason: proDisabled }),
  item('重型组件', 'ProList', '高级列表', { source: 'pro-components', renderKind: 'pro', enabled: true, draggable: true, disabledReason: proDisabled }),
  item('重型组件', 'ProCard', '高级卡片', { source: 'pro-components', renderKind: 'pro', enabled: true, draggable: true, disabledReason: proDisabled }),
  item('重型组件', 'EditableProTable', '可编辑表格', { source: 'pro-components', renderKind: 'pro', enabled: true, draggable: true, disabledReason: proDisabled }),
];

export function filterLibraryComponents(
  components: LibraryComponentDescriptor[],
  filters: { query?: string; category?: LibraryCategory | '全部' },
): LibraryComponentDescriptor[] {
  const query = filters.query?.trim().toLowerCase();
  return components.filter((component) => {
    const categoryMatched = !filters.category || filters.category === '全部' || component.category === filters.category;
    const queryMatched =
      !query ||
      component.nameEn.toLowerCase().includes(query) ||
      component.nameZh.toLowerCase().includes(query) ||
      component.description.toLowerCase().includes(query);
    return categoryMatched && queryMatched;
  });
}
