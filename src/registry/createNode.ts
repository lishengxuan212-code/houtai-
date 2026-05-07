import type { ComponentNode, JsonRecord } from '../domain/types';
import { createId } from '../domain/ids';
import { assertDescriptor } from './componentRegistry';
import { getComponentDefinition, getResolvedDefaultProps } from './componentDefinitionRegistry';
import { getComponentDefaultOverrides } from '../store/componentLibraryStore';

export function createNode(type: string, props: JsonRecord = {}): ComponentNode {
  const definition = getComponentDefinition(type);
  const descriptor = definition ? undefined : assertDescriptor(type);
  const defaultProps = definition ? getResolvedDefaultProps(type, getComponentDefaultOverrides()) : descriptor!.defaultProps;
  return {
    id: createId(type.toLowerCase()),
    type,
    name: definition?.nameZh ?? descriptor!.displayName,
    props: { ...defaultProps, ...props },
    ...(definition?.defaultContent ? { content: structuredClone(definition.defaultContent) } : {}),
    ...(definition?.defaultData ? { data: structuredClone(definition.defaultData) } : {}),
    ...(definition?.defaultEvents ? { events: structuredClone(definition.defaultEvents) } : {}),
    ...(definition?.canHaveChildren || descriptor?.canHaveChildren ? { children: [] } : {}),
  };
}
