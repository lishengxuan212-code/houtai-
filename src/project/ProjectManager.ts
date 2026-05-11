import type { BusinessType, Project, ProjectSummary } from '../domain/types';
import { createBlankProject, createBuiltinProject, type ProjectTemplateKind } from './projectTemplates';
import {
  deleteProjectRecord,
  listProjectSummaries,
  loadProjectRecord,
  saveProjectRecord as saveRecord,
  setCurrentProjectId,
} from './projectStorage';

export type CreateProjectOptions = {
  name: string;
  businessType: BusinessType;
  template: ProjectTemplateKind;
  canvasWidth?: number;
  canvasHeight?: number;
  templateSourceId?: string;
};

export function createProjectFromTemplate(options: CreateProjectOptions): Project {
  if (options.template === 'builtin') return createBuiltinProject(options);
  return createBlankProject(options);
}

export function saveProjectRecord(project: Project, templateSourceId?: string): void {
  saveRecord(project, templateSourceId);
}

export function listProjects(): ProjectSummary[] {
  return listProjectSummaries();
}

export function openProject(id: string): Project | undefined {
  const project = loadProjectRecord(id);
  if (project) setCurrentProjectId(project.id);
  return project;
}

export function renameProject(id: string, name: string): Project | undefined {
  const project = loadProjectRecord(id);
  if (!project) return undefined;
  const next = { ...project, name, updatedAt: new Date().toISOString() };
  saveRecord(next);
  return next;
}

export function deleteProject(id: string): void {
  deleteProjectRecord(id);
}
