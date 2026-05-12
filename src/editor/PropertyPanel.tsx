import { Typography } from 'antd';
import { componentLabel } from '../registry/componentLabels';
import { getComponentDefinition } from '../registry/componentDefinitionRegistry';
import { getDescriptor } from '../registry/componentRegistry';
import { useProjectStore } from '../store/projectStore';
import { GeneratedInspector } from './inspector/GeneratedInspector';
import { InspectorStatePanel } from './inspector/InspectorStatePanel';
import { renderInspector } from './inspector/inspectorRegistry';

export function PropertyPanel({ showState = true }: { showState?: boolean } = {}) {
  const project = useProjectStore((state) => state.project);
  const pageId = useProjectStore((state) => state.currentPageId);
  const selectedNodeId = useProjectStore((state) => state.selectedNodeId);
  const updateSelectedProps = useProjectStore((state) => state.updateSelectedProps);
  const updateSelectedContent = useProjectStore((state) => state.updateSelectedContent);
  const updateSelectedData = useProjectStore((state) => state.updateSelectedData);
  const updateSelectedEvents = useProjectStore((state) => state.updateSelectedEvents);
  const page = project.pages.find((item) => item.id === pageId);
  const node = selectedNodeId && !selectedNodeId.includes(':') ? page?.nodes[selectedNodeId] : undefined;
  const definition = node ? getComponentDefinition(node.type) : undefined;
  const descriptor = node ? getDescriptor(node.type) : undefined;

  if (!page || !node || (!descriptor && !definition)) return <Typography.Text type="secondary">请选择组件。</Typography.Text>;

  return (
    <div className="inspector-stack">
      <Typography.Text strong className="inspector-title">
        {node.name} / {componentLabel(node.type)}
      </Typography.Text>
      {showState ? <InspectorStatePanel pageId={page.id} node={node} /> : null}
      {definition ? (
        <GeneratedInspector
          node={node}
          definition={definition}
          updateProps={updateSelectedProps}
          updateContent={updateSelectedContent}
          updateData={updateSelectedData}
          updateEvents={updateSelectedEvents}
          hideTopBarProps={!showState}
        />
      ) : (
        renderInspector(node.type, { node, descriptor: descriptor!, updateProps: updateSelectedProps, hideTopBarProps: !showState })
      )}
    </div>
  );
}
