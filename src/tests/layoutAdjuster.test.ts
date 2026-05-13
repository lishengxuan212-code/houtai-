import { describe, expect, it } from 'vitest';
import type { Project } from '../domain/types';
import { createLayoutAdjustmentOperations, groupEntriesByLayoutRows } from '../ai/layoutAdjuster';

const project: Project = {
  id: 'layout_adjust_test',
  name: 'Layout adjust test',
  version: 1,
  createdAt: '2026-05-13T00:00:00.000+08:00',
  updatedAt: '2026-05-13T00:00:00.000+08:00',
  variables: [],
  dataSources: [],
  interactions: [],
  pages: [
    {
      id: 'page_main',
      name: 'Page',
      route: '/',
      rootNodeId: 'root',
      frames: [{ id: 'frame_main', name: 'Frame', x: 0, y: 0, width: 720, height: 420, zIndex: 1 }],
      nodes: {
        root: { id: 'root', type: 'PageContainer', name: 'Root', props: {}, children: ['title', 'label', 'input', 'button', 'table', 'panel'] },
        title: { id: 'title', type: 'PageTitle', name: 'Title', props: { content: '活动管理' }, canvas: { x: 4, y: 8, width: 260, height: 32, zIndex: 1, parentFrameId: 'frame_main' } },
        label: { id: 'label', type: 'BodyText', name: 'Label', props: { content: '变更时长' }, canvas: { x: 10, y: 80, width: 96, height: 32, zIndex: 2, parentFrameId: 'frame_main' } },
        input: { id: 'input', type: 'Input', name: 'Input', props: {}, canvas: { x: 72, y: 78, width: 160, height: 40, zIndex: 3, parentFrameId: 'frame_main' } },
        button: { id: 'button', type: 'Button', name: 'Button', props: {}, canvas: { x: 210, y: 84, width: 88, height: 36, zIndex: 4, parentFrameId: 'frame_main' } },
        table: { id: 'table', type: 'Table', name: 'Table', props: {}, canvas: { x: 0, y: 96, width: 960, height: 260, zIndex: 5, parentFrameId: 'frame_main' } },
        panel: { id: 'panel', type: 'WhitePanel', name: 'Background panel', props: {}, canvas: { x: 0, y: 70, width: 720, height: 180, zIndex: 0, parentFrameId: 'frame_main' } },
      },
    },
  ],
};

describe('layout adjuster', () => {
  it('keeps large lower content as a later visual row', () => {
    const rows = groupEntriesByLayoutRows([
      { node: project.pages[0]!.nodes.label!, canvas: project.pages[0]!.nodes.label!.canvas! },
      { node: project.pages[0]!.nodes.input!, canvas: project.pages[0]!.nodes.input!.canvas! },
      { node: project.pages[0]!.nodes.table!, canvas: project.pages[0]!.nodes.table!.canvas! },
    ]);

    expect(rows).toHaveLength(2);
  });

  it('uses backoffice layout rules for title, filter row, table area, and WhitePanel removal', () => {
    const operations = createLayoutAdjustmentOperations(project, 'page_main', 'frame_main');

    expect(operations).toContainEqual({ type: 'deleteNode', pageId: 'page_main', nodeId: 'panel' });
    expect(operations).toContainEqual({
      type: 'updateNodeCanvas',
      pageId: 'page_main',
      nodeId: 'title',
      canvas: { x: 24, y: 24, width: 672, parentFrameId: 'frame_main' },
    });
    expect(operations).toContainEqual({
      type: 'updateNodeCanvas',
      pageId: 'page_main',
      nodeId: 'label',
      canvas: { x: 24, y: 72, parentFrameId: 'frame_main' },
    });
    expect(operations).toContainEqual({
      type: 'updateNodeCanvas',
      pageId: 'page_main',
      nodeId: 'input',
      canvas: { x: 132, y: 72, parentFrameId: 'frame_main' },
    });
    expect(operations).toContainEqual({
      type: 'updateNodeCanvas',
      pageId: 'page_main',
      nodeId: 'button',
      canvas: { x: 304, y: 72, parentFrameId: 'frame_main' },
    });
    expect(operations).toContainEqual({
      type: 'updateNodeCanvas',
      pageId: 'page_main',
      nodeId: 'table',
      canvas: { x: 24, y: 128, width: 672, parentFrameId: 'frame_main' },
    });
  });

  it('clamps adjusted nodes inside the page frame', () => {
    const narrowProject: Project = structuredClone(project);
    narrowProject.pages[0]!.frames![0]!.width = 320;
    narrowProject.pages[0]!.frames![0]!.height = 180;

    const operations = createLayoutAdjustmentOperations(narrowProject, 'page_main', 'frame_main');
    const tablePatch = operations.find((operation) => operation.type === 'updateNodeCanvas' && operation.nodeId === 'table');

    expect(tablePatch).toMatchObject({
      type: 'updateNodeCanvas',
      pageId: 'page_main',
      nodeId: 'table',
      canvas: { x: 24, y: 128, width: 272, height: 28, parentFrameId: 'frame_main' },
    });
  });
});
