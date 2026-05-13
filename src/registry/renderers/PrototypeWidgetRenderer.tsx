import { createElement, type CSSProperties } from 'react';
import {
  Bell,
  Calendar,
  Check,
  ChevronDown,
  CircleHelp,
  Download,
  Edit3,
  Eye,
  FileText,
  Home,
  Image,
  Info,
  Mail,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
  Upload,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { ComponentNode, JsonValue } from '../../domain/types';
import type { RendererContext } from './rendererTypes';

type Props = {
  node: ComponentNode;
  context: RendererContext;
};

const textWidgetTypes = new Set([
  'H1',
  'H2',
  'H3',
  'BodyText',
  'HelperText',
  'LinkText',
  'ErrorText',
  'Annotation',
  'StickyNote',
  'ModuleTitle',
  'PageTitle',
  'StatusLabel',
  'AmountText',
  'NumericText',
  'TimeText',
]);

function stringProp(value: JsonValue | undefined, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function numberProp(value: JsonValue | undefined, fallback: number): number {
  return typeof value === 'number' ? value : fallback;
}

function boolProp(value: JsonValue | undefined): boolean {
  return typeof value === 'boolean' ? value : false;
}

function arrayProp(value: JsonValue | undefined, fallback: string[] = []): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : fallback;
}

function borderStyle(node: ComponentNode, fallback = '1px solid #d1d5db'): string {
  const explicit = stringProp(node.props.border);
  if (explicit) return explicit;
  const width = numberProp(node.props.borderWidth, 1);
  const style = stringProp(node.props.borderStyle, 'solid');
  const color = stringProp(node.props.borderColor, fallback.split(' ').slice(2).join(' ') || '#d1d5db');
  return style === 'none' || width <= 0 ? 'none' : `${width}px ${style} ${color}`;
}

function radiusValue(node: ComponentNode, fallback: number): number {
  return numberProp(node.props.borderRadius, numberProp(node.props.radius, fallback));
}

function backgroundValue(node: ComponentNode, fallback: string): string {
  return stringProp(node.props.background, stringProp(node.props.fill, fallback));
}

const iconMap: Record<string, LucideIcon> = {
  BellOutlined: Bell,
  CalendarOutlined: Calendar,
  CheckOutlined: Check,
  CloseOutlined: X,
  DeleteOutlined: Trash2,
  DownOutlined: ChevronDown,
  DownloadOutlined: Download,
  EditOutlined: Edit3,
  EyeOutlined: Eye,
  FileTextOutlined: FileText,
  HomeOutlined: Home,
  InfoCircleOutlined: Info,
  MailOutlined: Mail,
  MenuOutlined: Menu,
  MessageOutlined: MessageCircle,
  PictureOutlined: Image,
  PlusOutlined: Plus,
  QuestionCircleOutlined: CircleHelp,
  SearchOutlined: Search,
  SettingOutlined: Settings,
  StarOutlined: Star,
  UploadOutlined: Upload,
  UserOutlined: User,
};

function iconComponent(name: string): LucideIcon {
  return iconMap[name] ?? CircleHelp;
}

function textStyle(node: ComponentNode): CSSProperties {
  const underline = boolProp(node.props.underline);
  const strikethrough = boolProp(node.props.strikethrough);
  return {
    boxSizing: 'border-box',
    display: 'block',
    width: numberProp(node.props.width, 320),
    minHeight: numberProp(node.props.height, 1),
    fontSize: numberProp(node.props.fontSize, 14),
    fontWeight: numberProp(node.props.fontWeight, 400),
    color: stringProp(node.props.color, '#111827'),
    fontFamily: stringProp(node.props.fontFamily, 'Microsoft YaHei, PingFang SC, sans-serif'),
    lineHeight: numberProp(node.props.lineHeight, 1.4),
    letterSpacing: numberProp(node.props.letterSpacing, 0),
    textAlign: stringProp(node.props.textAlign, stringProp(node.props.align, 'left')) as CSSProperties['textAlign'],
    textDecoration: [underline ? 'underline' : '', strikethrough ? 'line-through' : ''].filter(Boolean).join(' ') || 'none',
    background: backgroundValue(node, 'transparent'),
    border: borderStyle(node, 'none'),
    borderRadius: radiusValue(node, 0),
    padding: numberProp(node.props.padding, 0),
    whiteSpace: stringProp(node.props.wrapping, 'wrap') === 'nowrap' ? 'nowrap' : 'normal',
    overflow: boolProp(node.props.ellipsis) ? 'hidden' : undefined,
    textOverflow: boolProp(node.props.ellipsis) ? 'ellipsis' : undefined,
  };
}

export function PrototypeWidgetRenderer({ node, context }: Props) {
  if (textWidgetTypes.has(node.type)) {
    const content = stringProp(node.props.content, node.name);
    return (
      <div style={textStyle(node)} onClick={() => context.dispatch?.({ componentId: node.id, event: 'click' })}>
        {context.inlineEdit?.text({ node, propKey: 'content', value: content }) ?? content}
      </div>
    );
  }

  if (node.type === 'Rectangle' || node.type === 'HotZone') {
    return (
      <div
        style={{
          boxSizing: 'border-box',
          width: '100%',
          height: '100%',
          background: backgroundValue(node, '#ffffff'),
          border: borderStyle(node),
          borderRadius: radiusValue(node, 4),
          display: 'grid',
          placeItems: 'center',
          color: '#92400e',
          fontSize: 12,
        }}
        onClick={() => context.dispatch?.({ componentId: node.id, event: 'click' })}
      >
        {node.type === 'HotZone' ? stringProp(node.props.label, 'Hot zone') : null}
      </div>
    );
  }

  if (node.type === 'VisualBlock' || node.type === 'WhitePanel') {
    return (
      <div
        style={{
          boxSizing: 'border-box',
          width: '100%',
          height: '100%',
          background: backgroundValue(node, '#f1f5f9'),
          border: borderStyle(node, '1px solid #dbe3ef'),
          borderRadius: radiusValue(node, 6),
          boxShadow: stringProp(node.props.shadow, 'none'),
        }}
      />
    );
  }

  if (node.type === 'BadgePill') {
    return (
      <div
        style={{
          boxSizing: 'border-box',
          display: 'grid',
          placeItems: 'center',
          width: '100%',
          height: '100%',
          color: stringProp(node.props.color, '#1677ff'),
          background: stringProp(node.props.background, '#e6f4ff'),
          border: borderStyle(node, '1px solid #91caff'),
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {stringProp(node.props.text, '状态标签')}
      </div>
    );
  }

  if (node.type === 'HeaderBar') {
    return (
      <div
        style={{
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: '0 20px',
          background: backgroundValue(node, '#ffffff'),
          border: borderStyle(node, '1px solid #e5e7eb'),
          color: '#111827',
          fontWeight: 700,
        }}
      >
        <span>{stringProp(node.props.title, '后台系统')}</span>
        <span style={{ width: 96, height: 24, borderRadius: 12, background: '#f1f5f9' }} />
      </div>
    );
  }

  if (node.type === 'SideNavBlock') {
    const items = arrayProp(node.props.items, ['首页', '订单管理', '系统设置']);
    return (
      <div style={{ boxSizing: 'border-box', width: '100%', height: '100%', padding: 12, background: backgroundValue(node, '#ffffff'), border: borderStyle(node, '1px solid #e5e7eb') }}>
        <div style={{ marginBottom: 10, color: '#111827', fontWeight: 700 }}>{stringProp(node.props.title, '菜单')}</div>
        {items.map((item, index) => (
          <div key={item} style={{ height: 34, padding: '7px 10px', borderRadius: 6, background: index === 0 ? stringProp(node.props.activeColor, '#e6f4ff') : 'transparent', color: index === 0 ? '#1677ff' : '#475569', fontSize: 13 }}>
            {item}
          </div>
        ))}
      </div>
    );
  }

  if (node.type === 'TableSkeleton') {
    const columns = Math.max(1, Math.round(numberProp(node.props.columns, 6)));
    const rows = Math.max(1, Math.round(numberProp(node.props.rows, 4)));
    return (
      <div style={{ boxSizing: 'border-box', display: 'grid', gap: 10, width: '100%', height: '100%', padding: 12, border: borderStyle(node, '1px solid #e5e7eb'), borderRadius: radiusValue(node, 6), background: '#ffffff' }}>
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 6 }}>
            {[...Array(columns)].map((__, colIndex) => (
              <span key={colIndex} style={{ height: rowIndex === 0 ? 28 : 24, borderRadius: 4, background: rowIndex === 0 ? stringProp(node.props.headerColor, '#dff1fb') : stringProp(node.props.rowColor, '#f1f5f9') }} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (node.type === 'Circle') {
    return <div style={{ boxSizing: 'border-box', width: '100%', height: '100%', background: backgroundValue(node, '#ffffff'), border: borderStyle(node), borderRadius: '50%' }} />;
  }

  if (node.type === 'Line' || node.type === 'Arrow') {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: 1, borderTop: `${numberProp(node.props.thickness, numberProp(node.props.borderWidth, 1))}px ${stringProp(node.props.borderStyle, 'solid')} ${stringProp(node.props.color, stringProp(node.props.borderColor, '#9ca3af'))}` }} />
        {node.type === 'Arrow' && boolProp(node.props.arrowHead) ? (
          <div style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: `8px solid ${stringProp(node.props.color, '#6b7280')}` }} />
        ) : null}
      </div>
    );
  }

  if (node.type === 'ImageWidget') {
    const src = stringProp(node.props.src);
    return src ? (
      <img src={src} alt={stringProp(node.props.alt, 'Image')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    ) : (
      <div style={{ boxSizing: 'border-box', width: '100%', height: '100%', border: '1px dashed #d1d5db', display: 'grid', placeItems: 'center', color: '#6b7280' }}>Image</div>
    );
  }

  if (node.type === 'IconWidget') {
    const size = numberProp(node.props.size, 24);
    return (
      <span data-testid={`icon-widget-${node.id}`} style={{ boxSizing: 'border-box', display: 'grid', placeItems: 'center', width: '100%', height: '100%', color: stringProp(node.props.color, '#1677ff'), fontSize: size }}>
        {createElement(iconComponent(stringProp(node.props.icon, 'QuestionCircleOutlined')), { 'aria-hidden': true, size, strokeWidth: 2 })}
      </span>
    );
  }
  if (node.type === 'DividerWidget') return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', borderTop: `${numberProp(node.props.thickness, numberProp(node.props.borderWidth, 1))}px ${stringProp(node.props.borderStyle, 'solid')} ${stringProp(node.props.color, stringProp(node.props.borderColor, '#d1d5db'))}`, color: '#6b7280', fontSize: 12 }}>{stringProp(node.props.text)}</div>;
  if (node.type === 'Placeholder') return <div style={{ boxSizing: 'border-box', width: '100%', height: '100%', border: borderStyle(node, '1px dashed #9ca3af'), borderRadius: radiusValue(node, 0), display: 'grid', placeItems: 'center', color: '#6b7280' }}>{stringProp(node.props.label, 'Placeholder')}</div>;

  return null;
}
