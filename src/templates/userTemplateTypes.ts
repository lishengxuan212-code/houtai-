import type { ComponentNode, DataSource, Interaction } from '../domain/types';

export type UserTemplateType = 'page' | 'block' | 'component';

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
    interactions: Interaction[];
    dataSources?: DataSource[];
  };
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type SaveTemplateOptions = {
  name: string;
  description?: string;
  type: UserTemplateType;
  category: string;
  includeInteractions: boolean;
  includeDataSources: boolean;
};
