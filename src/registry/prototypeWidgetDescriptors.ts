import type { ComponentDescriptor, EditableProp, JsonRecord } from '../domain/types';

type TextWidgetInput = {
  type: string;
  displayName: string;
  content: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  background?: string;
};

const textEditableProps: EditableProp[] = [
  { key: 'content', label: '内容', control: 'textarea' },
  { key: 'fontSize', label: '字号', control: 'number', min: 8, max: 96 },
  { key: 'fontWeight', label: '字重', control: 'number', min: 100, max: 900 },
  { key: 'color', label: '颜色', control: 'text' },
  { key: 'fontFamily', label: '字体', control: 'text' },
  { key: 'lineHeight', label: '行高', control: 'number', min: 0.8, max: 3 },
  { key: 'letterSpacing', label: '字间距', control: 'number', min: -4, max: 12 },
  {
    key: 'align',
    label: '对齐',
    control: 'select',
    options: [
      { label: '左对齐', value: 'left' },
      { label: '居中', value: 'center' },
      { label: '右对齐', value: 'right' },
    ],
  },
  { key: 'underline', label: '下划线', control: 'boolean' },
  { key: 'strikethrough', label: '删除线', control: 'boolean' },
  { key: 'background', label: '背景', control: 'text' },
  { key: 'border', label: '边框', control: 'text' },
  { key: 'radius', label: '圆角', control: 'number', min: 0, max: 80 },
  { key: 'padding', label: '内边距', control: 'number', min: 0, max: 80 },
  { key: 'width', label: '宽度', control: 'number', min: 1, max: 2400 },
  { key: 'height', label: '高度', control: 'number', min: 1, max: 1600 },
  {
    key: 'wrapping',
    label: '换行',
    control: 'select',
    options: [
      { label: '自动换行', value: 'wrap' },
      { label: '不换行', value: 'nowrap' },
    ],
  },
  { key: 'ellipsis', label: '超出省略', control: 'boolean' },
];

const defaultTextProps = {
  fontFamily: 'Microsoft YaHei, PingFang SC, sans-serif',
  lineHeight: 1.4,
  letterSpacing: 0,
  align: 'left',
  underline: false,
  strikethrough: false,
  background: 'transparent',
  border: 'none',
  radius: 0,
  padding: 0,
  width: 320,
  height: 48,
  wrapping: 'wrap',
  ellipsis: false,
};

function textWidget(input: TextWidgetInput): ComponentDescriptor {
  return {
    type: input.type,
    displayName: input.displayName,
    category: 'business',
    defaultProps: {
      ...defaultTextProps,
      content: input.content,
      fontSize: input.fontSize,
      fontWeight: input.fontWeight,
      color: input.color,
      ...(input.background ? { background: input.background, padding: 8, radius: 4 } : {}),
    },
    editableProps: textEditableProps,
    supportedEvents: ['click'],
  };
}

function widget(type: string, displayName: string, category: ComponentDescriptor['category'], defaultProps: JsonRecord, editableProps: EditableProp[] = []): ComponentDescriptor {
  return { type, displayName, category, defaultProps, editableProps, supportedEvents: ['click'] };
}

export const prototypeWidgetDescriptors: ComponentDescriptor[] = [
  textWidget({ type: 'H1', displayName: '一级标题', content: '一级标题', fontSize: 32, fontWeight: 700, color: '#111827' }),
  textWidget({ type: 'H2', displayName: '二级标题', content: '二级标题', fontSize: 24, fontWeight: 700, color: '#111827' }),
  textWidget({ type: 'H3', displayName: '三级标题', content: '模块标题', fontSize: 18, fontWeight: 600, color: '#111827' }),
  textWidget({ type: 'BodyText', displayName: '正文文本', content: '正文内容', fontSize: 14, fontWeight: 400, color: '#1f2937' }),
  textWidget({ type: 'HelperText', displayName: '辅助文本', content: '辅助说明', fontSize: 12, fontWeight: 400, color: '#6b7280' }),
  textWidget({ type: 'LinkText', displayName: '链接文本', content: '查看详情', fontSize: 14, fontWeight: 500, color: '#1677ff' }),
  textWidget({ type: 'ErrorText', displayName: '错误文本', content: '错误提示', fontSize: 12, fontWeight: 500, color: '#cf1322' }),
  textWidget({ type: 'Annotation', displayName: '批注说明', content: '批注说明', fontSize: 13, fontWeight: 400, color: '#92400e', background: '#fffbeb' }),
  textWidget({ type: 'StickyNote', displayName: '便签', content: '便签内容', fontSize: 14, fontWeight: 500, color: '#713f12', background: '#fef3c7' }),
  textWidget({ type: 'ModuleTitle', displayName: '模块标题', content: '模块标题', fontSize: 18, fontWeight: 700, color: '#111827' }),
  textWidget({ type: 'PageTitle', displayName: '页面标题', content: '页面标题', fontSize: 28, fontWeight: 700, color: '#111827' }),
  textWidget({ type: 'StatusLabel', displayName: '状态标签', content: '已启用', fontSize: 13, fontWeight: 600, color: '#047857', background: '#ecfdf5' }),
  textWidget({ type: 'AmountText', displayName: '金额文本', content: '¥12,580.00', fontSize: 20, fontWeight: 700, color: '#111827' }),
  textWidget({ type: 'NumericText', displayName: '数字文本', content: '1280', fontSize: 20, fontWeight: 700, color: '#111827' }),
  textWidget({ type: 'TimeText', displayName: '时间文本', content: '2026-05-11 14:30', fontSize: 13, fontWeight: 400, color: '#4b5563' }),
  widget('Rectangle', '矩形', 'layout', { fill: '#ffffff', border: '1px solid #d1d5db', radius: 4, width: 160, height: 96 }, [
    { key: 'fill', label: '填充色', control: 'text' },
    { key: 'border', label: '边框', control: 'text' },
    { key: 'radius', label: '圆角', control: 'number', min: 0, max: 80 },
    { key: 'width', label: '宽度', control: 'number', min: 1, max: 2400 },
    { key: 'height', label: '高度', control: 'number', min: 1, max: 1600 },
  ]),
  widget('Circle', '椭圆形', 'layout', { fill: '#ffffff', border: '1px solid #d1d5db', width: 96, height: 96 }, [
    { key: 'fill', label: '填充色', control: 'text' },
    { key: 'border', label: '边框', control: 'text' },
    { key: 'width', label: '宽度', control: 'number', min: 1, max: 1600 },
    { key: 'height', label: '高度', control: 'number', min: 1, max: 1600 },
  ]),
  widget('Line', '水平线', 'layout', { color: '#9ca3af', thickness: 1, width: 160 }, [
    { key: 'color', label: '颜色', control: 'text' },
    { key: 'thickness', label: '粗细', control: 'number', min: 1, max: 24 },
    { key: 'width', label: '宽度', control: 'number', min: 1, max: 2400 },
  ]),
  widget('Arrow', '箭头', 'layout', { color: '#6b7280', thickness: 2, width: 160, arrowHead: true }, [
    { key: 'color', label: '颜色', control: 'text' },
    { key: 'thickness', label: '粗细', control: 'number', min: 1, max: 24 },
    { key: 'width', label: '宽度', control: 'number', min: 1, max: 2400 },
    { key: 'arrowHead', label: '箭头', control: 'boolean' },
  ]),
  widget('ImageWidget', '图片', 'data', { src: '', alt: '图片', fit: 'cover', width: 240, height: 135 }, [
    { key: 'src', label: '图片地址', control: 'text' },
    { key: 'alt', label: '替代文本', control: 'text' },
    { key: 'width', label: '宽度', control: 'number', min: 1, max: 2400 },
    { key: 'height', label: '高度', control: 'number', min: 1, max: 1600 },
  ]),
  widget('IconWidget', '图标', 'data', { icon: 'SearchOutlined', color: '#1677ff', size: 24 }, [
    { key: 'icon', label: '图标', control: 'text' },
    { key: 'color', label: '颜色', control: 'text' },
    { key: 'size', label: '大小', control: 'number', min: 8, max: 128 },
  ]),
  widget('Placeholder', '占位符', 'layout', { label: '占位符', width: 240, height: 120 }, [
    { key: 'label', label: '标签', control: 'text' },
    { key: 'width', label: '宽度', control: 'number', min: 1, max: 2400 },
    { key: 'height', label: '高度', control: 'number', min: 1, max: 1600 },
  ]),
  widget('DividerWidget', '分割线', 'layout', { text: '', color: '#d1d5db', thickness: 1, width: 240 }, [
    { key: 'text', label: '文本', control: 'text' },
    { key: 'color', label: '颜色', control: 'text' },
    { key: 'thickness', label: '粗细', control: 'number', min: 1, max: 24 },
    { key: 'width', label: '宽度', control: 'number', min: 1, max: 2400 },
  ]),
  widget('HotZone', '热区', 'layout', { label: '热区', border: '1px dashed #f59e0b', background: 'rgba(245, 158, 11, 0.08)', width: 160, height: 96 }, [
    { key: 'label', label: '标签', control: 'text' },
    { key: 'width', label: '宽度', control: 'number', min: 1, max: 2400 },
    { key: 'height', label: '高度', control: 'number', min: 1, max: 1600 },
  ]),
  widget('VisualBlock', '视觉色块', 'layout', { label: '视觉色块', fill: '#f1f5f9', border: '1px solid #dbe3ef', radius: 6, width: 160, height: 48, shadow: 'none' }, [
    { key: 'label', label: '名称', control: 'text' },
    { key: 'fill', label: '填充色', control: 'text' },
    { key: 'border', label: '边框', control: 'text' },
    { key: 'radius', label: '圆角', control: 'number', min: 0, max: 80 },
    { key: 'shadow', label: '阴影', control: 'text' },
    { key: 'width', label: '宽度', control: 'number', min: 1, max: 2400 },
    { key: 'height', label: '高度', control: 'number', min: 1, max: 1600 },
  ]),
  widget('WhitePanel', '白色面板', 'layout', { label: '白色面板', fill: '#ffffff', border: '1px solid #e5e7eb', radius: 8, width: 360, height: 220, shadow: '0 8px 24px rgba(15,23,42,0.08)' }, [
    { key: 'label', label: '名称', control: 'text' },
    { key: 'fill', label: '填充色', control: 'text' },
    { key: 'border', label: '边框', control: 'text' },
    { key: 'radius', label: '圆角', control: 'number', min: 0, max: 80 },
    { key: 'shadow', label: '阴影', control: 'text' },
    { key: 'width', label: '宽度', control: 'number', min: 1, max: 2400 },
    { key: 'height', label: '高度', control: 'number', min: 1, max: 1600 },
  ]),
  widget('BadgePill', '胶囊标签', 'business', { text: '状态标签', color: '#1677ff', background: '#e6f4ff', border: '1px solid #91caff', radius: 999, width: 88, height: 28 }, [
    { key: 'text', label: '文案', control: 'text' },
    { key: 'color', label: '文字颜色', control: 'text' },
    { key: 'background', label: '背景色', control: 'text' },
    { key: 'border', label: '边框', control: 'text' },
    { key: 'width', label: '宽度', control: 'number', min: 1, max: 2400 },
    { key: 'height', label: '高度', control: 'number', min: 1, max: 1600 },
  ]),
  widget('HeaderBar', '顶部栏', 'layout', { title: '后台系统', fill: '#ffffff', border: '1px solid #e5e7eb', width: 960, height: 56 }, [
    { key: 'title', label: '标题', control: 'text' },
    { key: 'fill', label: '填充色', control: 'text' },
    { key: 'border', label: '边框', control: 'text' },
    { key: 'width', label: '宽度', control: 'number', min: 1, max: 2400 },
    { key: 'height', label: '高度', control: 'number', min: 1, max: 1600 },
  ]),
  widget('SideNavBlock', '侧边导航块', 'navigation', { title: '菜单', items: ['首页', '订单管理', '系统设置'], fill: '#ffffff', activeColor: '#e6f4ff', width: 220, height: 360 }, [
    { key: 'title', label: '标题', control: 'text' },
    { key: 'items', label: '菜单项', control: 'json' },
    { key: 'fill', label: '填充色', control: 'text' },
    { key: 'activeColor', label: '选中色', control: 'text' },
    { key: 'width', label: '宽度', control: 'number', min: 1, max: 2400 },
    { key: 'height', label: '高度', control: 'number', min: 1, max: 1600 },
  ]),
  widget('TableSkeleton', '表格骨架', 'data', { columns: 6, rows: 4, headerColor: '#dff1fb', rowColor: '#f1f5f9', border: '1px solid #e5e7eb', width: 760, height: 280 }, [
    { key: 'columns', label: '列数', control: 'number', min: 1, max: 20 },
    { key: 'rows', label: '行数', control: 'number', min: 1, max: 20 },
    { key: 'headerColor', label: '表头颜色', control: 'text' },
    { key: 'rowColor', label: '行颜色', control: 'text' },
    { key: 'border', label: '边框', control: 'text' },
    { key: 'width', label: '宽度', control: 'number', min: 1, max: 2400 },
    { key: 'height', label: '高度', control: 'number', min: 1, max: 1600 },
  ]),
];
