import type { JsonValue } from '../../domain/types';

export type PropEditorType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'switch'
  | 'select'
  | 'multiSelect'
  | 'radio'
  | 'color'
  | 'icon'
  | 'reactNode'
  | 'objectEditor'
  | 'arrayEditor'
  | 'styleEditor'
  | 'classNameEditor'
  | 'interactionEvent'
  | 'badge'
  | 'advancedJson'
  | 'json'
  | 'tableColumns'
  | 'tableRows'
  | 'formFields'
  | 'menuItems'
  | 'options'
  | 'tabsItems'
  | 'stepsItems'
  | 'treeData'
  | 'dataSource'
  | 'actions'
  | 'layout'
  | 'codePreview';

export type PropControlType = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'json';

export type PropSchemaOption = {
  label: string;
  value: string | number | boolean;
};

export type PropSchemaField = {
  path: string;
  label: string;
  editor: PropEditorType;
  control?: PropControlType;
  options?: PropSchemaOption[];
  defaultValue?: JsonValue;
  placeholder?: string;
  description?: string;
  hint?: string;
  min?: number;
  max?: number;
  required?: boolean;
  visibleWhen?: {
    path: string;
    operator?: 'exists' | 'equals' | 'notEquals';
    equals?: JsonValue;
    value?: JsonValue;
  };
};

export type PropSchemaGroup = {
  key: string;
  id: string;
  title: string;
  fields: PropSchemaField[];
};
