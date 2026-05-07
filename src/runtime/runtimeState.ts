import type { DataSource, JsonRecord, JsonValue, Project } from '../domain/types';

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
};

export function createRuntimeState(project: Project, pageId: string): RuntimeState {
  return {
    currentPageId: pageId,
    variables: Object.fromEntries(project.variables.map((variable) => [variable.id, variable.value])),
    data: Object.fromEntries(project.dataSources.map((source) => [source.id, source.records])),
    forms: {},
    openNodes: [],
    messages: [],
    refreshCount: Object.fromEntries(project.dataSources.map((source) => [source.id, 0])),
  };
}

export function getDataSource(project: Project, dataSourceId: string): DataSource | undefined {
  return project.dataSources.find((source) => source.id === dataSourceId);
}
