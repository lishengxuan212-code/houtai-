import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AssemblyCanvas } from '../editor/AssemblyCanvas';
import type { Project } from '../domain/types';
import { useProjectStore } from '../store/projectStore';

const storage = new Map<string, string>();

const baseProject: Project = {
  id: 'project_canvas_editor_test',
  name: 'Canvas editor test',
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
      nodes: {
        root: {
          id: 'root',
          type: 'PageContainer',
          name: 'Root page',
          props: { title: 'Orders' },
          children: ['button_one', 'button_hidden'],
        },
        button_one: {
          id: 'button_one',
          type: 'Button',
          name: 'Primary action',
          props: { text: 'Create order', variant: 'primary', danger: false },
          canvas: { x: 64, y: 72, width: 180, height: 48, zIndex: 3, parentFrameId: 'frame_page_canvas_default' },
        },
        button_hidden: {
          id: 'button_hidden',
          type: 'Button',
          name: 'Hidden action',
          props: { text: 'Hidden action', variant: 'default', danger: false },
          canvas: { x: 64, y: 140, width: 180, height: 48, zIndex: 4, parentFrameId: 'frame_page_canvas_default', hidden: true },
        },
      },
    },
  ],
};

function replaceProject(project: Project = baseProject) {
  useProjectStore.getState().replaceProject(structuredClone(project), 'page_canvas', 'root');
}

function mockCanvasRects() {
  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function getRect(this: HTMLElement) {
    if (this.classList.contains('canvas-page-frame')) {
      return { x: 100, y: 80, left: 100, top: 80, right: 1300, bottom: 840, width: 1200, height: 760, toJSON: () => ({}) };
    }
    if (this.dataset.nodeId === 'button_one') {
      return { x: 164, y: 152, left: 164, top: 152, right: 344, bottom: 200, width: 180, height: 48, toJSON: () => ({}) };
    }
    return { x: 0, y: 0, left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, toJSON: () => ({}) };
  });
}

function dispatchDrop(element: HTMLElement, type: string, clientX: number, clientY: number) {
  const event = new Event('drop', { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    clientX: { value: clientX },
    clientY: { value: clientY },
    dataTransfer: {
      value: {
        types: ['application/x-admin-component'],
        getData: (dataType: string) => (dataType === 'application/x-admin-component' ? type : ''),
      },
    },
  });
  fireEvent(element, event);
}

describe('AssemblyCanvas page-frame editor', () => {
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
    localStorage.clear();
    replaceProject();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('drops library components into the active frame with canvas metadata', async () => {
    mockCanvasRects();
    render(<AssemblyCanvas />);

    const frame = await screen.findByTestId('canvas-page-frame');
    dispatchDrop(frame, 'Button', 260, 220);

    const { project, selectedNodeId } = useProjectStore.getState();
    const page = project.pages[0]!;
    const added = selectedNodeId ? page.nodes[selectedNodeId] : undefined;

    expect(added?.type).toBe('Button');
    expect(added?.canvas).toMatchObject({
      x: 160,
      y: 140,
      width: 180,
      height: 48,
      parentFrameId: 'frame_page_canvas_default',
    });
    expect(typeof added?.canvas?.zIndex).toBe('number');
  });

  it('renders selected frame nodes with absolute canvas positioning', async () => {
    render(<AssemblyCanvas />);

    fireEvent.click(await screen.findByTestId('canvas-node-button_one'));

    const node = screen.getByTestId('canvas-node-button_one');
    expect(node).toHaveClass('selected');
    expect(useProjectStore.getState().selectedNodeIds).toEqual(['button_one']);
    expect(node).toHaveStyle({ position: 'absolute', left: '64px', top: '72px', width: '180px', height: '48px', zIndex: '3' });
  });

  it('persists drag movement and resize through canvas updates', async () => {
    mockCanvasRects();
    render(<AssemblyCanvas />);

    const node = await screen.findByTestId('canvas-node-button_one');
    fireEvent.mouseDown(node, { clientX: 180, clientY: 170, button: 0 });
    fireEvent.mouseMove(window, { clientX: 210, clientY: 205 });
    fireEvent.mouseUp(window);

    await waitFor(() => {
      expect(useProjectStore.getState().project.pages[0]!.nodes.button_one?.canvas).toMatchObject({ x: 94, y: 107 });
    });

    fireEvent.click(node);
    fireEvent.mouseDown(screen.getByLabelText('resize-se'), { clientX: 344, clientY: 200, button: 0 });
    fireEvent.mouseMove(window, { clientX: 384, clientY: 230 });
    fireEvent.mouseUp(window);

    await waitFor(() => {
      expect(useProjectStore.getState().project.pages[0]!.nodes.button_one?.canvas).toMatchObject({ width: 220, height: 78 });
    });
  });

  it('does not render hidden frame nodes', async () => {
    render(<AssemblyCanvas />);

    expect(await screen.findByText('Create order')).toBeInTheDocument();
    expect(screen.queryByText('Hidden action')).not.toBeInTheDocument();
  });

  it('keeps double-click inline text editing inside canvas nodes', async () => {
    render(<AssemblyCanvas />);

    fireEvent.doubleClick(await screen.findByText('Create order'));

    expect(screen.getByRole('textbox')).toHaveValue('Create order');
  });

  it('copies and pastes the selected canvas node with a new id', async () => {
    render(<AssemblyCanvas />);

    fireEvent.click(await screen.findByTestId('canvas-node-button_one'));
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true });
    fireEvent.keyDown(document, { key: 'v', ctrlKey: true });

    const { project, selectedNodeId } = useProjectStore.getState();
    const page = project.pages[0]!;
    const pasted = selectedNodeId ? page.nodes[selectedNodeId] : undefined;

    expect(pasted?.id).not.toBe('button_one');
    expect(pasted?.type).toBe('Button');
    expect(pasted?.props).toEqual(page.nodes.button_one?.props);
    expect(pasted?.canvas).toMatchObject({ x: 88, y: 96, parentFrameId: 'frame_page_canvas_default' });
    expect(page.nodes.root?.children).toContain(pasted?.id);
  });

  it('aligns and distributes selected canvas nodes through store commands', async () => {
    const project: Project = structuredClone(baseProject);
    project.pages[0]!.nodes.button_two = {
      id: 'button_two',
      type: 'Button',
      name: 'Secondary action',
      props: { text: 'Archive', variant: 'default', danger: false },
      canvas: { x: 260, y: 160, width: 180, height: 48, zIndex: 5, parentFrameId: 'frame_page_canvas_default' },
    };
    project.pages[0]!.nodes.button_three = {
      id: 'button_three',
      type: 'Button',
      name: 'Third action',
      props: { text: 'Export', variant: 'default', danger: false },
      canvas: { x: 520, y: 260, width: 180, height: 48, zIndex: 6, parentFrameId: 'frame_page_canvas_default' },
    };
    project.pages[0]!.nodes.root!.children = ['button_one', 'button_two', 'button_three'];
    replaceProject(project);

    const store = useProjectStore.getState();
    store.selectNodes(['button_one', 'button_two', 'button_three']);
    store.alignSelectedNodes('left');

    expect(useProjectStore.getState().project.pages[0]!.nodes.button_two?.canvas?.x).toBe(64);
    expect(useProjectStore.getState().project.pages[0]!.nodes.button_three?.canvas?.x).toBe(64);

    useProjectStore.getState().distributeSelectedNodes('vertical');

    const nodes = useProjectStore.getState().project.pages[0]!.nodes;
    expect(nodes.button_one?.canvas?.y).toBe(72);
    expect(nodes.button_two?.canvas?.y).toBe(166);
    expect(nodes.button_three?.canvas?.y).toBe(260);
  });

  it('opens a node context menu and updates z-order actions', async () => {
    render(<AssemblyCanvas />);

    const node = await screen.findByTestId('canvas-node-button_one');
    fireEvent.contextMenu(node);

    expect(screen.getByText('Bring front')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Bring front'));

    expect(useProjectStore.getState().project.pages[0]!.nodes.button_one?.canvas?.zIndex).toBe(5);

    fireEvent.contextMenu(node);
    fireEvent.click(screen.getByText('Send back'));

    expect(useProjectStore.getState().project.pages[0]!.nodes.button_one?.canvas?.zIndex).toBeLessThan(0);
  });

  it('groups and ungroups selected canvas nodes through project operations', () => {
    const project: Project = structuredClone(baseProject);
    project.pages[0]!.nodes.button_two = {
      id: 'button_two',
      type: 'Button',
      name: 'Secondary action',
      props: { text: 'Archive', variant: 'default', danger: false },
      canvas: { x: 260, y: 160, width: 180, height: 48, zIndex: 5, parentFrameId: 'frame_page_canvas_default' },
    };
    project.pages[0]!.nodes.root!.children = ['button_one', 'button_two'];
    replaceProject(project);

    useProjectStore.getState().selectNodes(['button_one', 'button_two']);
    useProjectStore.getState().groupSelectedNodes();

    const groupedState = useProjectStore.getState();
    const groupId = groupedState.selectedNodeId!;
    const group = groupedState.project.pages[0]!.nodes[groupId]!;
    expect(group.type).toBe('Section');
    expect(group.children).toEqual(['button_one', 'button_two']);
    expect(group.canvas).toMatchObject({ x: 64, y: 72, width: 376, height: 136, parentFrameId: 'frame_page_canvas_default' });
    expect(groupedState.project.pages[0]!.nodes.root?.children).toEqual([groupId]);

    groupedState.ungroupSelectedNode();

    const ungroupedPage = useProjectStore.getState().project.pages[0]!;
    expect(ungroupedPage.nodes[groupId]).toBeUndefined();
    expect(ungroupedPage.nodes.root?.children).toEqual(['button_one', 'button_two']);
  });
});
