import { Collapse, Typography } from 'antd';
import type { JsonRecord } from '../../domain/types';
import { getValueAtPropPath, setValueAtPropPath } from '../../domain/operations/componentPropertyOperations';
import type { ComponentDefinition } from '../../registry/types/componentDefinition';
import { AdvancedJsonEditor } from './AdvancedJsonEditor';
import { PropGroup } from './PropGroup';

type Props = {
  nodeName?: string;
  node: { props: JsonRecord; content?: JsonRecord; data?: JsonRecord; events?: Record<string, JsonRecord> };
  definition: ComponentDefinition;
  updateProps: (props: JsonRecord) => void;
  updateContent?: (content: JsonRecord) => void;
  updateData?: (data: JsonRecord) => void;
  updateEvents?: (events: Record<string, JsonRecord>) => void;
  showTitle?: boolean;
};

function scopedValue(scopeValue: JsonRecord | undefined, propsFallback: JsonRecord, groups = [] as ComponentDefinition['propSchema']): JsonRecord {
  let next = structuredClone(scopeValue ?? {});
  for (const group of groups) {
    for (const field of group.fields) {
      if (getValueAtPropPath(next, field.path) !== undefined) continue;
      const fallback = field.path === 'rows' ? (propsFallback.rows ?? propsFallback.data) : getValueAtPropPath(propsFallback, field.path);
      if (fallback !== undefined) next = setValueAtPropPath(next, field.path, fallback);
    }
  }
  return next;
}

export function GeneratedInspector({ node, nodeName, definition, updateProps, updateContent = () => undefined, updateData = () => undefined, updateEvents = () => undefined, showTitle = false }: Props) {
  const contentValue = scopedValue(node.content, node.props, definition.contentSchema);
  const dataValue = scopedValue(node.data, node.props, definition.dataSchema);
  return (
    <div className="inspector-stack">
      {showTitle ? (
        <Typography.Text strong>
          {nodeName ?? definition.nameZh} / {definition.nameZh}
        </Typography.Text>
      ) : null}
      {definition.propSchema.map((group) => (
        <PropGroup key={group.key} group={group} propsValue={node.props} onChange={updateProps} />
      ))}
      {definition.contentSchema?.map((group) => (
        <PropGroup key={`content-${group.key}`} group={group} propsValue={contentValue} nodePropsValue={node.props} onChange={updateContent} />
      ))}
      {definition.dataSchema?.map((group) => (
        <PropGroup key={`data-${group.key}`} group={group} propsValue={dataValue} nodePropsValue={node.props} onChange={updateData} />
      ))}
      {definition.interactionSchema?.map((group) => (
        <PropGroup key={`interaction-${group.key}`} group={group} propsValue={node.events ?? {}} onChange={(events) => updateEvents(events as Record<string, JsonRecord>)} />
      ))}
      {definition.slotSchema?.map((group) => (
        <PropGroup key={`slot-${group.key}`} group={group} propsValue={node.props} onChange={updateProps} />
      ))}
      <Collapse
        key="advanced-debug"
        size="small"
        items={[
          {
            key: 'debug',
            label: '高级 / 调试',
            children: <AdvancedJsonEditor key={JSON.stringify(node.props)} value={node.props} onApply={updateProps} />,
          },
        ]}
      />
    </div>
  );
}
