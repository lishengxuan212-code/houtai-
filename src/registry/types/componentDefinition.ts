import type { ComponentCategory, ComponentEvent, JsonRecord } from '../../domain/types';
import type { ComponentApiSchema } from './apiSchema';
import type { PropSchemaGroup } from './propSchema';

export type ComponentDefinitionSource = 'system' | 'antd' | 'ant-design-icons' | 'pro-components' | 'mui';
export type ComponentGenerationRole = 'foundation' | 'enhancement';
export type ComponentStyleCapability =
  | 'background'
  | 'border'
  | 'borderRadius'
  | 'shadow'
  | 'padding'
  | 'typography'
  | 'color'
  | 'size'
  | 'spacing';

export type ComponentDefinition = {
  type: string;
  nameEn: string;
  nameZh: string;
  source: ComponentDefinitionSource;
  category: ComponentCategory;
  defaultProps: JsonRecord;
  defaultContent?: JsonRecord;
  defaultData?: JsonRecord;
  defaultEvents?: Record<string, JsonRecord>;
  apiSchema?: ComponentApiSchema;
  propSchema: PropSchemaGroup[];
  contentSchema?: PropSchemaGroup[];
  dataSchema?: PropSchemaGroup[];
  interactionSchema?: PropSchemaGroup[];
  slotSchema?: PropSchemaGroup[];
  supportedEvents: ComponentEvent[];
  generationRole?: ComponentGenerationRole;
  styleCapabilities?: ComponentStyleCapability[];
  allowedChildren?: string[];
  canHaveChildren?: boolean;
  enabled: boolean;
  draggable: boolean;
  renderKind?: string;
  description?: string;
};

export type ComponentDefaultOverrides = Record<string, JsonRecord>;

export type ComponentLibraryOverride = {
  componentType: string;
  defaultProps: JsonRecord;
  updatedAt: string;
};

export type ComponentDefaultOverrideOptions = {
  defaultProps?: JsonRecord;
};
