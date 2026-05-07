import type { ComponentCategory, ComponentDescriptor } from '../domain/types';
import { antdLibraryManifest } from './antdManifest';

const children = [
  'Section',
  'Card',
  'Button',
  'Input',
  'Select',
  'SearchBar',
  'Table',
  'Form',
  'Modal',
  'Drawer',
  'Tabs',
  ...antdLibraryManifest.filter((item) => item.draggable && item.enabled).map((item) => item.key),
];

function toDescriptorCategory(category: string): ComponentCategory {
  if (category === '布局') return 'layout';
  if (category === '数据展示') return 'data';
  if (category === '数据录入') return 'form';
  if (category === '反馈') return 'feedback';
  if (category === '导航') return 'navigation';
  return 'business';
}

export const antdDescriptors: ComponentDescriptor[] = antdLibraryManifest
  .filter((component) => component.draggable && component.enabled)
  .map((component) => ({
    type: component.key,
    displayName: component.nameZh,
    category: toDescriptorCategory(component.category),
    defaultProps: component.defaultProps,
    editableProps: component.editableProps,
    supportedEvents: component.supportedEvents,
    ...(component.renderKind === 'layout' ? { allowedChildren: children, canHaveChildren: true } : {}),
  }));
