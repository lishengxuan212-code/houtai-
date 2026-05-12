import type { ComponentNode, JsonRecord } from '../domain/types';
import { createId } from '../domain/ids';
import { getComponentDefinition, resolveDefaultProps } from './componentDefinitionRegistry';
import { normalizeNodeProps } from './normalizers/normalizeNodeProps';
import type { ComponentDefaultOverrideOptions } from './types/componentDefinition';
import type { ComponentPreset, CreateComponentPresetInput } from './types/componentPreset';

export function createComponentPreset(input: CreateComponentPresetInput): ComponentPreset {
  const now = input.now ?? new Date().toISOString();
  const componentType = input.componentType ?? input.baseComponentType;
  if (!componentType) throw new Error('Component preset requires a component type');
  return {
    id: input.id ?? createId('preset'),
    name: input.name,
    componentType,
    baseComponentType: componentType,
    ...(input.description ? { description: input.description } : {}),
    ...(input.category ? { category: input.category } : {}),
    props: structuredClone(input.props ?? {}),
    ...(input.canvas ? { canvas: structuredClone(input.canvas) } : {}),
    ...(input.interactions ? { interactions: structuredClone(input.interactions) } : {}),
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}

export function saveComponentPreset(presets: ComponentPreset[], preset: ComponentPreset): ComponentPreset[] {
  const nextPreset = structuredClone(preset);
  const existingIndex = presets.findIndex((item) => item.id === preset.id);
  if (existingIndex < 0) return [...presets.map((item) => structuredClone(item)), nextPreset];
  return presets.map((item, index) => (index === existingIndex ? nextPreset : structuredClone(item)));
}

export function createNodePropsFromPreset(
  preset: ComponentPreset,
  options: ComponentDefaultOverrideOptions = {},
  instanceProps: JsonRecord = {},
): JsonRecord {
  const defaultProps = resolveDefaultProps(preset.componentType ?? preset.baseComponentType, options);
  return normalizeNodeProps(normalizeNodeProps(defaultProps, preset.props), instanceProps);
}

export function createNodeFromComponentPreset(preset: ComponentPreset, instanceProps: JsonRecord = {}): ComponentNode {
  const componentType = preset.componentType ?? preset.baseComponentType;
  const definition = getComponentDefinition(componentType);
  return {
    id: createId(componentType.toLowerCase().replace(/[^a-z0-9]+/g, '_')),
    type: componentType,
    name: preset.name,
    props: createNodePropsFromPreset(preset, {}, instanceProps),
    ...(preset.canvas ? { canvas: structuredClone(preset.canvas) } : {}),
    ...(definition?.canHaveChildren ? { children: [] } : {}),
  };
}
