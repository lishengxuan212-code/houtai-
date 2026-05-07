import type { Project } from '../domain/types';

export function resolvePageId(project: Project, pageId: string): string | undefined {
  return project.pages.some((page) => page.id === pageId) ? pageId : undefined;
}
