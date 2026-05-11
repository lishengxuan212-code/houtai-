import type { ComponentNode, DataSource, Interaction, PageFrame } from '../domain/types';

export type UserTemplateType = 'page' | 'pageFrame' | 'canvasBoard' | 'block' | 'group' | 'component' | 'componentPreset';

export type UserTemplateSaveOptions = {
  includeProps: boolean;
  includeContent: boolean;
  includeData: boolean;
  includeInternalInteractions: boolean;
  includeExternalReferences: boolean;
};

export type UserTemplate = {
  id: string;
  name: string;
  description?: string;
  type: UserTemplateType;
  category: string;
  thumbnail?: string;
  content: {
    nodes: Record<string, ComponentNode>;
    rootNodeId: string;
    frames?: PageFrame[];
    interactions: Interaction[];
    dataSources?: DataSource[];
  };
  saveOptions?: UserTemplateSaveOptions;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type SaveTemplateOptions = {
  name: string;
  description?: string;
  type: UserTemplateType;
  category: string;
  frameId?: string;
  includeProps?: boolean;
  includeContent?: boolean;
  includeData?: boolean;
  includeInternalInteractions?: boolean;
  includeExternalReferences?: boolean;
  includeInteractions?: boolean;
  includeDataSources?: boolean;
};
