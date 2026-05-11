import type { ComponentNode } from '../../domain/types';
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

export function RenderNode(props: Props) {
  const Renderer = renderers[props.node.type] ?? (getDescriptor(props.node.type) || getComponentDefinition(props.node.type) ? GenericAntdRenderer : undefined);
  if (!Renderer) return <div>暂不支持的组件：{componentLabel(props.node.type)}</div>;
  const compact = compactRuntimeTypes.has(props.node.type);
  const layoutStyle =
    props.node.layout?.width || props.node.layout?.height
      ? {
          width: props.node.layout.width,
          minHeight: props.node.layout.height,
        }
      : undefined;
  const rendered = <Renderer {...props} />;
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
