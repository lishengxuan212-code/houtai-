import type { ComponentDescriptor, EditableProp, JsonRecord } from '../../domain/types';
import type { LibraryComponentDescriptor } from '../antdManifest';
import type { ComponentDefinition } from '../types/componentDefinition';
import type { PropSchemaField } from '../types/propSchema';
import { cloneJson } from './normalizeNodeProps';

const editorByControl: Record<EditableProp['control'], PropSchemaField['editor']> = {
  text: 'text',
  textarea: 'textarea',
  number: 'number',
  boolean: 'switch',
  select: 'select',
  json: 'json',
};

function fieldFromEditableProp(prop: EditableProp, defaultProps: JsonRecord): PropSchemaField {
  const base = {
    path: `props.${prop.key}`,
    label: prop.label,
    editor: editorByControl[prop.control],
    control: prop.control,
    defaultValue: cloneJson(defaultProps[prop.key] ?? null),
  };
  if (prop.control === 'select') return { ...base, options: prop.options };
  if ((prop.control === 'text' || prop.control === 'textarea') && prop.placeholder) return { ...base, placeholder: prop.placeholder };
  if (prop.control === 'json' && prop.hint) return { ...base, hint: prop.hint };
  if (prop.control === 'number') return { ...base, ...(prop.min !== undefined ? { min: prop.min } : {}), ...(prop.max !== undefined ? { max: prop.max } : {}) };
  return base;
}

function registryType(component: LibraryComponentDescriptor): string {
  return component.source === 'pro-components' ? `pro.${component.key}` : component.key;
}

export function normalizeComponentDefinition(descriptor: ComponentDescriptor, manifestItem?: LibraryComponentDescriptor): ComponentDefinition {
  const editableProps = manifestItem?.editableProps ?? descriptor.editableProps;
  const defaultProps = cloneJson(manifestItem?.defaultProps ?? descriptor.defaultProps);
  return {
    type: manifestItem ? registryType(manifestItem) : descriptor.type,
    nameEn: manifestItem?.nameEn ?? descriptor.type,
    nameZh: manifestItem?.nameZh ?? descriptor.displayName,
    source: manifestItem?.source ?? 'system',
    category: descriptor.category,
    defaultProps,
    propSchema: [
      {
        key: 'props',
        id: 'props',
        title: '属性',
        fields: editableProps.map((prop) => fieldFromEditableProp(prop, defaultProps)),
      },
    ],
    supportedEvents: [...(manifestItem?.supportedEvents ?? descriptor.supportedEvents)],
    ...(descriptor.allowedChildren ? { allowedChildren: [...descriptor.allowedChildren] } : {}),
    ...(descriptor.canHaveChildren ? { canHaveChildren: true } : {}),
    enabled: manifestItem?.source === 'pro-components' ? true : (manifestItem?.enabled ?? true),
    draggable: manifestItem?.source === 'pro-components' ? true : (manifestItem?.draggable ?? true),
    ...(manifestItem?.renderKind ? { renderKind: manifestItem.renderKind } : {}),
    ...(manifestItem?.description ? { description: manifestItem.description } : {}),
  };
}
