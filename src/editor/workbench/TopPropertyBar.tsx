import { Button, ColorPicker, Divider, Input, InputNumber, Select, Space, Tooltip, Typography } from 'antd';
import type { Color } from 'antd/es/color-picker';
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Eye, EyeOff, Italic, Lock, Strikethrough, Underline, Unlock } from 'lucide-react';
import type { ComponentNode, JsonValue, NodeCanvasConfig } from '../../domain/types';
import { componentLabel } from '../../registry/componentLabels';
import { useProjectStore } from '../../store/projectStore';

type CanvasNumberKey = 'x' | 'y' | 'width' | 'height';

const fontOptions = [
  { label: 'Microsoft YaHei', value: 'Microsoft YaHei, PingFang SC, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'PingFang SC', value: 'PingFang SC, Microsoft YaHei, sans-serif' },
  { label: 'SimSun', value: 'SimSun, serif' },
  { label: 'Consolas', value: 'Consolas, monospace' },
];

const weightOptions = [
  { label: 'Light', value: 300 },
  { label: 'Normal', value: 400 },
  { label: 'Medium', value: 500 },
  { label: 'Bold', value: 700 },
];

const borderStyleOptions = [
  { label: '实线', value: 'solid' },
  { label: '虚线', value: 'dashed' },
  { label: '点线', value: 'dotted' },
  { label: '无', value: 'none' },
];

const textKeys = ['content', 'text', 'title', 'label', 'placeholder'] as const;
const axureColorPresets = [
  {
    label: '常用颜色',
    colors: ['#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff', '#f5222d', '#fa8c16', '#fadb14', '#52c41a', '#13c2c2', '#1677ff', '#722ed1'],
  },
  {
    label: '建议颜色',
    colors: ['#5c0011', '#612500', '#614700', '#135200', '#00474f', '#002766', '#120338', '#f1f5f9', '#e5e7eb', '#d1d5db'],
  },
];

function asNumber(value: JsonValue | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asString(value: JsonValue | undefined, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function colorString(color: Color, hex: string) {
  const alpha = color.toRgb().a;
  return alpha < 1 ? color.toRgbString() : hex;
}

function firstTextKey(node: ComponentNode): string | undefined {
  return textKeys.find((key) => typeof node.props[key] === 'string');
}

function normalizeBorder(value: JsonValue | undefined) {
  const border = asString(value, '1px solid #d1d5db');
  if (border === 'none') return { width: 0, style: 'none', color: '#d1d5db' };
  const match = border.match(/^(\d+(?:\.\d+)?)px\s+(\w+)\s+(.+)$/);
  return {
    width: match ? Number(match[1]) : 1,
    style: match?.[2] ?? 'solid',
    color: match?.[3] ?? '#d1d5db',
  };
}

function borderFromNode(node: ComponentNode) {
  const parsed = normalizeBorder(node.props.border);
  return {
    width: asNumber(node.props.borderWidth, parsed.width),
    style: asString(node.props.borderStyle, parsed.style),
    color: asString(node.props.borderColor, parsed.color),
  };
}

function canvasNumber(canvas: NodeCanvasConfig | undefined, key: CanvasNumberKey) {
  return canvas?.[key] ?? 0;
}

export function TopPropertyBar() {
  const project = useProjectStore((state) => state.project);
  const pageId = useProjectStore((state) => state.currentPageId);
  const selectedNodeId = useProjectStore((state) => state.selectedNodeId);
  const apply = useProjectStore((state) => state.apply);
  const page = project.pages.find((item) => item.id === pageId);
  const node = selectedNodeId && !selectedNodeId.includes(':') ? page?.nodes[selectedNodeId] : undefined;
  const canvas = node?.canvas;
  const textKey = node ? firstTextKey(node) : undefined;
  const border = node ? borderFromNode(node) : normalizeBorder(undefined);

  if (!page || !node || node.id === page.rootNodeId) {
    return (
      <div className="top-property-bar empty">
        <Typography.Text type="secondary">选择组件后可在这里编辑属性</Typography.Text>
      </div>
    );
  }

  const activePage = page;
  const activeNode = node;

  function patchProps(patch: Record<string, JsonValue>) {
    apply({ type: 'updateNodeProps', pageId: activePage.id, nodeId: activeNode.id, props: patch });
  }

  function updateName(name: string) {
    apply({ type: 'updateNodeName', pageId: activePage.id, nodeId: activeNode.id, name });
    apply({ type: 'updateNodeSemantic', pageId: activePage.id, nodeId: activeNode.id, semantic: { moduleName: name } });
  }

  function updateCanvas(key: CanvasNumberKey, value: string | number | null) {
    const next = typeof value === 'number' && Number.isFinite(value) ? value : canvasNumber(canvas, key);
    apply({ type: 'updateNodeCanvas', pageId: activePage.id, nodeId: activeNode.id, canvas: { [key]: Math.max(key === 'width' || key === 'height' ? 1 : 0, Math.round(next)) } });
  }

  function updateBorder(patch: Partial<typeof border>) {
    const next = { ...border, ...patch };
    patchProps({
      borderWidth: next.width,
      borderStyle: next.style,
      borderColor: next.color,
      border: next.style === 'none' || next.width <= 0 ? 'none' : `${next.width}px ${next.style} ${next.color}`,
    });
  }

  function updateRadius(borderRadius: string | number | null) {
    const value = Number(borderRadius ?? 0);
    patchProps({ borderRadius: value, radius: value });
  }

  function updateAlign(textAlign: string) {
    patchProps({ textAlign, align: textAlign });
  }

  function toggleUnderline() {
    const enabled = activeNode.props.underline === true || activeNode.props.textDecoration === 'underline';
    patchProps({ underline: !enabled, textDecoration: enabled ? 'none' : 'underline' });
  }

  function toggleStrike() {
    const enabled = activeNode.props.strikethrough === true || activeNode.props.textDecoration === 'line-through';
    patchProps({ strikethrough: !enabled, textDecoration: enabled ? 'none' : 'line-through' });
  }

  const align = asString(node.props.textAlign ?? node.props.align, 'left');
  const fontWeight = asNumber(node.props.fontWeight, 400);
  const borderRadius = asNumber(node.props.borderRadius ?? node.props.radius, 0);
  const editorVisible = !canvas?.hidden;
  const locked = Boolean(canvas?.locked);

  return (
    <div className="top-property-bar" role="toolbar" aria-label="顶部属性栏">
      <div className="top-prop-group identity">
        <span className="top-prop-section-label">组件</span>
        <Input className="top-prop-name" aria-label="top-prop-component-name" value={node.name} onChange={(event) => updateName(event.target.value)} />
        <Typography.Text className="top-prop-type" type="secondary">{componentLabel(node.type)}</Typography.Text>
        {textKey ? <Input className="top-prop-text" aria-label="top-prop-text" value={asString(node.props[textKey])} onChange={(event) => patchProps({ [textKey]: event.target.value })} /> : null}
      </div>
      <Divider orientation="vertical" />
      <div className="top-prop-group text">
        <span className="top-prop-section-label">文字</span>
        <Select className="top-prop-font" aria-label="top-prop-font-family" value={asString(node.props.fontFamily, fontOptions[0]!.value)} options={fontOptions} onChange={(fontFamily) => patchProps({ fontFamily })} />
        <Select className="top-prop-weight" aria-label="top-prop-font-weight" value={fontWeight} options={weightOptions} onChange={(value) => patchProps({ fontWeight: value })} />
        <InputNumber className="top-prop-size" aria-label="top-prop-font-size" min={8} max={96} value={asNumber(node.props.fontSize, 13)} onChange={(fontSize) => patchProps({ fontSize: Number(fontSize ?? 13) })} />
        <ColorPicker aria-label="top-prop-color" presets={axureColorPresets} value={asString(node.props.color, '#1f2937')} onChange={(color, hex) => patchProps({ color: colorString(color, hex) })} />
        <Space.Compact>
          <Tooltip title="加粗"><Button aria-label="top-prop-bold" type={fontWeight >= 700 ? 'primary' : 'default'} icon={<Bold size={14} />} onClick={() => patchProps({ fontWeight: fontWeight >= 700 ? 400 : 700 })} /></Tooltip>
          <Tooltip title="斜体"><Button aria-label="top-prop-italic" type={node.props.fontStyle === 'italic' ? 'primary' : 'default'} icon={<Italic size={14} />} onClick={() => patchProps({ fontStyle: node.props.fontStyle === 'italic' ? 'normal' : 'italic' })} /></Tooltip>
          <Tooltip title="下划线"><Button aria-label="top-prop-underline" type={node.props.underline === true || node.props.textDecoration === 'underline' ? 'primary' : 'default'} icon={<Underline size={14} />} onClick={toggleUnderline} /></Tooltip>
          <Tooltip title="删除线"><Button aria-label="top-prop-strike" type={node.props.strikethrough === true || node.props.textDecoration === 'line-through' ? 'primary' : 'default'} icon={<Strikethrough size={14} />} onClick={toggleStrike} /></Tooltip>
        </Space.Compact>
        <Space.Compact>
          <Tooltip title="左对齐"><Button aria-label="top-prop-align-left" type={align === 'left' ? 'primary' : 'default'} icon={<AlignLeft size={14} />} onClick={() => updateAlign('left')} /></Tooltip>
          <Tooltip title="居中"><Button aria-label="top-prop-align-center" type={align === 'center' ? 'primary' : 'default'} icon={<AlignCenter size={14} />} onClick={() => updateAlign('center')} /></Tooltip>
          <Tooltip title="右对齐"><Button aria-label="top-prop-align-right" type={align === 'right' ? 'primary' : 'default'} icon={<AlignRight size={14} />} onClick={() => updateAlign('right')} /></Tooltip>
          <Tooltip title="两端对齐"><Button aria-label="top-prop-align-justify" type={align === 'justify' ? 'primary' : 'default'} icon={<AlignJustify size={14} />} onClick={() => updateAlign('justify')} /></Tooltip>
        </Space.Compact>
      </div>
      <Divider orientation="vertical" />
      <div className="top-prop-group appearance">
        <span className="top-prop-section-label">外观</span>
        <span className="top-prop-label">填充</span>
        <ColorPicker aria-label="top-prop-fill" presets={axureColorPresets} value={asString(node.props.fill ?? node.props.background, '#ffffff')} onChange={(color, hex) => patchProps({ fill: colorString(color, hex), background: colorString(color, hex) })} />
        <span className="top-prop-label">边框</span>
        <InputNumber className="top-prop-border-width" aria-label="top-prop-border-width" min={0} max={20} value={border.width} onChange={(width) => updateBorder({ width: Number(width ?? 0) })} />
        <ColorPicker aria-label="top-prop-border-color" presets={axureColorPresets} value={border.color} onChange={(color, hex) => updateBorder({ color: colorString(color, hex) })} />
        <Select className="top-prop-border-style" aria-label="top-prop-border-style" value={border.style} options={borderStyleOptions} onChange={(style) => updateBorder({ style })} />
        <label className="top-prop-radius-control">
          <span>圆角</span>
          <InputNumber className="top-prop-radius" aria-label="top-prop-radius" min={0} max={80} value={borderRadius} onChange={updateRadius} />
        </label>
        <span className="top-prop-label">内边距</span>
        <InputNumber className="top-prop-padding" aria-label="top-prop-padding" min={0} max={80} value={asNumber(node.props.padding, 0)} onChange={(padding) => patchProps({ padding: Number(padding ?? 0) })} />
      </div>
      <Divider orientation="vertical" />
      <div className="top-prop-group geometry">
        <span className="top-prop-section-label">位置</span>
        <span className="top-prop-axis-label">X</span>
        <InputNumber className="top-prop-xy" aria-label="top-prop-x" value={canvasNumber(canvas, 'x')} onChange={(value) => updateCanvas('x', value)} />
        <span className="top-prop-axis-label">Y</span>
        <InputNumber className="top-prop-xy" aria-label="top-prop-y" value={canvasNumber(canvas, 'y')} onChange={(value) => updateCanvas('y', value)} />
        <span className="top-prop-axis-label">宽</span>
        <InputNumber className="top-prop-xy" aria-label="top-prop-width" min={1} value={canvasNumber(canvas, 'width')} onChange={(value) => updateCanvas('width', value)} />
        <span className="top-prop-axis-label">高</span>
        <InputNumber className="top-prop-xy" aria-label="top-prop-height" min={1} value={canvasNumber(canvas, 'height')} onChange={(value) => updateCanvas('height', value)} />
      </div>
      <div className="top-prop-group state">
        <span className="top-prop-section-label">状态</span>
        <Space.Compact>
          <Tooltip title={locked ? '解锁' : '锁定'}><Button aria-label="top-prop-lock" icon={locked ? <Lock size={14} /> : <Unlock size={14} />} onClick={() => apply({ type: 'setNodeCanvasLocked', pageId: activePage.id, nodeId: activeNode.id, locked: !locked })} /></Tooltip>
          <Tooltip title={editorVisible ? '隐藏' : '显示'}><Button aria-label="top-prop-visible" icon={editorVisible ? <Eye size={14} /> : <EyeOff size={14} />} onClick={() => apply({ type: 'setNodeCanvasHidden', pageId: activePage.id, nodeId: activeNode.id, hidden: editorVisible })} /></Tooltip>
        </Space.Compact>
      </div>
    </div>
  );
}
