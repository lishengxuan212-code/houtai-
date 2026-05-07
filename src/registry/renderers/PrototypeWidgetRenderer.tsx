import type { CSSProperties } from 'react';
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
    fontFamily: stringProp(node.props.fontFamily, 'Arial, sans-serif'),
    lineHeight: numberProp(node.props.lineHeight, 1.4),
    letterSpacing: numberProp(node.props.letterSpacing, 0),
    textAlign: stringProp(node.props.align, 'left') as CSSProperties['textAlign'],
    textDecoration: [underline ? 'underline' : '', strikethrough ? 'line-through' : ''].filter(Boolean).join(' ') || 'none',
    background: stringProp(node.props.background, 'transparent'),
    border: stringProp(node.props.border, 'none'),
    borderRadius: numberProp(node.props.radius, 0),
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
          width: numberProp(node.props.width, 160),
          height: numberProp(node.props.height, 96),
          background: stringProp(node.props.background, stringProp(node.props.fill, '#ffffff')),
          border: stringProp(node.props.border, '1px solid #d1d5db'),
          borderRadius: numberProp(node.props.radius, 4),
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

  if (node.type === 'Circle') {
    return <div style={{ width: numberProp(node.props.width, 96), height: numberProp(node.props.height, 96), background: stringProp(node.props.fill, '#ffffff'), border: stringProp(node.props.border, '1px solid #d1d5db'), borderRadius: '50%' }} />;
  }

  if (node.type === 'Line' || node.type === 'Arrow') {
    return (
      <div style={{ width: numberProp(node.props.width, 160), display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: 1, borderTop: `${numberProp(node.props.thickness, 1)}px solid ${stringProp(node.props.color, '#9ca3af')}` }} />
        {node.type === 'Arrow' && boolProp(node.props.arrowHead) ? (
          <div style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: `8px solid ${stringProp(node.props.color, '#6b7280')}` }} />
        ) : null}
      </div>
    );
  }

  if (node.type === 'ImageWidget') {
    const src = stringProp(node.props.src);
    return src ? (
      <img src={src} alt={stringProp(node.props.alt, 'Image')} style={{ width: numberProp(node.props.width, 240), height: numberProp(node.props.height, 135), objectFit: 'cover' }} />
    ) : (
      <div style={{ width: numberProp(node.props.width, 240), height: numberProp(node.props.height, 135), border: '1px dashed #d1d5db', display: 'grid', placeItems: 'center', color: '#6b7280' }}>Image</div>
    );
  }

  if (node.type === 'IconWidget') return <span style={{ color: stringProp(node.props.color, '#1677ff'), fontSize: numberProp(node.props.size, 24) }}>{stringProp(node.props.icon, 'Icon')}</span>;
  if (node.type === 'DividerWidget') return <div style={{ width: numberProp(node.props.width, 240), borderTop: `${numberProp(node.props.thickness, 1)}px solid ${stringProp(node.props.color, '#d1d5db')}`, color: '#6b7280', fontSize: 12 }}>{stringProp(node.props.text)}</div>;
  if (node.type === 'Placeholder') return <div style={{ width: numberProp(node.props.width, 240), height: numberProp(node.props.height, 120), border: '1px dashed #9ca3af', display: 'grid', placeItems: 'center', color: '#6b7280' }}>{stringProp(node.props.label, 'Placeholder')}</div>;

  return null;
}
