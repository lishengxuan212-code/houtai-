import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProjectFromTemplate, deleteProject, listProjects, openProject, renameProject, saveProjectRecord } from '../project/ProjectManager';
import { initialProject } from '../store/initialProject';

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
});

describe('ProjectManager', () => {
  it('creates, lists, opens, renames, and deletes local projects', () => {
    const project = createProjectFromTemplate({ name: 'CRM 后台', businessType: 'crm', template: 'blank' });
    expect(project.name).toBe('CRM 后台');
    expect(project.pages).toHaveLength(1);

    saveProjectRecord(project);
    expect(listProjects()).toMatchObject([{ id: project.id, name: 'CRM 后台', businessType: 'crm', pageCount: 1 }]);
    expect(openProject(project.id)?.id).toBe(project.id);

    renameProject(project.id, '销售 CRM');
    expect(listProjects()[0]?.name).toBe('销售 CRM');

    deleteProject(project.id);
    expect(listProjects()).toEqual([]);
  });

  it('can create from built-in project templates without mutating the source project', () => {
    const project = createProjectFromTemplate({ name: '订单后台副本', businessType: 'ecommerce', template: 'builtin' });
    expect(project.name).toBe('订单后台副本');
    expect(project.pages.length).toBeGreaterThan(1);
    expect(project.id).not.toBe(initialProject.id);
    expect(initialProject.name).not.toBe('订单后台副本');
  });
});
