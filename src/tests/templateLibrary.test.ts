import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPageFromTemplate, createTemplateFromSelection, insertTemplateIntoPage, listUserTemplates, saveUserTemplate } from '../templates/templateOperations';
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

  it('reuses saved interactions and creates pages from page templates', () => {
    const page = initialProject.pages[0]!;
    const blockTemplate = createTemplateFromSelection(initialProject, page.id, 'node_orders_search', {
      name: '搜索区模板',
      type: 'block',
      category: '表单',
      includeInteractions: true,
      includeDataSources: false,
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
});
