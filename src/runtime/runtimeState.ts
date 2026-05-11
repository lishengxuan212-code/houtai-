import type { ComponentNode, DataSource, JsonRecord, JsonValue, Project } from '../domain/types';

export type RuntimeMessage = {
  id: string;
  level: 'success' | 'info' | 'warning' | 'error';
  message: string;
};

export type RuntimeState = {
  currentPageId: string;
  variables: Record<string, JsonValue>;
  data: Record<string, JsonRecord[]>;
  forms: Record<string, JsonRecord>;
  openNodes: string[];
  messages: RuntimeMessage[];
  currentRow?: JsonRecord;
  refreshCount: Record<string, number>;
  nodeVisibility: Record<string, boolean>;
  nodeDisabled: Record<string, boolean>;
  nodeProps: Record<string, JsonRecord>;
  activeTabs: Record<string, string>;
  scrollRequests: { id: string; targetNodeId: string }[];
};

function walkProjectNodes(project: Project): ComponentNode[] {
  return project.pages.flatMap((page) => Object.values(page.nodes));
}

function createInitialNodeVisibility(project: Project): Record<string, boolean> {
  return Object.fromEntries(walkProjectNodes(project).map((node) => [node.id, node.runtime?.initialVisible ?? true]));
}

function createInitialNodeDisabled(project: Project): Record<string, boolean> {
  return Object.fromEntries(walkProjectNodes(project).map((node) => [node.id, node.runtime?.initialDisabled ?? false]));
}

export function createRuntimeState(project: Project, pageId: string): RuntimeState {
  return {
    currentPageId: pageId,
    variables: Object.fromEntries(project.variables.map((variable) => [variable.id, variable.value])),
    data: Object.fromEntries(project.dataSources.map((source) => [source.id, source.records])),
    forms: {},
    openNodes: [],
    messages: [],
    refreshCount: Object.fromEntries(project.dataSources.map((source) => [source.id, 0])),
    nodeVisibility: createInitialNodeVisibility(project),
    nodeDisabled: createInitialNodeDisabled(project),
    nodeProps: {},
    activeTabs: {},
    scrollRequests: [],
  };
}

export function resetRuntimeState(project: Project, state: RuntimeState): RuntimeState {
  return createRuntimeState(project, state.currentPageId);
}

export function isRuntimeNodeVisible(state: RuntimeState, nodeId: string): boolean {
  return state.nodeVisibility[nodeId] ?? true;
}

export function isRuntimeNodeDisabled(state: RuntimeState, nodeId: string): boolean {
  return state.nodeDisabled[nodeId] ?? false;
}

export function setRuntimeNodeVisible(state: RuntimeState, nodeId: string, visible: boolean): RuntimeState {
  return { ...state, nodeVisibility: { ...state.nodeVisibility, [nodeId]: visible } };
}

export function toggleRuntimeNodeVisible(state: RuntimeState, nodeId: string): RuntimeState {
  return setRuntimeNodeVisible(state, nodeId, !isRuntimeNodeVisible(state, nodeId));
}

export function setRuntimeNodeDisabled(state: RuntimeState, nodeId: string, disabled: boolean): RuntimeState {
  return { ...state, nodeDisabled: { ...state.nodeDisabled, [nodeId]: disabled } };
}

export function toggleRuntimeNodeDisabled(state: RuntimeState, nodeId: string): RuntimeState {
  return setRuntimeNodeDisabled(state, nodeId, !isRuntimeNodeDisabled(state, nodeId));
}

export function getDataSource(project: Project, dataSourceId: string): DataSource | undefined {
  return project.dataSources.find((source) => source.id === dataSourceId);
}
