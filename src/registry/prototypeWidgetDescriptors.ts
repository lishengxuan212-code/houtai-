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
  { key: 'content', label: 'Content', control: 'textarea' },
  { key: 'fontSize', label: 'Font size', control: 'number', min: 8, max: 96 },
  { key: 'fontWeight', label: 'Font weight', control: 'number', min: 100, max: 900 },
  { key: 'color', label: 'Color', control: 'text' },
  { key: 'fontFamily', label: 'Font family', control: 'text' },
  { key: 'lineHeight', label: 'Line height', control: 'number', min: 0.8, max: 3 },
  { key: 'letterSpacing', label: 'Letter spacing', control: 'number', min: -4, max: 12 },
  {
    key: 'align',
    label: 'Alignment',
    control: 'select',
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Center', value: 'center' },
      { label: 'Right', value: 'right' },
    ],
  },
  { key: 'underline', label: 'Underline', control: 'boolean' },
  { key: 'strikethrough', label: 'Strikethrough', control: 'boolean' },
  { key: 'background', label: 'Background', control: 'text' },
  { key: 'border', label: 'Border', control: 'text' },
  { key: 'radius', label: 'Radius', control: 'number', min: 0, max: 80 },
  { key: 'padding', label: 'Padding', control: 'number', min: 0, max: 80 },
  { key: 'width', label: 'Width', control: 'number', min: 1, max: 2400 },
  { key: 'height', label: 'Height', control: 'number', min: 1, max: 1600 },
  {
    key: 'wrapping',
    label: 'Wrapping',
    control: 'select',
    options: [
      { label: 'Wrap', value: 'wrap' },
      { label: 'No wrap', value: 'nowrap' },
    ],
  },
  { key: 'ellipsis', label: 'Ellipsis', control: 'boolean' },
];

const defaultTextProps = {
  fontFamily: 'Arial, sans-serif',
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
  textWidget({ type: 'H1', displayName: 'H1', content: 'Page headline', fontSize: 32, fontWeight: 700, color: '#111827' }),
  textWidget({ type: 'H2', displayName: 'H2', content: 'Section headline', fontSize: 24, fontWeight: 700, color: '#111827' }),
  textWidget({ type: 'H3', displayName: 'H3', content: 'Module headline', fontSize: 18, fontWeight: 600, color: '#111827' }),
  textWidget({ type: 'BodyText', displayName: 'body text', content: 'Body text', fontSize: 14, fontWeight: 400, color: '#1f2937' }),
  textWidget({ type: 'HelperText', displayName: 'helper text', content: 'Helper text', fontSize: 12, fontWeight: 400, color: '#6b7280' }),
  textWidget({ type: 'LinkText', displayName: 'link text', content: 'Link text', fontSize: 14, fontWeight: 500, color: '#1677ff' }),
  textWidget({ type: 'ErrorText', displayName: 'error text', content: 'Error message', fontSize: 12, fontWeight: 500, color: '#cf1322' }),
  textWidget({ type: 'Annotation', displayName: 'annotation', content: 'Annotation', fontSize: 13, fontWeight: 400, color: '#92400e', background: '#fffbeb' }),
  textWidget({ type: 'StickyNote', displayName: 'sticky note', content: 'Sticky note', fontSize: 14, fontWeight: 500, color: '#713f12', background: '#fef3c7' }),
  textWidget({ type: 'ModuleTitle', displayName: 'module title', content: 'Module title', fontSize: 18, fontWeight: 700, color: '#111827' }),
  textWidget({ type: 'PageTitle', displayName: 'page title', content: 'Page title', fontSize: 28, fontWeight: 700, color: '#111827' }),
  textWidget({ type: 'StatusLabel', displayName: 'status text', content: 'Enabled', fontSize: 13, fontWeight: 600, color: '#047857', background: '#ecfdf5' }),
  textWidget({ type: 'AmountText', displayName: 'amount text', content: '$12,580.00', fontSize: 20, fontWeight: 700, color: '#111827' }),
  textWidget({ type: 'NumericText', displayName: 'numeric text', content: '1280', fontSize: 20, fontWeight: 700, color: '#111827' }),
  textWidget({ type: 'TimeText', displayName: 'time text', content: '2026-05-07 14:30', fontSize: 13, fontWeight: 400, color: '#4b5563' }),
  widget('Rectangle', 'rectangle', 'layout', { fill: '#ffffff', border: '1px solid #d1d5db', radius: 4, width: 160, height: 96 }, [
    { key: 'fill', label: 'Fill', control: 'text' },
    { key: 'border', label: 'Border', control: 'text' },
    { key: 'radius', label: 'Radius', control: 'number', min: 0, max: 80 },
    { key: 'width', label: 'Width', control: 'number', min: 1, max: 2400 },
    { key: 'height', label: 'Height', control: 'number', min: 1, max: 1600 },
  ]),
  widget('Circle', 'circle', 'layout', { fill: '#ffffff', border: '1px solid #d1d5db', width: 96, height: 96 }, [
    { key: 'fill', label: 'Fill', control: 'text' },
    { key: 'border', label: 'Border', control: 'text' },
    { key: 'width', label: 'Width', control: 'number', min: 1, max: 1600 },
    { key: 'height', label: 'Height', control: 'number', min: 1, max: 1600 },
  ]),
  widget('Line', 'line', 'layout', { color: '#9ca3af', thickness: 1, width: 160 }, [
    { key: 'color', label: 'Color', control: 'text' },
    { key: 'thickness', label: 'Thickness', control: 'number', min: 1, max: 24 },
    { key: 'width', label: 'Width', control: 'number', min: 1, max: 2400 },
  ]),
  widget('Arrow', 'arrow', 'layout', { color: '#6b7280', thickness: 2, width: 160, arrowHead: true }, [
    { key: 'color', label: 'Color', control: 'text' },
    { key: 'thickness', label: 'Thickness', control: 'number', min: 1, max: 24 },
    { key: 'width', label: 'Width', control: 'number', min: 1, max: 2400 },
    { key: 'arrowHead', label: 'Arrow head', control: 'boolean' },
  ]),
  widget('ImageWidget', 'image', 'data', { src: '', alt: 'Image', fit: 'cover', width: 240, height: 135 }, [
    { key: 'src', label: 'Image URL', control: 'text' },
    { key: 'alt', label: 'Alt text', control: 'text' },
    { key: 'width', label: 'Width', control: 'number', min: 1, max: 2400 },
    { key: 'height', label: 'Height', control: 'number', min: 1, max: 1600 },
  ]),
  widget('IconWidget', 'icon', 'data', { icon: 'SearchOutlined', color: '#1677ff', size: 24 }, [
    { key: 'icon', label: 'Icon', control: 'text' },
    { key: 'color', label: 'Color', control: 'text' },
    { key: 'size', label: 'Size', control: 'number', min: 8, max: 128 },
  ]),
  widget('Placeholder', 'placeholder', 'layout', { label: 'Placeholder', width: 240, height: 120 }, [
    { key: 'label', label: 'Label', control: 'text' },
    { key: 'width', label: 'Width', control: 'number', min: 1, max: 2400 },
    { key: 'height', label: 'Height', control: 'number', min: 1, max: 1600 },
  ]),
  widget('DividerWidget', 'divider', 'layout', { text: '', color: '#d1d5db', thickness: 1, width: 240 }, [
    { key: 'text', label: 'Text', control: 'text' },
    { key: 'color', label: 'Color', control: 'text' },
    { key: 'thickness', label: 'Thickness', control: 'number', min: 1, max: 24 },
    { key: 'width', label: 'Width', control: 'number', min: 1, max: 2400 },
  ]),
  widget('HotZone', 'hot zone', 'layout', { label: 'Hot zone', border: '1px dashed #f59e0b', background: 'rgba(245, 158, 11, 0.08)', width: 160, height: 96 }, [
    { key: 'label', label: 'Label', control: 'text' },
    { key: 'width', label: 'Width', control: 'number', min: 1, max: 2400 },
    { key: 'height', label: 'Height', control: 'number', min: 1, max: 1600 },
  ]),
];
