import type { ApiCoverageStatus } from '../types/apiSchema';
import { getComponentDefinition, listComponentDefinitions } from '../componentDefinitionRegistry';

const partialCoverage: Record<string, { official: number; missing: string[]; unsupported?: string[] }> = {
  Dropdown: { official: 8, missing: [], unsupported: [] },
  Table: { official: 18, missing: ['rowSelection', 'expandable', 'scroll', 'summary'] },
  Form: { official: 12, missing: ['dependencies', 'validateMessages'] },
  'pro.ProTable': { official: 16, missing: ['request', 'options.fullScreen', 'options.reload'] },
  'pro.EditableProTable': { official: 12, missing: ['editable.form', 'recordCreatorProps.position'] },
};

function countImplemented(componentType: string): number {
  const definition = getComponentDefinition(componentType);
  if (!definition) return 0;
  return [
    ...definition.propSchema,
    ...(definition.contentSchema ?? []),
    ...(definition.dataSchema ?? []),
    ...(definition.slotSchema ?? []),
    ...(definition.interactionSchema ?? []),
  ].reduce((total, group) => total + group.fields.length, 0);
}

export function getApiCoverageReport(): ApiCoverageStatus[] {
  return listComponentDefinitions()
    .filter((definition) => definition.source === 'antd' || definition.source === 'pro-components')
    .map((definition) => {
      if (definition.apiSchema) {
        const props = definition.apiSchema.sections.find((section) => section.componentVariant === definition.type)?.props ?? [];
        const implemented = countImplemented(definition.type);
        return {
          componentType: definition.type,
          officialApiPropCount: props.length,
          implementedPropEditorCount: implemented,
          missingProps: [],
          unsupportedProps: props.filter((prop) => !prop.editable).map((prop) => prop.name),
          coverage: 'full',
        };
      }
      const partial = partialCoverage[definition.type];
      if (partial) {
        return {
          componentType: definition.type,
          officialApiPropCount: partial.official,
          implementedPropEditorCount: countImplemented(definition.type),
          missingProps: partial.missing,
          unsupportedProps: partial.unsupported ?? [],
          coverage: partial.missing.length ? 'partial' : 'full',
        };
      }
      return {
        componentType: definition.type,
        officialApiPropCount: 0,
        implementedPropEditorCount: countImplemented(definition.type),
        missingProps: ['apiSchema'],
        unsupportedProps: [],
        coverage: 'missing',
      };
    });
}
