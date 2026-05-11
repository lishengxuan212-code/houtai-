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

export function getUserTemplate(templateId: string): UserTemplate | undefined {
  return listUserTemplates().find((item) => item.id === templateId);
}

export function deleteUserTemplate(templateId: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listUserTemplates().filter((item) => item.id !== templateId)));
}

export function renameUserTemplate(templateId: string, name: string): UserTemplate | undefined {
  const template = getUserTemplate(templateId);
  if (!template) return undefined;
  const next = { ...structuredClone(template), name, updatedAt: new Date().toISOString(), version: template.version + 1 };
  saveUserTemplate(next);
  return next;
}

export function duplicateUserTemplate(templateId: string): UserTemplate | undefined {
  const template = getUserTemplate(templateId);
  if (!template) return undefined;
  const now = new Date().toISOString();
  const next = {
    ...structuredClone(template),
    id: `template_${Date.now().toString(36)}`,
    name: `${template.name} Copy`,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  saveUserTemplate(next);
  return next;
}

export function updateUserTemplate(template: UserTemplate): UserTemplate {
  const next = { ...structuredClone(template), updatedAt: new Date().toISOString(), version: template.version + 1 };
  saveUserTemplate(next);
  return next;
}
