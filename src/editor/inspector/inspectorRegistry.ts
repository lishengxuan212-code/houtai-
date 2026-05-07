import type { ComponentType } from 'react';
import { createElement, type ReactNode } from 'react';
import { FormInspector } from './FormInspector';
import { GenericInspector } from './GenericInspector';
import { SearchBarInspector } from './SearchBarInspector';
import { ButtonInspector, DrawerInspector, ModalInspector, SectionInspector } from './SimpleInspectors';
import { TableInspector } from './TableInspector';
import type { InspectorProps } from './types';

const customInspectors = new Map<string, ComponentType<InspectorProps>>([
  ['Button', ButtonInspector],
  ['Table', TableInspector],
  ['Form', FormInspector],
  ['SearchBar', SearchBarInspector],
  ['Modal', ModalInspector],
  ['Drawer', DrawerInspector],
  ['Section', SectionInspector],
]);

export function hasCustomInspector(type: string): boolean {
  return customInspectors.has(type);
}

export function getInspector(type: string): ComponentType<InspectorProps> {
  return customInspectors.get(type) ?? GenericInspector;
}

export function renderInspector(type: string, props: InspectorProps): ReactNode {
  return createElement(getInspector(type), props);
}
