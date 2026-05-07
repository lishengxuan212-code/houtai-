import { ProjectSchema } from '../domain/schemas';
import type { Project } from '../domain/types';
import { getCurrentProjectId, loadProjectRecord, saveProjectRecord } from '../project/projectStorage';
import { initialProject } from './initialProject';
import { incrementMetric, measureMetric } from '../editor/performance/performanceMetrics';

const STORAGE_KEY = 'admin-prototype-studio.project';
const SAVE_DEBOUNCE_MS = 250;
let pendingProject: Project | undefined;
let pendingTimer: number | undefined;

export function loadProject(): Project {
  const currentProject = getCurrentProjectId();
  if (currentProject) {
    const project = loadProjectRecord(currentProject);
    if (project) return project;
  }
  if (typeof localStorage === 'undefined') return initialProject;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return initialProject;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return ProjectSchema.parse(parsed) as Project;
  } catch {
    return initialProject;
  }
}

export function saveProject(project: Project): void {
  if (typeof localStorage === 'undefined') return;
  measureMetric('persistenceWrite', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    saveProjectRecord(project);
  });
  incrementMetric('persistenceWrite');
}

export function scheduleProjectSave(project: Project): void {
  pendingProject = project;
  if (typeof localStorage === 'undefined') return;
  if (pendingTimer) window.clearTimeout(pendingTimer);
  pendingTimer = window.setTimeout(() => {
    const next = pendingProject;
    pendingProject = undefined;
    pendingTimer = undefined;
    if (next) saveProject(next);
  }, SAVE_DEBOUNCE_MS);
}

export function flushScheduledProjectSave(): void {
  if (pendingTimer) {
    window.clearTimeout(pendingTimer);
    pendingTimer = undefined;
  }
  const next = pendingProject;
  pendingProject = undefined;
  if (next) saveProject(next);
}

export function clearProject(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
