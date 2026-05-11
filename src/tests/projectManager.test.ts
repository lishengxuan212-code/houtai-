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
    const project = createProjectFromTemplate({ name: 'CRM Admin', businessType: 'crm', template: 'blank' });
    expect(project.name).toBe('CRM Admin');
    expect(project.pages).toHaveLength(1);

    saveProjectRecord(project);
    expect(listProjects()).toMatchObject([{ id: project.id, name: 'CRM Admin', businessType: 'crm', pageCount: 1 }]);
    expect(openProject(project.id)?.id).toBe(project.id);

    renameProject(project.id, 'Sales CRM');
    expect(listProjects()[0]?.name).toBe('Sales CRM');

    deleteProject(project.id);
    expect(listProjects()).toEqual([]);
  });

  it('can create from built-in project templates without mutating the source project', () => {
    const project = createProjectFromTemplate({ name: 'Order Admin Copy', businessType: 'ecommerce', template: 'builtin' });
    expect(project.name).toBe('Order Admin Copy');
    expect(project.pages.length).toBeGreaterThan(1);
    expect(project.id).not.toBe(initialProject.id);
    expect(initialProject.name).not.toBe('Order Admin Copy');
  });

  it('creates the first page frame with the requested canvas size', () => {
    const project = createProjectFromTemplate({
      name: 'Visual restore project',
      businessType: 'blank',
      template: 'blank',
      canvasWidth: 1440,
      canvasHeight: 900,
    });

    expect(project.pages[0]?.frames?.[0]).toMatchObject({
      width: 1440,
      height: 900,
    });

    saveProjectRecord(project);
    expect(listProjects()[0]?.canvasSize).toEqual({ width: 1440, height: 900 });
  });
});
