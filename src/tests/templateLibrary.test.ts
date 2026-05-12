import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createPageFromTemplate,
  createTemplateFromSelection,
  createTemplateFromSelectedNodes,
  deleteUserTemplate,
  duplicateUserTemplate,
  insertTemplateIntoPage,
  listUserTemplates,
  renameUserTemplate,
  saveUserTemplate,
  updateUserTemplate,
} from '../templates/templateOperations';
import { initialProject } from '../store/initialProject';
import { useProjectStore } from '../store/projectStore';
import type { Project } from '../domain/types';

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
});

describe('template library operations', () => {
  it('saves page, block, and component templates to local storage', () => {
    const page = initialProject.pages[0]!;
    const pageTemplate = createTemplateFromSelection(initialProject, page.id, page.rootNodeId, {
      name: '订单页模板',
      type: 'page',
      category: '订单',
      includeInteractions: true,
      includeDataSources: true,
    });
    const blockTemplate = createTemplateFromSelection(initialProject, page.id, 'node_orders_search', {
      name: '搜索区模板',
      type: 'block',
      category: '表单',
      includeInteractions: true,
      includeDataSources: false,
      includeExternalReferences: true,
    });
    const componentTemplate = createTemplateFromSelection(initialProject, page.id, 'button_add_order', {
      name: '新增按钮模板',
      type: 'component',
      category: '常用',
      includeInteractions: false,
      includeDataSources: false,
    });

    saveUserTemplate(pageTemplate);
    saveUserTemplate(blockTemplate);
    saveUserTemplate(componentTemplate);

    expect(listUserTemplates().map((item) => item.type).sort()).toEqual(['block', 'component', 'page']);
    expect(pageTemplate.content.interactions.length).toBeGreaterThan(0);
    expect(componentTemplate.content.interactions).toEqual([]);
  });

  it('inserts a component template without mutating the original project', () => {
    const page = initialProject.pages[0]!;
    const template = createTemplateFromSelection(initialProject, page.id, 'button_add_order', {
      name: '新增按钮模板',
      type: 'component',
      category: '常用',
      includeInteractions: false,
      includeDataSources: false,
    });
    const next = insertTemplateIntoPage(initialProject, page.id, page.rootNodeId, template);
    expect(Object.keys(next.pages[0]!.nodes).length).toBeGreaterThan(Object.keys(page.nodes).length);
    expect(Object.keys(initialProject.pages[0]!.nodes)).toHaveLength(Object.keys(page.nodes).length);
  });

  it('saves only the selected nodes when creating a component template from canvas selection', () => {
    const project = withTemplateFixture();
    const page = project.pages[0]!;
    const template = createTemplateFromSelectedNodes(project, page.id, ['existing_top', 'table_internal'], {
      name: 'Selected Components',
      type: 'component',
      category: '日常',
      includeProps: true,
      includeContent: true,
      includeData: false,
      includeInternalInteractions: false,
    });

    expect(template.type).toBe('component');
    expect(Object.keys(template.content.nodes).sort()).toEqual(['existing_top', 'table_internal', template.content.rootNodeId].sort());
    expect(template.content.nodes[page.rootNodeId]).toBeUndefined();
    expect(template.content.nodes.section_internal).toBeUndefined();
    expect(template.content.nodes.modal_internal).toBeUndefined();
  });

  it('commits template insertion into undo history', () => {
    const page = initialProject.pages[0]!;
    const template = createTemplateFromSelection(initialProject, page.id, 'button_add_order', {
      name: 'Undoable Button Template',
      type: 'component',
      category: 'Common',
      includeInteractions: false,
      includeDataSources: false,
    });
    useProjectStore.getState().replaceProject(structuredClone(initialProject), page.id, page.rootNodeId);
    const beforeCount = Object.keys(useProjectStore.getState().project.pages[0]!.nodes).length;

    const next = insertTemplateIntoPage(useProjectStore.getState().project, page.id, page.rootNodeId, template, page.frames?.[0]?.id);
    useProjectStore.getState().commitProject(next, page.id, page.rootNodeId);

    expect(Object.keys(useProjectStore.getState().project.pages[0]!.nodes).length).toBeGreaterThan(beforeCount);
    expect(useProjectStore.getState().pastProjects).toHaveLength(1);

    useProjectStore.getState().undo();

    expect(Object.keys(useProjectStore.getState().project.pages[0]!.nodes)).toHaveLength(beforeCount);
  });

  it('reuses saved interactions and creates pages from page templates', () => {
    const page = initialProject.pages[0]!;
    const blockTemplate = createTemplateFromSelection(initialProject, page.id, 'node_orders_search', {
      name: '搜索区模板',
      type: 'block',
      category: '表单',
      includeInteractions: true,
      includeDataSources: false,
      includeExternalReferences: true,
    });
    const withBlock = insertTemplateIntoPage(initialProject, page.id, page.rootNodeId, blockTemplate);
    expect(withBlock.interactions.length).toBeGreaterThan(initialProject.interactions.length);
    expect(withBlock.interactions.at(-1)?.trigger.componentId).not.toBe('node_orders_search');

    const pageTemplate = createTemplateFromSelection(initialProject, page.id, page.rootNodeId, {
      name: '订单页模板',
      type: 'page',
      category: '订单',
      includeInteractions: true,
      includeDataSources: true,
    });
    const withPage = createPageFromTemplate(initialProject, pageTemplate);
    expect(withPage.pages.length).toBe(initialProject.pages.length + 1);
    expect(withPage.pages.at(-1)?.name).toBe('订单页模板');
  });

  it('drops template interactions that point to nodes outside the saved subtree', () => {
    const page = initialProject.pages[0]!;
    const componentTemplate = createTemplateFromSelection(initialProject, page.id, 'button_add_order', {
      name: '新增按钮模板',
      type: 'component',
      category: '常用',
      includeInteractions: true,
      includeDataSources: false,
    });
    expect(componentTemplate.content.interactions).toEqual([]);

    const modalTemplate = createTemplateFromSelection(initialProject, page.id, 'node_add_order_modal', {
      name: '新增订单弹窗模板',
      type: 'block',
      category: '表单',
      includeInteractions: true,
      includeDataSources: false,
    });
    expect(modalTemplate.content.interactions.every((interaction) => interaction.actions.every((action) => action.type !== 'openModal' && action.type !== 'resetForm'))).toBe(true);
  });

  it('applies save options for props, content, data, internal interactions, and external references', () => {
    const project = withTemplateFixture();
    const page = project.pages[0]!;
    const template = createTemplateFromSelection(project, page.id, 'section_internal', {
      name: 'Option Snapshot',
      type: 'block',
      category: 'Test',
      includeProps: false,
      includeContent: false,
      includeData: false,
      includeInternalInteractions: true,
      includeExternalReferences: false,
    });

    expect(template.content.nodes.section_internal?.props).toEqual({});
    expect(template.content.nodes.table_internal?.content).toBeUndefined();
    expect(template.content.nodes.table_internal?.data).toBeUndefined();
    expect(template.content.dataSources).toBeUndefined();
    expect(template.content.interactions.map((item) => item.id)).toEqual(['interaction_internal_ui']);

    const withExternal = createTemplateFromSelection(project, page.id, 'section_internal', {
      name: 'External Snapshot',
      type: 'block',
      category: 'Test',
      includeProps: true,
      includeContent: true,
      includeData: true,
      includeInternalInteractions: true,
      includeExternalReferences: true,
    });

    expect(withExternal.content.interactions.map((item) => item.id).sort()).toEqual(['interaction_external', 'interaction_internal', 'interaction_internal_ui']);
    expect(withExternal.content.dataSources?.map((source) => source.id)).toEqual(['ds_internal']);
  });

  it('renames, updates, duplicates, deletes, and persists templates in local storage', () => {
    const page = initialProject.pages[0]!;
    const template = createTemplateFromSelection(initialProject, page.id, 'button_add_order', {
      name: 'Saved Button',
      type: 'component',
      category: 'Common',
      includeInteractions: false,
      includeDataSources: false,
    });
    saveUserTemplate(template);

    renameUserTemplate(template.id, 'Renamed Button');
    expect(listUserTemplates()[0]?.name).toBe('Renamed Button');

    const updated = updateUserTemplate({ ...listUserTemplates()[0]!, description: 'updated' });
    expect(updated.version).toBe(3);
    expect(listUserTemplates()[0]?.description).toBe('updated');

    const duplicated = duplicateUserTemplate(template.id);
    expect(duplicated?.id).not.toBe(template.id);
    expect(listUserTemplates()).toHaveLength(2);

    deleteUserTemplate(template.id);
    expect(listUserTemplates().map((item) => item.id)).toEqual([duplicated?.id]);
  });

  it('regenerates node, interaction, and data source IDs while remapping internal references on insert', () => {
    const project = withTemplateFixture();
    const page = project.pages[0]!;
    const template = createTemplateFromSelection(project, page.id, 'section_internal', {
      name: 'Internal Block',
      type: 'block',
      category: 'Test',
      includeProps: true,
      includeContent: true,
      includeData: true,
      includeInternalInteractions: true,
      includeExternalReferences: false,
    });
    const next = insertTemplateIntoPage(project, page.id, page.rootNodeId, template, 'frame_main');
    const insertedNodes = Object.values(next.pages[0]!.nodes).filter((node) => !project.pages[0]!.nodes[node.id] && node.name.startsWith('Template '));
    const insertedIds = new Set(insertedNodes.map((node) => node.id));
    const insertedTable = insertedNodes.find((node) => node.name === 'Template Table');
    const insertedModal = insertedNodes.find((node) => node.name === 'Template Modal');
    const insertedInteraction = next.interactions.find((interaction) => !project.interactions.some((source) => source.id === interaction.id) && interaction.trigger.event === 'rowClick');
    const insertedDataSource = next.dataSources.find((source) => !project.dataSources.some((item) => item.id === source.id));

    expect(insertedNodes).toHaveLength(3);
    expect([...insertedIds].some((id) => ['section_internal', 'table_internal', 'modal_internal'].includes(id))).toBe(false);
    expect(insertedDataSource?.id).not.toBe('ds_internal');
    expect(insertedTable?.props.dataSourceId).toBe(insertedDataSource?.id);
    expect(insertedInteraction?.id).not.toBe('interaction_internal');
    expect(insertedInteraction?.trigger.componentId).toBe(insertedTable?.id);
    expect(insertedInteraction?.actions).toContainEqual({ type: 'openModal', targetNodeId: insertedModal?.id });
    expect(insertedTable?.events?.rowClick?.interactionId).toBe(insertedInteraction?.id);
    expect(insertedTable?.events?.rowClick?.interactionId).not.toBe('interaction_internal');
    expect(insertedTable?.canvas?.zIndex).toBeGreaterThan(10);
  });

  it('keeps inserted instances independent from the saved template snapshot', () => {
    const project = withTemplateFixture();
    const page = project.pages[0]!;
    const template = createTemplateFromSelection(project, page.id, 'table_internal', {
      name: 'Table Component',
      type: 'component',
      category: 'Test',
      includeProps: true,
      includeContent: true,
      includeData: true,
      includeInternalInteractions: false,
      includeExternalReferences: false,
    });
    const next = insertTemplateIntoPage(project, page.id, page.rootNodeId, template, 'frame_main');
    const inserted = Object.values(next.pages[0]!.nodes).find((node) => !project.pages[0]!.nodes[node.id] && node.name === 'Template Table');
    if (inserted) inserted.props.title = 'Changed Instance';

    expect(template.content.nodes.table_internal?.props.title).toBe('Template Table');
  });

  it('saves and inserts page frame templates as new frames with remapped node IDs', () => {
    const project = withTemplateFixture();
    const page = project.pages[0]!;
    const template = createTemplateFromSelection(project, page.id, page.rootNodeId, {
      name: 'Frame Template',
      type: 'pageFrame',
      category: 'Frame',
      frameId: 'frame_main',
      includeProps: true,
      includeContent: true,
      includeData: true,
      includeInternalInteractions: true,
      includeExternalReferences: false,
    });
    const next = insertTemplateIntoPage(project, page.id, page.rootNodeId, template);
    const nextPage = next.pages[0]!;
    const insertedFrame = nextPage.frames?.find((frame) => frame.id !== 'frame_main');
    const frameNodeIds = Object.values(nextPage.nodes).filter((node) => node.canvas?.parentFrameId === insertedFrame?.id).map((node) => node.id);

    expect(template.content.frames?.[0]?.id).toBe('frame_main');
    expect(insertedFrame?.name).toBe('Frame Template');
    expect(frameNodeIds.length).toBeGreaterThan(0);
    expect(frameNodeIds).not.toContain('table_internal');
  });
});

function withTemplateFixture(): Project {
  return {
    ...structuredClone(initialProject),
    dataSources: [
      ...initialProject.dataSources,
      { id: 'ds_internal', name: 'Internal Data', type: 'mock', fields: [{ key: 'name', label: 'Name', type: 'text' }], records: [{ name: 'A' }] },
    ],
    pages: [
      {
        ...structuredClone(initialProject.pages[0]!),
        frames: [{ id: 'frame_main', name: 'Main Frame', x: 0, y: 0, width: 1440, height: 900, zIndex: 1 }],
        nodes: {
          ...structuredClone(initialProject.pages[0]!.nodes),
          node_orders_root: {
            ...structuredClone(initialProject.pages[0]!.nodes.node_orders_root!),
            children: [...(initialProject.pages[0]!.nodes.node_orders_root!.children ?? []), 'section_internal'],
          },
          existing_top: {
            id: 'existing_top',
            type: 'Button',
            name: 'Existing Top',
            props: { text: 'Top' },
            canvas: { x: 0, y: 0, width: 80, height: 32, zIndex: 10, parentFrameId: 'frame_main' },
          },
          section_internal: {
            id: 'section_internal',
            type: 'Section',
            name: 'Template Section',
            props: { title: 'Template Section' },
            children: ['table_internal', 'modal_internal'],
            canvas: { x: 40, y: 40, width: 480, height: 320, zIndex: 2, parentFrameId: 'frame_main' },
          },
          table_internal: {
            id: 'table_internal',
            type: 'Table',
            name: 'Template Table',
            props: { title: 'Template Table', dataSourceId: 'ds_internal' },
            events: { rowClick: { interactionId: 'interaction_internal' } },
            content: { emptyText: 'No data' },
            data: { selectedId: 'row_1' },
            canvas: { x: 60, y: 80, width: 400, height: 180, zIndex: 3, parentFrameId: 'frame_main' },
          },
          modal_internal: {
            id: 'modal_internal',
            type: 'Modal',
            name: 'Template Modal',
            props: { title: 'Template Modal' },
            canvas: { x: 120, y: 120, width: 360, height: 240, zIndex: 4, parentFrameId: 'frame_main' },
          },
        },
      },
      ...structuredClone(initialProject.pages.slice(1)),
    ],
    interactions: [
      ...initialProject.interactions,
      {
        id: 'interaction_internal_ui',
        name: 'Open internal modal without data',
        trigger: { componentId: 'table_internal', event: 'select' },
        actions: [{ type: 'openModal', targetNodeId: 'modal_internal' }],
        enabled: true,
      },
      {
        id: 'interaction_internal',
        name: 'Open internal modal',
        trigger: { componentId: 'table_internal', event: 'rowClick' },
        actions: [
          { type: 'openModal', targetNodeId: 'modal_internal' },
          { type: 'refreshData', dataSourceId: 'ds_internal' },
        ],
        enabled: true,
      },
      {
        id: 'interaction_external',
        name: 'External navigation',
        trigger: { componentId: 'table_internal', event: 'click' },
        actions: [{ type: 'navigate', targetPageId: 'page_refunds' }],
        enabled: true,
      },
    ],
  };
}
