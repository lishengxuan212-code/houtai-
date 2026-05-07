import type { BusinessType, Project } from '../domain/types';
import { initialProject } from '../store/initialProject';

export type ProjectTemplateKind = 'blank' | 'builtin' | 'saved';

export type CreateProjectInput = {
  name: string;
  businessType: BusinessType;
  template: ProjectTemplateKind;
  templateSourceId?: string;
};

function nowIso() {
  return new Date().toISOString();
}

function projectId() {
  return `project_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createBlankProject(input: CreateProjectInput): Project {
  const now = nowIso();
  const id = projectId();
  const rootNodeId = `node_${id}_root`;
  return {
    id,
    name: input.name,
    description: '',
    businessType: input.businessType,
    pages: [
      {
        id: `page_${Date.now().toString(36)}`,
        name: '首页',
        route: '/',
        purpose: '用于承载后台首页内容',
        rootNodeId,
        nodes: {
          [rootNodeId]: {
            id: rootNodeId,
            type: 'PageContainer',
            name: '首页容器',
            props: { title: '首页', description: '页面说明' },
            children: [],
          },
        },
      },
    ],
    dataSources: [],
    variables: [],
    interactions: [],
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

export function createBuiltinProject(input: CreateProjectInput): Project {
  const now = nowIso();
  return {
    ...structuredClone(initialProject),
    id: projectId(),
    name: input.name,
    businessType: input.businessType,
    createdAt: now,
    updatedAt: now,
  };
}
