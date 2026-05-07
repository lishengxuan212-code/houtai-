import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AssemblyCanvas } from '../editor/AssemblyCanvas';
import { visibleCanvasNodeIds } from '../domain/canvasViewport';
import type { Project } from '../domain/types';
import { useProjectStore } from '../store/projectStore';

const storage = new Map<string, string>();

const baseProject: Project = {
  id: 'project_canvas_perf_test',
  name: 'Canvas performance test',
  version: 1,
  createdAt: '2026-05-07T00:00:00.000Z',
  updatedAt: '2026-05-07T00:00:00.000Z',
  variables: [],
  dataSources: [],
  interactions: [],
  pages: [
    {
      id: 'page_canvas',
      name: 'Orders',
      route: '/orders',
      rootNodeId: 'root',
      frames: [
        {
          id: 'frame_page_canvas_default',
          name: 'Orders',
          x: 0,
          y: 0,
          width: 1200,
          height: 760,
          zIndex: 0,
        },
      ],
      nodes: {
        root: {
          id: 'root',
          type: 'PageContainer',
          name: 'Root page',
          props: { title: 'Orders' },
          children: ['button_one'],
        },
        button_one: {
          id: 'button_one',
          type: 'Button',
          name: 'Primary action',
          props: { text: 'Create order', variant: 'primary', danger: false },
          canvas: { x: 64, y: 72, width: 180, height: 48, zIndex: 3, parentFrameId: 'frame_page_canvas_default' },
        },
      },
    },
  ],
};

function replaceProject(project: Project = baseProject) {
  useProjectStore.getState().replaceProject(structuredClone(project), 'page_canvas', 'root');
}

describe('canvas performance helpers', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        clear: () => storage.clear(),
        getItem: (key: string) => storage.get(key) ?? null,
        key: (index: number) => Array.from(storage.keys())[index] ?? null,
        removeItem: (key: string) => storage.delete(key),
        setItem: (key: string, value: string) => storage.set(key, value),
        get length() {
          return storage.size;
        },
      },
    });
    storage.clear();
    replaceProject();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps drag movement out of project updates until pointerup', async () => {
    render(<AssemblyCanvas />);

    const node = await screen.findByTestId('canvas-node-button_one');
    fireEvent.mouseDown(node, { clientX: 180, clientY: 170, button: 0 });
    fireEvent.mouseMove(window, { clientX: 190, clientY: 180 });
    fireEvent.mouseMove(window, { clientX: 210, clientY: 205 });

    expect(useProjectStore.getState().project.pages[0]!.nodes.button_one?.canvas).toMatchObject({ x: 64, y: 72 });

    fireEvent.mouseUp(window);

    expect(useProjectStore.getState().project.pages[0]!.nodes.button_one?.canvas).toMatchObject({ x: 94, y: 107 });
  });

  it('keeps resize movement out of project updates until pointerup', async () => {
    render(<AssemblyCanvas />);

    fireEvent.click(await screen.findByTestId('canvas-node-button_one'));
    fireEvent.mouseDown(screen.getByLabelText('resize-se'), { clientX: 344, clientY: 200, button: 0 });
    fireEvent.mouseMove(window, { clientX: 384, clientY: 230 });

    expect(useProjectStore.getState().project.pages[0]!.nodes.button_one?.canvas).toMatchObject({ width: 180, height: 48 });

    fireEvent.mouseUp(window);

    expect(useProjectStore.getState().project.pages[0]!.nodes.button_one?.canvas).toMatchObject({ width: 220, height: 78 });
  });

  it('culls offscreen nodes while keeping selected, dragged, and edited nodes', () => {
    const visible = visibleCanvasNodeIds({
      entries: [
        { nodeId: 'in_view', canvas: { x: 20, y: 20, width: 100, height: 80, zIndex: 1 } },
        { nodeId: 'offscreen', canvas: { x: 5000, y: 5000, width: 100, height: 80, zIndex: 2 } },
        { nodeId: 'selected_offscreen', canvas: { x: 6000, y: 6000, width: 100, height: 80, zIndex: 3 } },
        { nodeId: 'dragging_offscreen', canvas: { x: 7000, y: 7000, width: 100, height: 80, zIndex: 4 } },
      ],
      viewport: { x: 0, y: 0, width: 800, height: 600 },
      selectedNodeIds: ['selected_offscreen'],
      draggingNodeId: 'dragging_offscreen',
    });

    expect(visible.has('in_view')).toBe(true);
    expect(visible.has('offscreen')).toBe(false);
    expect(visible.has('selected_offscreen')).toBe(true);
    expect(visible.has('dragging_offscreen')).toBe(true);
  });
});
