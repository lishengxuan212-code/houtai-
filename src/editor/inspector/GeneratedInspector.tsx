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
  hideTopBarProps?: boolean;
};

const topBarGroupKeys = new Set(['typography', 'color', 'fill', 'background', 'border', 'shadow', 'corner', 'padding', 'size']);
const topBarPropPaths = new Set([
  'props.text',
  'props.title',
  'props.label',
  'props.placeholder',
  'props.fontFamily',
  'props.fontWeight',
  'props.fontSize',
  'props.color',
  'props.lineHeight',
  'props.letterSpacing',
  'props.textAlign',
  'props.textDecoration',
  'props.fontStyle',
  'props.fill',
  'props.background',
  'props.backgroundImage',
  'props.border',
  'props.borderColor',
  'props.borderWidth',
  'props.borderStyle',
  'props.shadow',
  'props.innerShadow',
  'props.radius',
  'props.borderRadius',
  'props.padding',
  'props.paddingLeft',
  'props.paddingTop',
  'props.paddingRight',
  'props.paddingBottom',
  'props.width',
  'props.height',
]);

function removeTopBarProps(groups: ComponentDefinition['propSchema']) {
  return groups
    .filter((group) => !topBarGroupKeys.has(group.key) && !topBarGroupKeys.has(group.id))
    .map((group) => ({
      ...group,
      fields: group.fields.filter((field) => !topBarPropPaths.has(field.path)),
    }))
    .filter((group) => group.fields.length > 0);
}

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

export function GeneratedInspector({ node, nodeName, definition, updateProps, updateContent = () => undefined, updateData = () => undefined, updateEvents = () => undefined, showTitle = false, hideTopBarProps = false }: Props) {
  const contentValue = scopedValue(node.content, node.props, definition.contentSchema);
  const dataValue = scopedValue(node.data, node.props, definition.dataSchema);
  const propSchema = hideTopBarProps ? removeTopBarProps(definition.propSchema) : definition.propSchema;
  return (
    <div className="inspector-stack">
      {showTitle ? (
        <Typography.Text strong>
          {nodeName ?? definition.nameZh} / {definition.nameZh}
        </Typography.Text>
      ) : null}
      {propSchema.map((group) => (
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
