import type { JsonValue } from '../../domain/types';
import type { PropEditorType } from './propSchema';

export type ComponentApiSchema = {
  source: 'official-docs' | 'typescript-types' | 'manual';
  sourceUrl?: string;
  docsVersion?: string;
  componentVersion?: string;
  sections: ComponentApiSection[];
};

export type ComponentApiSection = {
  key: string;
  title: string;
  componentVariant?: string;
  description?: string;
  props: ComponentApiProp[];
};

export type ComponentApiValueKind =
  | 'string'
  | 'number'
  | 'boolean'
  | 'enum'
  | 'reactNode'
  | 'object'
  | 'array'
  | 'function'
  | 'css'
  | 'semanticClass'
  | 'unknown';

export type ComponentApiPropGroup = '基础' | '内容' | '行为' | '样式' | '数据' | '事件' | '高级';

export type ComponentApiVisibleWhen = {
  path: string;
  operator: 'exists' | 'equals' | 'notEquals';
  value?: JsonValue;
};

export type ComponentApiProp = {
  name: string;
  labelZh: string;
  description: string;
  typeText: string;
  defaultValue?: string;
  version?: string;
  valueKind: ComponentApiValueKind;
  editor: PropEditorType;
  options?: Array<{
    label: string;
    value: string | number | boolean;
  }>;
  group: ComponentApiPropGroup;
  path: string;
  visibleWhen?: ComponentApiVisibleWhen;
  deprecated?: boolean;
  deprecatedReason?: string;
  editable: boolean;
  advanced?: boolean;
};

export type ApiCoverageStatus = {
  componentType: string;
  officialApiPropCount: number;
  implementedPropEditorCount: number;
  missingProps: string[];
  unsupportedProps: string[];
  coverage: 'full' | 'partial' | 'missing';
};
