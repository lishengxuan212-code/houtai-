import type { PropSchemaGroup } from './types/propSchema';
import { getComponentDefinition } from './componentDefinitionRegistry';

export function getPropSchema(type: string): PropSchemaGroup[] {
  return getComponentDefinition(type)?.propSchema ?? [];
}
