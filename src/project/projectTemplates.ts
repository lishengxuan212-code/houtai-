import type { BusinessType, Project } from '../domain/types';
import { initialProject } from '../store/initialProject';

export type ProjectTemplateKind = 'blank' | 'builtin' | 'saved';

export type CreateProjectInput = {
  name: string;
  businessType: BusinessType;
  template: ProjectTemplateKind;
  canvasWidth?: number;
  canvasHeight?: number;
  templateSourceId?: string;
};

const DEFAULT_CANVAS_WIDTH = 1200;
const DEFAULT_CANVAS_HEIGHT = 760;

function nowIso() {
  return new Date().toISOString();
}

function projectId() {
  return `project_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function canvasSize(input: CreateProjectInput) {
  return {
    width: input.canvasWidth ?? DEFAULT_CANVAS_WIDTH,
    height: input.canvasHeight ?? DEFAULT_CANVAS_HEIGHT,
  };
}

export function createBlankProject(input: CreateProjectInput): Project {
  const now = nowIso();
  const id = projectId();
  const pageId = `page_${Date.now().toString(36)}`;
  const rootNodeId = `node_${id}_root`;
  const size = canvasSize(input);
  return {
    id,
    name: input.name,
    description: '',
    businessType: input.businessType,
    pages: [
      {
        id: pageId,
        name: '首页',
        route: '/',
        purpose: '用于承载后台首页内容',
        frames: [
          {
            id: `frame_${pageId}_default`,
            name: '主画布',
            x: 0,
            y: 0,
            width: size.width,
            height: size.height,
            zIndex: 0,
            background: { color: '#ffffff' },
          },
        ],
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
  const project: Project = {
    ...structuredClone(initialProject),
    id: projectId(),
    name: input.name,
    businessType: input.businessType,
    createdAt: now,
    updatedAt: now,
  };
  if (input.canvasWidth || input.canvasHeight) {
    const firstFrame = project.pages[0]?.frames?.[0];
    if (firstFrame) {
      firstFrame.width = input.canvasWidth ?? firstFrame.width;
      firstFrame.height = input.canvasHeight ?? firstFrame.height;
    }
  }
  return project;
}
