import { describe, expect, it } from 'vitest';
import { createImageComponentCandidateOperation, inferImagePrototypePlan, applyImagePrototypePlan } from '../ai/imagePrototype';
import { applyOperation } from '../domain/operations';
import { initialProject } from '../store/initialProject';
import type { ComponentNode, Page, Project } from '../domain/types';

function node(id: string, type: string, canvas: ComponentNode['canvas'], props: ComponentNode['props'] = {}): ComponentNode {
  return { id, type, name: id, props, ...(canvas ? { canvas } : {}) };
}

function projectWithVisualNodes(): Project {
  const page: Page = {
    id: 'page_replace',
    name: 'Replace',
    route: '/replace',
    rootNodeId: 'root',
    frames: [{ id: 'frame_main', name: 'Main', x: 0, y: 0, width: 1200, height: 760, zIndex: 1 }],
    nodes: {
      root: { id: 'root', type: 'PageContainer', name: 'Root', props: {}, children: ['before', 'visual_panel', 'visual_field', 'visual_table', 'after'] },
      before: node('before', 'Button', { x: 10, y: 10, width: 80, height: 32, zIndex: 1, parentFrameId: 'frame_main' }),
      visual_panel: node('visual_panel', 'WhitePanel', { x: 40, y: 80, width: 500, height: 96, zIndex: 2, parentFrameId: 'frame_main' }),
      visual_field: node('visual_field', 'Input', { x: 64, y: 108, width: 180, height: 36, zIndex: 3, parentFrameId: 'frame_main' }, { label: '客户名称', fieldKey: 'customerName' }),
      visual_table: node('visual_table', 'TableSkeleton', { x: 40, y: 220, width: 760, height: 260, zIndex: 4, parentFrameId: 'frame_main' }, { columns: 5, rows: 4 }),
      after: node('after', 'Button', { x: 10, y: 520, width: 80, height: 32, zIndex: 5, parentFrameId: 'frame_main' }),
    },
  };
  return { ...initialProject, pages: [page] };
}

describe('component candidate replacement', () => {
  it('replaces selected visual nodes with one component while preserving sibling order', () => {
    const project = projectWithVisualNodes();
    const next = applyOperation(project, {
      type: 'replaceNodesWithComponent',
      pageId: 'page_replace',
      sourceNodeIds: ['visual_panel', 'visual_field'],
      node: {
        id: 'search_bar_1',
        type: 'SearchBar',
        name: '查询条件',
        props: { fields: [{ key: 'customerName', label: '客户名称', type: 'text' }] },
        canvas: { x: 40, y: 80, width: 500, height: 96, zIndex: 3, parentFrameId: 'frame_main' },
        semantic: { moduleName: '查询条件', moduleType: 'search' },
      },
    });

    const nodes = next.pages[0]!.nodes;
    expect(nodes.visual_panel).toBeUndefined();
    expect(nodes.visual_field).toBeUndefined();
    expect(nodes.search_bar_1).toMatchObject({ type: 'SearchBar', canvas: { x: 40, y: 80, width: 500, height: 96 } });
    expect(nodes.root?.children).toEqual(['before', 'search_bar_1', 'visual_table', 'after']);
  });

  it('builds a replacement operation from an image component candidate', () => {
    const page = initialProject.pages[0]!;
    const frameId = page.frames?.[0]?.id;
    const plan = inferImagePrototypePlan({
      fileName: 'upload.png',
      width: 1440,
      height: 900,
      text: '客户管理 查询 新增 客户名称 状态 创建时间 操作',
      regions: [
        { kind: 'header', x: 0, y: 0, width: 1440, height: 88, score: 0.8 },
        { kind: 'search', x: 48, y: 110, width: 980, height: 110, score: 0.9 },
        { kind: 'table', x: 48, y: 310, width: 980, height: 360, score: 0.95 },
      ],
    });
    const withVisualNodes = applyImagePrototypePlan(initialProject, page.id, frameId, plan);
    const operation = createImageComponentCandidateOperation(withVisualNodes, page.id, plan, 'candidate_search_bar');

    expect(operation).toMatchObject({
      type: 'replaceNodesWithComponent',
      pageId: page.id,
      sourceNodeIds: expect.arrayContaining(['visual_search_panel']),
      node: expect.objectContaining({ type: 'SearchBar', name: '查询条件' }),
    });

    const next = operation ? applyOperation(withVisualNodes, operation) : withVisualNodes;
    expect(next.pages[0]!.nodes.visual_search_panel).toBeUndefined();
    expect(Object.values(next.pages[0]!.nodes).some((item) => item.type === 'SearchBar')).toBe(true);
  });
});
