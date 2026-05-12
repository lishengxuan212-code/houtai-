import type { ComponentNode, JsonValue } from '../../domain/types';
import type { CSSProperties } from 'react';
import { componentLabel } from '../componentLabels';
import type { RendererContext } from './rendererTypes';
import { ButtonRenderer } from './ButtonRenderer';
import { CardRenderer, PageContainerRenderer, SectionRenderer } from './ContainerRenderer';
import { DrawerRenderer } from './DrawerRenderer';
import { FormRenderer } from './FormRenderer';
import { InputRenderer } from './InputRenderer';
import { ModalRenderer } from './ModalRenderer';
import { SearchBarRenderer } from './SearchBarRenderer';
import { SelectRenderer } from './SelectRenderer';
import { TableRenderer } from './TableRenderer';
import { TabsRenderer } from './TabsRenderer';
import { GenericAntdRenderer } from './GenericAntdRenderer';
import { PrototypeWidgetRenderer } from './PrototypeWidgetRenderer';
import { getDescriptor } from '../componentRegistry';
import { getComponentDefinition } from '../componentDefinitionRegistry';
import { proComponentRenderers } from '../proComponents/proComponentRendererMap';

type Props = {
  node: ComponentNode;
  children?: React.ReactNode;
  context: RendererContext;
};

const renderers: Record<string, React.ComponentType<Props>> = {
  PageContainer: PageContainerRenderer,
  Section: SectionRenderer,
  Card: CardRenderer,
  Button: ButtonRenderer,
  Input: InputRenderer,
  Select: SelectRenderer,
  SearchBar: SearchBarRenderer,
  Table: TableRenderer,
  Form: FormRenderer,
  Modal: ModalRenderer,
  Drawer: DrawerRenderer,
  Tabs: TabsRenderer,
  H1: PrototypeWidgetRenderer,
  H2: PrototypeWidgetRenderer,
  H3: PrototypeWidgetRenderer,
  BodyText: PrototypeWidgetRenderer,
  HelperText: PrototypeWidgetRenderer,
  LinkText: PrototypeWidgetRenderer,
  ErrorText: PrototypeWidgetRenderer,
  Annotation: PrototypeWidgetRenderer,
  StickyNote: PrototypeWidgetRenderer,
  Rectangle: PrototypeWidgetRenderer,
  Circle: PrototypeWidgetRenderer,
  Line: PrototypeWidgetRenderer,
  Arrow: PrototypeWidgetRenderer,
  ImageWidget: PrototypeWidgetRenderer,
  IconWidget: PrototypeWidgetRenderer,
  Placeholder: PrototypeWidgetRenderer,
  DividerWidget: PrototypeWidgetRenderer,
  HotZone: PrototypeWidgetRenderer,
  ModuleTitle: PrototypeWidgetRenderer,
  PageTitle: PrototypeWidgetRenderer,
  StatusLabel: PrototypeWidgetRenderer,
  AmountText: PrototypeWidgetRenderer,
  NumericText: PrototypeWidgetRenderer,
  TimeText: PrototypeWidgetRenderer,
  VisualBlock: PrototypeWidgetRenderer,
  WhitePanel: PrototypeWidgetRenderer,
  BadgePill: PrototypeWidgetRenderer,
  HeaderBar: PrototypeWidgetRenderer,
  SideNavBlock: PrototypeWidgetRenderer,
  TableSkeleton: PrototypeWidgetRenderer,
  ...proComponentRenderers,
};

const compactRuntimeTypes = new Set(['Button', 'Input', 'Select', 'Message']);

function stringProp(value: JsonValue | undefined): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function numberProp(value: JsonValue | undefined): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function commonAppearanceStyle(node: ComponentNode): CSSProperties | undefined {
  const props = node.props;
  const borderStyle = stringProp(props.borderStyle);
  const borderWidth = numberProp(props.borderWidth);
  const borderColor = stringProp(props.borderColor);
  const shadow = stringProp(props.shadow);
  const opacity = numberProp(props.opacity);
  const style: CSSProperties = {};

  if (opacity !== undefined) style.opacity = opacity > 1 ? opacity / 100 : opacity;
  if (stringProp(props.fontFamily)) style.fontFamily = stringProp(props.fontFamily);
  if (numberProp(props.fontSize)) style.fontSize = numberProp(props.fontSize);
  if (numberProp(props.fontWeight)) style.fontWeight = numberProp(props.fontWeight);
  if (stringProp(props.color)) style.color = stringProp(props.color);
  if (numberProp(props.lineHeight)) style.lineHeight = numberProp(props.lineHeight);
  if (numberProp(props.letterSpacing) !== undefined) style.letterSpacing = numberProp(props.letterSpacing);
  if (stringProp(props.align)) style.textAlign = stringProp(props.align) as CSSProperties['textAlign'];
  if (props.underline === true || props.strikethrough === true) style.textDecoration = [props.underline === true ? 'underline' : '', props.strikethrough === true ? 'line-through' : ''].filter(Boolean).join(' ');
  if (stringProp(props.background) || stringProp(props.fill)) style.background = stringProp(props.background) ?? stringProp(props.fill);
  if (borderStyle || borderWidth !== undefined || borderColor) style.border = `${borderWidth ?? 1}px ${borderStyle ?? 'solid'} ${borderColor ?? '#d1d5db'}`;
  if (numberProp(props.radius) !== undefined || numberProp(props.borderRadius) !== undefined) style.borderRadius = numberProp(props.borderRadius) ?? numberProp(props.radius);
  if (shadow) style.boxShadow = shadow;
  if (numberProp(props.paddingLeft) !== undefined) style.paddingLeft = numberProp(props.paddingLeft);
  if (numberProp(props.paddingTop) !== undefined) style.paddingTop = numberProp(props.paddingTop);
  if (numberProp(props.paddingRight) !== undefined) style.paddingRight = numberProp(props.paddingRight);
  if (numberProp(props.paddingBottom) !== undefined) style.paddingBottom = numberProp(props.paddingBottom);
  if (Object.keys(style).length === 0) return undefined;
  return { boxSizing: 'border-box', width: '100%', height: '100%', ...style };
}

export function RenderNode(props: Props) {
  const Renderer = renderers[props.node.type] ?? (getDescriptor(props.node.type) || getComponentDefinition(props.node.type) ? GenericAntdRenderer : undefined);
  if (!Renderer) return <div>暂不支持的组件：{componentLabel(props.node.type)}</div>;
  const compact = props.context.mode === 'preview' && compactRuntimeTypes.has(props.node.type);
  const layoutStyle =
    props.node.layout?.width || props.node.layout?.height
      ? {
          width: props.node.layout.width,
          minHeight: props.node.layout.height,
        }
      : undefined;
  const baseRendered = <Renderer {...props} />;
  const appearanceStyle = commonAppearanceStyle(props.node);
  const rendered = appearanceStyle ? <div style={appearanceStyle}>{baseRendered}</div> : baseRendered;
  const runtimeDisabled = props.context.mode === 'preview' && props.context.isNodeDisabled?.(props.node.id);
  const disabledStyle = runtimeDisabled ? { pointerEvents: 'none' as const, opacity: 0.65 } : undefined;

  return layoutStyle || compact ? (
    <div className={`runtime-node-layout${compact ? ' compact' : ''}`} aria-disabled={runtimeDisabled || undefined} style={{ ...layoutStyle, ...disabledStyle }}>
      {rendered}
    </div>
  ) : runtimeDisabled ? (
    <div aria-disabled style={disabledStyle}>
      {rendered}
    </div>
  ) : (
    rendered
  );
}
