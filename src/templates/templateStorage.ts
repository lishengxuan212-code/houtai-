import type { UserTemplate } from './userTemplateTypes';
import { UserTemplateListSchema, UserTemplateSchema } from './userTemplateSchema';

const STORAGE_KEY = 'admin-prototype-studio.user-templates';

function parseTemplates(raw: string | null): UserTemplate[] {
  if (!raw) return [];
  try {
    return UserTemplateListSchema.parse(JSON.parse(raw)) as UserTemplate[];
  } catch {
    return [];
  }
}

export function listUserTemplates(): UserTemplate[] {
  if (typeof localStorage === 'undefined') return [];
  return parseTemplates(localStorage.getItem(STORAGE_KEY)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function saveUserTemplate(template: UserTemplate): void {
  if (typeof localStorage === 'undefined') return;
  const parsed = UserTemplateSchema.parse(template) as UserTemplate;
  const templates = listUserTemplates().filter((item) => item.id !== parsed.id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([parsed, ...templates]));
}

export function deleteUserTemplate(templateId: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listUserTemplates().filter((item) => item.id !== templateId)));
}
