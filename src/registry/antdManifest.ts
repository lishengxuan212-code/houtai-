import type { ComponentEvent, EditableProp, JsonRecord } from '../domain/types';
import { getComponentDisplayName } from '../store/componentLibraryStore';

export type LibraryCategory = '通用' | '布局' | '导航' | '数据录入' | '数据展示' | '反馈' | '其他' | '重型组件';
export type LibrarySource = 'system' | 'antd' | 'ant-design-icons' | 'pro-components' | 'mui';
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

export function libraryComponentType(component: Pick<LibraryComponentDescriptor, 'key' | 'source'>): string {
  return component.source === 'pro-components' ? `pro.${component.key}` : component.key;
}

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

function muiItem(
  category: LibraryCategory,
  nameEn: string,
  nameZh: string,
  options: Partial<LibraryComponentDescriptor> = {},
): LibraryComponentDescriptor {
  const { defaultProps, editableProps, description, ...rest } = options;
  return item(category, `Mui${nameEn}`, nameZh, {
    ...rest,
    source: 'mui',
    description: description ?? `本地化适配 MUI Material UI v7 ${nameEn} 组件。`,
    defaultProps: {
      title: nameZh,
      text: nameZh,
      label: nameZh,
      ...defaultProps,
    },
    editableProps: editableProps ?? [textProp('title', '标题'), textProp('text', '文案'), textProp('label', '标签')],
  });
}

export const muiV7LibraryManifest: LibraryComponentDescriptor[] = [
  muiItem('数据录入', 'Autocomplete', '自动完成', { supportedEvents: ['change'] }),
  muiItem('通用', 'Button', '按钮', { defaultProps: { text: '按钮', variant: 'contained', color: 'primary', disabled: false }, supportedEvents: ['click'] }),
  muiItem('通用', 'ButtonGroup', '按钮组', { defaultProps: { items: ['保存', '发布', '更多'] }, editableProps: [jsonProp('items', '按钮项')], supportedEvents: ['click'] }),
  muiItem('数据录入', 'Checkbox', '多选框', { defaultProps: { label: '选项', checked: true }, supportedEvents: ['change'] }),
  muiItem('通用', 'Fab', '浮动操作按钮', { defaultProps: { text: '+', color: 'primary' }, supportedEvents: ['click'] }),
  muiItem('数据录入', 'RadioGroup', '单选组', { defaultProps: { options: ['选项 A', '选项 B'], value: '选项 A' }, editableProps: [jsonProp('options', '选项')], supportedEvents: ['change'] }),
  muiItem('数据录入', 'Rating', '评分', { defaultProps: { value: 3 }, supportedEvents: ['change'] }),
  muiItem('数据录入', 'Select', '选择器', { defaultProps: { label: '状态', options: ['全部', '启用', '停用'] }, editableProps: [textProp('label', '标签'), jsonProp('options', '选项')], supportedEvents: ['change'] }),
  muiItem('数据录入', 'Slider', '滑块', { defaultProps: { value: 40 }, supportedEvents: ['change'] }),
  muiItem('数据录入', 'Switch', '开关', { defaultProps: { label: '启用', checked: true }, supportedEvents: ['change'] }),
  muiItem('数据录入', 'TextField', '文本框', { defaultProps: { label: '名称', placeholder: '请输入' }, editableProps: [textProp('label', '标签'), textProp('placeholder', '占位文案')], supportedEvents: ['change'] }),
  muiItem('数据录入', 'TransferList', '穿梭列表', { defaultProps: { items: ['待选项', '已选项'] }, editableProps: [jsonProp('items', '列表项')], supportedEvents: ['change'] }),
  muiItem('数据录入', 'ToggleButton', '切换按钮', { defaultProps: { text: '切换', selected: true }, supportedEvents: ['change'] }),
  muiItem('数据展示', 'Avatar', '头像'),
  muiItem('数据展示', 'Badge', '徽标', { defaultProps: { text: '消息', badgeContent: 5 } }),
  muiItem('数据展示', 'Chip', '纸片', { defaultProps: { label: '标签' }, supportedEvents: ['click'] }),
  muiItem('布局', 'Divider', '分割线'),
  muiItem('数据展示', 'Icons', '图标集', { renderKind: 'iconPicker', draggable: false, description: 'MUI 图标入口，作为图标选择能力展示。' }),
  muiItem('数据展示', 'MaterialIcons', 'Material 图标', { renderKind: 'iconPicker', draggable: false, description: 'Material Icons 图标入口，作为图标选择能力展示。' }),
  muiItem('数据展示', 'List', '列表', { defaultProps: { items: ['列表项一', '列表项二', '列表项三'] }, editableProps: [jsonProp('items', '列表项')] }),
  muiItem('数据展示', 'Table', '表格', { defaultProps: { columns: [{ key: 'name', title: '名称' }], actions: ['详情'] }, editableProps: [jsonProp('columns', '表格列'), jsonProp('actions', '操作项')], supportedEvents: ['rowClick', 'click'] }),
  muiItem('数据展示', 'Tooltip', '文字提示'),
  muiItem('通用', 'Typography', '排版', { defaultProps: { text: '标题文本', variant: 'h6' }, editableProps: [textProp('text', '文本'), textProp('variant', '变体')] }),
  muiItem('反馈', 'Alert', '警告提示'),
  muiItem('反馈', 'Backdrop', '背景遮罩'),
  muiItem('反馈', 'Dialog', '对话框', { renderKind: 'layout', defaultProps: { title: '对话框标题', open: true } }),
  muiItem('反馈', 'Progress', '进度', { defaultProps: { value: 60 } }),
  muiItem('反馈', 'Skeleton', '骨架屏'),
  muiItem('反馈', 'Snackbar', '消息条', { defaultProps: { text: '操作成功' } }),
  muiItem('数据展示', 'Accordion', '手风琴', {
    description: '本地化复用 MUI Material UI v7 Accordion API，以中文折叠面板形式渲染。',
    defaultProps: {
      summary: '折叠标题',
      details: '折叠内容',
      children: '',
      defaultExpanded: false,
      disabled: false,
      disableGutters: false,
      expanded: null,
      classes: {},
      slotProps: {},
      slots: {},
      sx: {},
      component: 'div',
      elevation: 1,
      square: false,
      variant: 'elevation',
    },
    editableProps: [],
    supportedEvents: ['openChange'],
  }),
  muiItem('导航', 'AppBar', '应用栏'),
  muiItem('数据展示', 'Card', '卡片', { renderKind: 'layout', defaultProps: { title: '卡片标题', text: '卡片内容' } }),
  muiItem('布局', 'Paper', '纸张容器', { renderKind: 'layout' }),
  muiItem('导航', 'BottomNavigation', '底部导航', { defaultProps: { items: ['首页', '消息', '我的'] }, editableProps: [jsonProp('items', '导航项')], supportedEvents: ['change'] }),
  muiItem('导航', 'Breadcrumbs', '面包屑'),
  muiItem('导航', 'Drawer', '抽屉', { renderKind: 'layout', defaultProps: { title: '抽屉标题', open: true } }),
  muiItem('导航', 'Link', '链接', { defaultProps: { text: '查看详情', href: '#' }, supportedEvents: ['click'] }),
  muiItem('导航', 'Menu', '菜单', { defaultProps: { items: ['菜单项一', '菜单项二'] }, editableProps: [jsonProp('items', '菜单项')], supportedEvents: ['click'] }),
  muiItem('导航', 'Pagination', '分页', { supportedEvents: ['change'] }),
  muiItem('导航', 'SpeedDial', '快速拨号', { defaultProps: { items: ['编辑', '复制', '分享'] }, editableProps: [jsonProp('items', '操作项')], supportedEvents: ['click'] }),
  muiItem('导航', 'Stepper', '步骤条', { defaultProps: { items: ['填写信息', '确认', '完成'] }, editableProps: [jsonProp('items', '步骤')], supportedEvents: ['change'] }),
  muiItem('导航', 'Tabs', '标签页', { defaultProps: { items: ['全部', '待处理', '已完成'] }, editableProps: [jsonProp('items', '标签项')], supportedEvents: ['change'] }),
  muiItem('布局', 'Box', '盒子', { renderKind: 'layout' }),
  muiItem('布局', 'Container', '容器', { renderKind: 'layout' }),
  muiItem('布局', 'Grid', '网格', { renderKind: 'layout' }),
  muiItem('布局', 'GridLegacy', '旧版网格', { renderKind: 'layout' }),
  muiItem('布局', 'Stack', '堆叠布局', { renderKind: 'layout' }),
  muiItem('布局', 'ImageList', '图片列表', { defaultProps: { items: ['图片一', '图片二', '图片三'] }, editableProps: [jsonProp('items', '图片项')] }),
  muiItem('其他', 'ClickAwayListener', '点击外部监听', { renderKind: 'system', draggable: false }),
  muiItem('其他', 'CssBaseline', 'CSS 基线', { renderKind: 'system', draggable: false }),
  muiItem('反馈', 'Modal', '模态框', { renderKind: 'layout', defaultProps: { title: '模态框标题', open: true } }),
  muiItem('其他', 'NoSsr', '禁用服务端渲染', { renderKind: 'system', draggable: false }),
  muiItem('数据展示', 'Popover', '弹出框'),
  muiItem('数据展示', 'Popper', '定位弹层'),
  muiItem('其他', 'Portal', '传送门', { renderKind: 'system', draggable: false }),
  muiItem('数据录入', 'TextareaAutosize', '自适应文本域', { defaultProps: { placeholder: '请输入多行内容' }, supportedEvents: ['change'] }),
  muiItem('其他', 'Transitions', '过渡动画', { renderKind: 'system', draggable: false }),
  muiItem('其他', 'UseMediaQuery', '媒体查询', { renderKind: 'system', draggable: false }),
  muiItem('布局', 'Masonry', '瀑布流', { renderKind: 'layout' }),
  muiItem('数据展示', 'Timeline', '时间轴', { defaultProps: { items: ['创建', '审核', '完成'] }, editableProps: [jsonProp('items', '时间项')] }),
  muiItem('通用', 'LoadingButton', '加载按钮', { defaultProps: { text: '提交中', loading: true }, supportedEvents: ['click'] }),
  muiItem('数据录入', 'DateTimePickers', '日期时间选择器', { supportedEvents: ['change'] }),
  muiItem('数据展示', 'TreeView', '树视图', { defaultProps: { items: ['一级节点', '二级节点'] }, editableProps: [jsonProp('items', '树节点')], supportedEvents: ['select'] }),
];

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
  item('数据录入', 'TextareaAutosize', '多行文本', { defaultProps: { label: '多行文本', placeholder: '请输入多行内容' }, editableProps: [textProp('label', '标签'), textProp('placeholder', '占位文案')], supportedEvents: ['change'] }),
  item('数据录入', 'ListBox', '列表框', { defaultProps: { label: '列表框', options: ['选项一', '选项二', '选项三'] }, editableProps: [textProp('label', '标签'), jsonProp('options', '列表项')], supportedEvents: ['change'] }),
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
  item('数据展示', 'Accordion', '手风琴', {
    description: '本地化复用 MUI Material UI Accordion API，以中文折叠面板形式渲染。',
    defaultProps: {
      summary: '折叠标题',
      details: '折叠内容',
      children: '',
      defaultExpanded: false,
      disabled: false,
      disableGutters: false,
      expanded: null,
      classes: {},
      slotProps: {},
      slots: {},
      sx: {},
      component: 'div',
      elevation: 1,
      square: false,
      variant: 'elevation',
    },
    editableProps: [],
    supportedEvents: ['openChange'],
  }),
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
  item('其他', 'BodyText', '文本段落', { source: 'system', description: '原型文本：段落正文。', defaultProps: { content: '正文文本' }, editableProps: [textProp('content', '内容')] }),
  item('其他', 'HelperText', '辅助文本', { source: 'system', description: '原型文本：辅助说明。', defaultProps: { content: '辅助文本' }, editableProps: [textProp('content', '内容')] }),
  item('其他', 'LinkText', '链接文本', { source: 'system', description: '原型文本：链接。', defaultProps: { content: '链接文本' }, editableProps: [textProp('content', '内容')], supportedEvents: ['click'] }),
  item('其他', 'ErrorText', '错误文本', { source: 'system', description: '原型文本：错误提示。', defaultProps: { content: '错误信息' }, editableProps: [textProp('content', '内容')] }),
  item('其他', 'Annotation', '标注', { source: 'system', description: '原型标注。', defaultProps: { content: '标注' }, editableProps: [textProp('content', '内容')] }),
  item('其他', 'StickyNote', '便签', { source: 'system', description: '原型便签。', defaultProps: { content: '便签' }, editableProps: [textProp('content', '内容')] }),
  item('其他', 'Rectangle', '矩形', { source: 'system', description: '形状：矩形。', defaultProps: { fill: '#ffffff' } }),
  item('其他', 'Circle', '椭圆形', { source: 'system', description: '形状：椭圆形。', defaultProps: { fill: '#ffffff' } }),
  item('其他', 'Line', '水平线', { source: 'system', description: '形状：线条。', defaultProps: { color: '#9ca3af' } }),
  item('其他', 'Arrow', '箭头', { source: 'system', description: '形状：箭头。', defaultProps: { color: '#6b7280' } }),
  item('其他', 'ImageWidget', '图片', { source: 'system', description: '媒体：图片。', defaultProps: { src: '', alt: '图片' } }),
  item('其他', 'IconWidget', '图标', { source: 'system', description: '图标元件。', defaultProps: { icon: 'SearchOutlined' } }),
  item('其他', 'Placeholder', '占位符', { source: 'system', description: '原型占位符。', defaultProps: { label: '占位符' } }),
  item('其他', 'DividerWidget', '分割线', { source: 'system', description: '原型分割线。', defaultProps: { text: '' } }),
  item('其他', 'HotZone', '热区', { source: 'system', description: '交互热区。', defaultProps: { label: '热区' }, supportedEvents: ['click'] }),
  item('其他', 'ModuleTitle', '模块标题', { source: 'system', description: '业务文本：模块标题。', defaultProps: { content: '模块标题' }, editableProps: [textProp('content', '内容')] }),
  item('其他', 'PageTitle', '页面标题', { source: 'system', description: '业务文本：页面标题。', defaultProps: { content: '页面标题' }, editableProps: [textProp('content', '内容')] }),
  item('其他', 'StatusLabel', '状态文本', { source: 'system', description: '业务文本：状态。', defaultProps: { content: '已启用' }, editableProps: [textProp('content', '内容')] }),
  item('其他', 'AmountText', '金额文本', { source: 'system', description: '业务文本：金额。', defaultProps: { content: '¥12,580.00' }, editableProps: [textProp('content', '内容')] }),
  item('其他', 'NumericText', '数字文本', { source: 'system', description: '业务文本：数字。', defaultProps: { content: '1280' }, editableProps: [textProp('content', '内容')] }),
  item('其他', 'TimeText', '时间文本', { source: 'system', description: '业务文本：时间。', defaultProps: { content: '2026-05-07 14:30' }, editableProps: [textProp('content', '内容')] }),
  item('其他', 'VisualBlock', '视觉色块', { source: 'system', description: '用于截图复刻的基础色块。', defaultProps: { label: '视觉色块' } }),
  item('其他', 'WhitePanel', '白色面板', { source: 'system', description: '用于还原后台页面卡片、弹层、内容面板。', defaultProps: { label: '白色面板' } }),
  item('其他', 'BadgePill', '胶囊标签', { source: 'system', description: '用于还原状态、标签、筛选项。', defaultProps: { text: '状态标签' } }),
  item('其他', 'HeaderBar', '顶部栏', { source: 'system', description: '用于还原后台顶部导航栏。', defaultProps: { title: '后台系统' } }),
  item('其他', 'SideNavBlock', '侧边导航块', { source: 'system', description: '用于还原后台侧边菜单。', defaultProps: { title: '菜单', items: ['首页', '订单管理'] } }),
  item('其他', 'TableSkeleton', '表格骨架', { source: 'system', description: '用于先视觉复刻表格行列，再逐步替换为可编辑表格。', defaultProps: { columns: 6, rows: 4 } }),

  item('重型组件', 'ProLayout', '高级布局', { source: 'pro-components', renderKind: 'pro', enabled: true, draggable: true, disabledReason: proDisabled }),
  item('重型组件', 'PageContainer', '高级页面容器', { source: 'pro-components', renderKind: 'pro', enabled: true, draggable: true, disabledReason: proDisabled }),
  item('重型组件', 'ProForm', '高级表单', { source: 'pro-components', renderKind: 'pro', enabled: true, draggable: true, disabledReason: proDisabled }),
  item('重型组件', 'ProTable', '高级表格', { source: 'pro-components', renderKind: 'pro', enabled: true, draggable: true, disabledReason: proDisabled }),
  item('重型组件', 'ProDescriptions', '高级定义列表', { source: 'pro-components', renderKind: 'pro', enabled: true, draggable: true, disabledReason: proDisabled }),
  item('重型组件', 'ProList', '高级列表', { source: 'pro-components', renderKind: 'pro', enabled: true, draggable: true, disabledReason: proDisabled }),
  item('重型组件', 'ProCard', '高级卡片', { source: 'pro-components', renderKind: 'pro', enabled: true, draggable: true, disabledReason: proDisabled }),
  item('重型组件', 'EditableProTable', '可编辑表格', { source: 'pro-components', renderKind: 'pro', enabled: true, draggable: true, disabledReason: proDisabled }),
  ...muiV7LibraryManifest,
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
      getComponentDisplayName(libraryComponentType(component), component.nameZh).toLowerCase().includes(query) ||
      component.nameEn.toLowerCase().includes(query) ||
      component.nameZh.toLowerCase().includes(query) ||
      component.description.toLowerCase().includes(query);
    return categoryMatched && queryMatched;
  });
}
