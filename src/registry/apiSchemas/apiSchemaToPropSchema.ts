import type { ComponentApiProp, ComponentApiPropGroup, ComponentApiSchema, ComponentApiValueKind } from '../types/apiSchema';
import type { PropEditorType, PropSchemaField, PropSchemaGroup } from '../types/propSchema';

export const apiTypeEditorMapping: Record<ComponentApiValueKind, PropEditorType> = {
  string: 'text',
  number: 'number',
  boolean: 'switch',
  enum: 'select',
  reactNode: 'reactNode',
  object: 'objectEditor',
  array: 'arrayEditor',
  function: 'interactionEvent',
  css: 'styleEditor',
  semanticClass: 'classNameEditor',
  unknown: 'advancedJson',
};

const propGroups: ComponentApiPropGroup[] = ['基础', '内容', '行为', '数据', '样式', '高级'];

function fieldFromApiProp(prop: ComponentApiProp): PropSchemaField {
  const field: PropSchemaField = {
    path: prop.path,
    label: prop.labelZh,
    editor: prop.name === 'badge' ? 'badge' : prop.editor,
    description: prop.description,
    defaultValue: prop.defaultValue ?? null,
  };
  if (prop.options) field.options = prop.options;
  if (prop.visibleWhen) field.visibleWhen = prop.visibleWhen;
  return field;
}

function groupsFromProps(props: ComponentApiProp[], groups: ComponentApiPropGroup[]): PropSchemaGroup[] {
  return groups
    .map((group) => ({
      key: group,
      id: group,
      title: group,
      fields: props.filter((prop) => prop.editable && prop.group === group && !prop.deprecated).map(fieldFromApiProp),
    }))
    .filter((group) => group.fields.length > 0);
}

export function apiSchemaToPropSchema(apiSchema: ComponentApiSchema, componentVariant: string) {
  const props = apiSchema.sections.find((section) => section.componentVariant === componentVariant)?.props ?? [];
  return {
    propSchema: groupsFromProps(props, propGroups),
    interactionSchema: groupsFromProps(props, ['事件']),
  };
}
