import { ProjectSchema } from '../domain/schemas';
import type { Project, ProjectSummary } from '../domain/types';

const INDEX_KEY = 'admin-prototype-studio.projects.index';
const CURRENT_KEY = 'admin-prototype-studio.projects.current';
const recordKey = (id: string) => `admin-prototype-studio.projects.${id}`;

function parseSummaries(raw: string | null): ProjectSummary[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is ProjectSummary => Boolean(item && typeof item === 'object' && 'id' in item && 'name' in item));
  } catch {
    return [];
  }
}

function writeIndex(summaries: ProjectSummary[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(INDEX_KEY, JSON.stringify(summaries));
}

export function projectSummary(project: Project, templateSourceId?: string): ProjectSummary {
  const firstFrame = project.pages[0]?.frames?.[0];
  return {
    id: project.id,
    name: project.name,
    businessType: project.businessType ?? 'custom',
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    pageCount: project.pages.length,
    ...(firstFrame ? { canvasSize: { width: firstFrame.width, height: firstFrame.height } } : {}),
    ...(project.description ? { description: project.description } : {}),
    ...(templateSourceId ? { templateSourceId } : {}),
  };
}

export function listProjectSummaries(): ProjectSummary[] {
  if (typeof localStorage === 'undefined') return [];
  return parseSummaries(localStorage.getItem(INDEX_KEY)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function saveProjectRecord(project: Project, templateSourceId?: string): void {
  if (typeof localStorage === 'undefined') return;
  const summaries = listProjectSummaries().filter((item) => item.id !== project.id);
  writeIndex([projectSummary(project, templateSourceId), ...summaries]);
  localStorage.setItem(recordKey(project.id), JSON.stringify(project));
  localStorage.setItem(CURRENT_KEY, project.id);
}

export function loadProjectRecord(id: string): Project | undefined {
  if (typeof localStorage === 'undefined') return undefined;
  const raw = localStorage.getItem(recordKey(id));
  if (!raw) return undefined;
  try {
    return ProjectSchema.parse(JSON.parse(raw)) as Project;
  } catch {
    return undefined;
  }
}

export function deleteProjectRecord(id: string): void {
  if (typeof localStorage === 'undefined') return;
  writeIndex(listProjectSummaries().filter((item) => item.id !== id));
  localStorage.removeItem(recordKey(id));
  if (localStorage.getItem(CURRENT_KEY) === id) localStorage.removeItem(CURRENT_KEY);
}

export function getCurrentProjectId(): string | undefined {
  if (typeof localStorage === 'undefined') return undefined;
  return localStorage.getItem(CURRENT_KEY) ?? undefined;
}

export function setCurrentProjectId(id: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(CURRENT_KEY, id);
}
