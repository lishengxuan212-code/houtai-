import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProjectFromTemplate, deleteProject, listProjects, openProject, renameProject, saveProjectRecord } from '../project/ProjectManager';
import { initialProject } from '../store/initialProject';
import { createTemplateFromSelectedNodes, saveUserTemplate } from '../templates/templateOperations';

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

  it('creates built-in-template projects from saved user templates', () => {
    const source = structuredClone(initialProject);
    const page = source.pages[0]!;
    const node = page.nodes.button_add_order!;
    const frameId = page.frames?.[0]?.id;
    node.canvas = { x: 80, y: 96, width: 120, height: 32, zIndex: 7, ...(frameId ? { parentFrameId: frameId } : {}) };
    const template = createTemplateFromSelectedNodes(source, page.id, ['button_add_order'], {
      name: 'Saved Button Template',
      type: 'component',
      category: 'Common',
      includeProps: true,
      includeContent: true,
      includeData: false,
      includeInternalInteractions: false,
    });
    saveUserTemplate(template);

    const project = createProjectFromTemplate({
      name: 'Created From Saved Template',
      businessType: 'blank',
      template: 'builtin',
      templateSourceId: template.id,
      canvasWidth: 1440,
      canvasHeight: 900,
    });

    expect(project.businessType).toBe('blank');
    expect(project.pages[0]?.frames?.[0]).toMatchObject({ width: 1440, height: 900 });
    expect(Object.values(project.pages[0]!.nodes).some((item) => item.type === 'Button' && item.props.text === node.props.text && item.canvas?.x === 80)).toBe(true);
  });
});
