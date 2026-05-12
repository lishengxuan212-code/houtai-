import { describe, expect, it } from 'vitest';
import { AiSuggestionSchema, ContainerLayoutSchema, OperationSchema } from '../domain/schemas';
import type { UserTemplate } from '../templates/userTemplateTypes';
import { UserTemplateSchema } from '../templates/userTemplateSchema';

describe('schema contracts', () => {
  it('parses all operation variants used by the domain type', () => {
    expect(OperationSchema.parse({ type: 'updateNodeName', pageId: 'page', nodeId: 'node', name: '名称' }).type).toBe('updateNodeName');
    expect(OperationSchema.parse({ type: 'updateNodeRuntime', pageId: 'page', nodeId: 'node', runtime: { initialVisible: true, initialDisabled: false } }).type).toBe('updateNodeRuntime');
    expect(OperationSchema.parse({ type: 'reorderNodeToIndex', pageId: 'page', parentNodeId: 'parent', nodeId: 'node', targetIndex: 1 }).type).toBe('reorderNodeToIndex');
    expect(OperationSchema.parse({ type: 'reorderNode', pageId: 'page', parentNodeId: 'parent', nodeId: 'node', targetNodeId: 'target', position: 'after' })).toMatchObject({ position: 'after' });
    expect(
      OperationSchema.parse({
        type: 'replaceNodesWithComponent',
        pageId: 'page',
        sourceNodeIds: ['visual_panel', 'visual_field'],
        node: { id: 'search_bar', type: 'SearchBar', name: '查询条件', props: {}, canvas: { x: 10, y: 20, width: 480, height: 88, zIndex: 2 } },
      }).type,
    ).toBe('replaceNodesWithComponent');
  });

  it('parses full container layout options', () => {
    expect(ContainerLayoutSchema.parse({ mode: 'stack', gap: 8, align: 'center', justify: 'bottom' })).toMatchObject({ align: 'center' });
    expect(ContainerLayoutSchema.parse({ mode: 'row', gap: 8, wrap: true, align: 'top', justify: 'between' })).toMatchObject({ justify: 'between' });
    expect(ContainerLayoutSchema.parse({ mode: 'grid', columns: 3, align: 'stretch', justify: 'right' })).toMatchObject({ align: 'stretch' });
  });

  it('parses AI suggestions carrying operations', () => {
    const suggestion = AiSuggestionSchema.parse({
      id: 'suggestion_1',
      severity: 'warning',
      category: 'interaction',
      title: '补充确认',
      description: '删除前需要确认',
      operations: [{ type: 'updateNodeName', pageId: 'page', nodeId: 'node', name: '删除按钮' }],
      canApplyAutomatically: true,
    });
    expect(suggestion.operations?.[0]?.type).toBe('updateNodeName');
  });

  it('validates user templates before local persistence returns them', () => {
    const template: UserTemplate = {
      id: 'template_1',
      name: '按钮模板',
      type: 'component',
      category: '常用',
      content: {
        rootNodeId: 'button_1',
        nodes: {
          button_1: { id: 'button_1', type: 'Button', name: '按钮', props: { text: '按钮' } },
        },
        interactions: [],
      },
      createdAt: '2026-05-07T00:00:00.000+08:00',
      updatedAt: '2026-05-07T00:00:00.000+08:00',
      version: 1,
    };
    expect(UserTemplateSchema.parse(template).id).toBe('template_1');
    expect(() => UserTemplateSchema.parse({ id: 'broken', content: {} })).toThrow();
  });
});
