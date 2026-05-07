import type { ComponentDescriptor } from '../domain/types';
import { allDescriptors } from './descriptors';

const registry = new Map(allDescriptors.map((descriptor) => [descriptor.type, descriptor]));

export function getDescriptor(type: string): ComponentDescriptor | undefined {
  return registry.get(type);
}

export function getAllDescriptors(): ComponentDescriptor[] {
  return [...registry.values()];
}

export function assertDescriptor(type: string): ComponentDescriptor {
  const descriptor = getDescriptor(type);
  if (!descriptor) throw new Error(`Unknown component type: ${type}`);
  return descriptor;
}
