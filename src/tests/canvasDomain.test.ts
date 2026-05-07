import { describe, expect, it } from 'vitest';
import {
  alignNodesByCanvas,
  assignNodeToFrame,
  cloneNodesWithNewIds,
  createPageFrame,
  distributeNodesByCanvas,
  ensureNodeCanvas,
  filterNodesForFrame,
  setNodeCanvasHidden,
  setNodeCanvasLocked,
} from '../domain/canvas';
import { applyOperation } from '../domain/operations';
import { PageSchema, ProjectSchema } from '../domain/schemas';
import type { ComponentNode, Page, Project } from '../domain/types';

function node(id: string, canvas?: ComponentNode['canvas']): ComponentNode {
  const componentNode: ComponentNode = {
    id,
    type: 'Button',
    name: id,
    props: { text: id },
  };
  if (canvas) componentNode.canvas = canvas;
  return componentNode;
}

function pageWithNodes(nodes: Record<string, ComponentNode>, frames: Page['frames'] = []): Page {
  return {
    id: 'page_canvas',
    name: 'Canvas page',
    route: '/canvas',
    rootNodeId: 'root',
    frames,
    nodes: {
      root: {
        id: 'root',
        type: 'PageContainer',
        name: 'Root',
        props: {},
        children: Object.keys(nodes),
      },
      ...nodes,
    },
  };
}

describe('canvas domain model', () => {
  it('serializes separated node responsibilities and page frames through schemas', () => {
    const project: Project = {
      id: 'project_canvas',
      name: 'Canvas Project',
      version: 1,
      createdAt: '2026-05-07T00:00:00.000Z',
      updatedAt: '2026-05-07T00:00:00.000Z',
      dataSources: [],
      variables: [],
      interactions: [],
      pages: [
        {
          id: 'page_orders',
          name: 'Orders',
          route: '/orders',
          purpose: 'Manage orders',
          rootNodeId: 'root',
          frames: [
            {
              id: 'frame_orders',
              name: 'Orders desktop',
              x: 120,
              y: 80,
              width: 1440,
              height: 900,
              zIndex: 1,
              background: { color: '#ffffff' },
            },
          ],
          nodes: {
            root: { id: 'root', type: 'PageContainer', name: 'Root', props: {}, children: ['button_1'] },
            button_1: {
              id: 'button_1',
              type: 'Button',
              name: 'Create order',
              props: { variant: 'primary' },
              content: { text: 'Create order' },
              data: { dataSourceId: 'ds_orders' },
              events: { click: { interactionId: 'interaction_create' } },
              canvas: { x: 24, y: 32, width: 120, height: 40, zIndex: 3, parentFrameId: 'frame_orders' },
              semantic: { moduleName: 'Order actions', moduleType: 'toolbar', description: 'Creates an order.' },
            },
          },
        },
      ],
    };

    const parsed = ProjectSchema.parse(JSON.parse(JSON.stringify(project))) as Project;

    expect(parsed.pages[0]?.frames?.[0]?.background).toEqual({ color: '#ffffff' });
    expect(parsed.pages[0]?.nodes.button_1?.content).toEqual({ text: 'Create order' });
    expect(parsed.pages[0]?.nodes.button_1?.canvas?.parentFrameId).toBe('frame_orders');
    expect(parsed.pages[0]?.nodes.button_1?.semantic?.moduleName).toBe('Order actions');
  });

  it('keeps legacy pages and nodes valid while adding optional frame fields', () => {
    expect(
      PageSchema.parse({
        id: 'legacy_page',
        name: 'Legacy',
        route: '/legacy',
        rootNodeId: 'root',
        nodes: {
          root: { id: 'root', type: 'PageContainer', name: 'Root', props: {}, children: ['button_1'] },
          button_1: { id: 'button_1', type: 'Button', name: 'Button', props: { text: 'Button' } },
        },
      }),
    ).toMatchObject({ id: 'legacy_page' });
  });

  it('creates page frames and derives default canvas metadata from legacy layout', () => {
    const frame = createPageFrame({ id: 'frame_orders', name: 'Orders', x: 10, y: 20, width: 1280, height: 720, zIndex: 2 });
    const legacyNode: ComponentNode = {
      id: 'button_1',
      type: 'Button',
      name: 'Button',
      props: {},
      layout: { x: 5, y: 6, width: 100, height: 32 },
    };

    expect(frame).toEqual({ id: 'frame_orders', name: 'Orders', x: 10, y: 20, width: 1280, height: 720, zIndex: 2 });
    expect(ensureNodeCanvas(legacyNode).canvas).toEqual({ x: 5, y: 6, width: 100, height: 32, zIndex: 0 });
  });

  it('assigns nodes to a frame and filters visible nodes for the active frame', () => {
    const nodes = {
      node_a: assignNodeToFrame(node('node_a', { x: 0, y: 0, width: 80, height: 40, zIndex: 1 }), 'frame_a'),
      node_b: assignNodeToFrame(node('node_b', { x: 0, y: 48, width: 80, height: 40, zIndex: 2 }), 'frame_b'),
      node_hidden: setNodeCanvasHidden(assignNodeToFrame(node('node_hidden', { x: 0, y: 96, width: 80, height: 40, zIndex: 3 }), 'frame_a'), true),
      note: node('note', { x: 400, y: 400, width: 160, height: 80, zIndex: 4 }),
    };
    const page = pageWithNodes(nodes, [createPageFrame({ id: 'frame_a', name: 'A', x: 0, y: 0, width: 1000, height: 800, zIndex: 1 })]);

    expect(filterNodesForFrame(page, 'frame_a').map((item) => item.id)).toEqual(['node_a']);
    expect(filterNodesForFrame(page, 'frame_a', { includeHidden: true }).map((item) => item.id)).toEqual(['node_a', 'node_hidden']);
  });

  it('clones selected subtrees with new ids while preserving serializable metadata', () => {
    const source = pageWithNodes({
      panel: {
        ...node('panel', { x: 10, y: 20, width: 200, height: 100, zIndex: 1, parentFrameId: 'frame_a' }),
        type: 'Section',
        content: { title: 'Panel' },
        data: { query: 'orders' },
        events: { click: { interactionId: 'interaction_panel' } },
        semantic: { moduleName: 'Orders panel', moduleType: 'summary' },
        children: ['button'],
      },
      button: node('button', { x: 24, y: 48, width: 100, height: 32, zIndex: 2, parentFrameId: 'frame_a' }),
    });

    const result = cloneNodesWithNewIds(source, ['panel'], { idFactory: (oldId) => `copy_${oldId}` });

    expect(result.rootIds).toEqual(['copy_panel']);
    expect(result.idMap).toEqual({ panel: 'copy_panel', button: 'copy_button' });
    expect(result.nodes.copy_panel).toMatchObject({
      id: 'copy_panel',
      children: ['copy_button'],
      canvas: { x: 10, y: 20, width: 200, height: 100, zIndex: 1, parentFrameId: 'frame_a' },
      content: { title: 'Panel' },
      data: { query: 'orders' },
      events: { click: { interactionId: 'interaction_panel' } },
      semantic: { moduleName: 'Orders panel', moduleType: 'summary' },
    });
    expect(result.nodes.copy_button?.id).toBe('copy_button');
  });

  it('sets lock and hide flags without changing other canvas bounds', () => {
    const original = node('button_1', { x: 1, y: 2, width: 3, height: 4, zIndex: 5, parentFrameId: 'frame_a' });

    const locked = setNodeCanvasLocked(original, true);
    const hidden = setNodeCanvasHidden(locked, true);

    expect(hidden.canvas).toEqual({ x: 1, y: 2, width: 3, height: 4, zIndex: 5, parentFrameId: 'frame_a', locked: true, hidden: true });
    expect(original.canvas).toEqual({ x: 1, y: 2, width: 3, height: 4, zIndex: 5, parentFrameId: 'frame_a' });
  });

  it('aligns unlocked nodes by their canvas bounds', () => {
    const result = alignNodesByCanvas(
      [
        node('a', { x: 10, y: 20, width: 40, height: 20, zIndex: 1 }),
        node('b', { x: 40, y: 80, width: 80, height: 20, zIndex: 2 }),
        node('locked', { x: 99, y: 99, width: 20, height: 20, zIndex: 3, locked: true }),
      ],
      'right',
    );

    expect(result.map((item) => item.canvas?.x)).toEqual([80, 40, 99]);
  });

  it('distributes unlocked nodes with equal gaps between canvas bounds', () => {
    const result = distributeNodesByCanvas(
      [
        node('a', { x: 0, y: 0, width: 10, height: 10, zIndex: 1 }),
        node('b', { x: 25, y: 0, width: 10, height: 10, zIndex: 2 }),
        node('c', { x: 100, y: 0, width: 20, height: 10, zIndex: 3 }),
      ],
      'horizontal',
    );

    expect(result.map((item) => [item.id, item.canvas?.x])).toEqual([
      ['a', 0],
      ['b', 50],
      ['c', 100],
    ]);
  });

  it('applies persistent canvas operations to project JSON', () => {
    const project: Project = {
      id: 'project_canvas_ops',
      name: 'Canvas Operations',
      version: 1,
      createdAt: '2026-05-07T00:00:00.000Z',
      updatedAt: '2026-05-07T00:00:00.000Z',
      dataSources: [],
      variables: [],
      interactions: [],
      pages: [pageWithNodes({ button_1: node('button_1') })],
    };

    const withFrame = applyOperation(project, {
      type: 'addPageFrame',
      pageId: 'page_canvas',
      frame: createPageFrame({ id: 'frame_a', name: 'A', x: 0, y: 0, width: 1440, height: 900, zIndex: 1 }),
    });
    const withCanvas = applyOperation(withFrame, {
      type: 'updateNodeCanvas',
      pageId: 'page_canvas',
      nodeId: 'button_1',
      canvas: { x: 16, y: 24, width: 120, height: 40, zIndex: 2 },
    });
    const assigned = applyOperation(withCanvas, { type: 'assignNodeToFrame', pageId: 'page_canvas', nodeId: 'button_1', frameId: 'frame_a' });
    const hidden = applyOperation(assigned, { type: 'setNodeCanvasHidden', pageId: 'page_canvas', nodeId: 'button_1', hidden: true });

    expect(hidden.pages[0]?.frames).toHaveLength(1);
    expect(hidden.pages[0]?.nodes.button_1?.canvas).toEqual({
      x: 16,
      y: 24,
      width: 120,
      height: 40,
      zIndex: 2,
      parentFrameId: 'frame_a',
      hidden: true,
    });
  });
});
