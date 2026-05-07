import type { ComponentDescriptor, ComponentNode, JsonRecord } from '../../domain/types';

export type InspectorProps = {
  node: ComponentNode;
  descriptor: ComponentDescriptor;
  updateProps: (props: JsonRecord) => void;
};
