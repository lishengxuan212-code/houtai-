import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AssemblyCanvas } from '../editor/AssemblyCanvas';
import { PageOutlinePanel } from '../editor/workbench/PageOutlinePanel';
import type { Project } from '../domain/types';
import { clearComponentLibraryState, getComponentCanvasOverrides, getComponentDefaultOverrides } from '../store/componentLibraryStore';
import { useCanvasViewportStore } from '../store/editorStores';
import { useProjectStore } from '../store/projectStore';
import { createTemplateFromSelection, saveUserTemplate } from '../templates/templateOperations';
import { listUserTemplates } from '../templates/templateStorage';

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

function dispatchImagePaste(file: File) {
  const event = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', {
    value: {
      files: [file],
      types: [file.type],
      getData: () => '',
    },
  });
  window.dispatchEvent(event);
}

function dispatchPlainPaste() {
  const event = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', {
    value: {
      files: [],
      types: [],
      getData: () => '',
    },
  });
  window.dispatchEvent(event);
}

function setCanvasViewport(element: HTMLElement, box: { scrollLeft: number; scrollTop: number; clientWidth: number; clientHeight: number }) {
  Object.defineProperties(element, {
    scrollLeft: { configurable: true, writable: true, value: box.scrollLeft },
    scrollTop: { configurable: true, writable: true, value: box.scrollTop },
    clientWidth: { configurable: true, value: box.clientWidth },
    clientHeight: { configurable: true, value: box.clientHeight },
  });
  fireEvent.scroll(element);
}

function projectWithThreeButtons() {
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
  return project;
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
    clearComponentLibraryState();
    replaceProject();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useCanvasViewportStore.getState().resetViewport();
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
      zIndex: 5,
      parentFrameId: 'frame_page_canvas_default',
    });
  });

  it('pastes clipboard images into the active frame as image widgets', async () => {
    mockCanvasRects();
    render(<AssemblyCanvas />);

    await screen.findByTestId('canvas-page-frame');
    dispatchImagePaste(new File(['image-bytes'], 'logo.png', { type: 'image/png' }));

    await waitFor(() => {
      const { project, selectedNodeId } = useProjectStore.getState();
      const page = project.pages[0]!;
      expect(selectedNodeId).toBeDefined();
      expect(page.nodes[selectedNodeId!]?.type).toBe('ImageWidget');
    });
    const { project, selectedNodeId } = useProjectStore.getState();
    const node = project.pages[0]!.nodes[selectedNodeId!]!;
    expect(node.name).toBe('图片：logo.png');
    expect(node.props.src).toEqual(expect.stringMatching(/^data:image\/png;base64,/));
    expect(node.canvas).toMatchObject({ width: 320, height: 180, parentFrameId: 'frame_page_canvas_default' });
  });

  it('renders selected frame nodes with absolute canvas positioning', async () => {
    render(<AssemblyCanvas />);

    fireEvent.click(await screen.findByTestId('canvas-node-button_one'));

    const node = screen.getByTestId('canvas-node-button_one');
    expect(node).toHaveClass('selected');
    expect(useProjectStore.getState().selectedNodeIds).toEqual(['button_one']);
    expect(node).toHaveStyle({ position: 'absolute', left: '64px', top: '72px', width: '180px', height: '48px', zIndex: '3' });
  });

  it('supports Shift and Ctrl click multi-select and Esc clear selection', async () => {
    replaceProject(projectWithThreeButtons());
    render(<AssemblyCanvas />);

    fireEvent.click(await screen.findByTestId('canvas-node-button_one'));
    fireEvent.click(screen.getByTestId('canvas-node-button_two'), { shiftKey: true });
    const thirdNode = screen.getByTestId('canvas-node-button_three');
    fireEvent.mouseDown(thirdNode, { ctrlKey: true, button: 0 });
    fireEvent.mouseUp(thirdNode, { ctrlKey: true, button: 0 });
    fireEvent.click(thirdNode, { ctrlKey: true });

    expect(useProjectStore.getState().selectedNodeIds).toEqual(['button_one', 'button_two', 'button_three']);
    expect(screen.getByTestId('canvas-node-button_one')).toHaveClass('selected');
    expect(screen.getByTestId('canvas-node-button_two')).toHaveClass('selected');
    expect(screen.getByTestId('canvas-node-button_three')).toHaveClass('selected');

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(useProjectStore.getState().selectedNodeIds).toEqual([]);
  });

  it('box-selects canvas nodes inside the dragged frame region', async () => {
    replaceProject(projectWithThreeButtons());
    mockCanvasRects();
    render(<AssemblyCanvas />);

    const frame = await screen.findByTestId('canvas-page-frame');
    fireEvent.mouseDown(frame, { clientX: 130, clientY: 120, button: 0 });
    fireEvent.mouseMove(window, { clientX: 460, clientY: 330 });
    fireEvent.mouseUp(window);

    expect(useProjectStore.getState().selectedNodeIds).toEqual(['button_one', 'button_two']);
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

  it('drags a corner radius handle to update the component radius', async () => {
    mockCanvasRects();
    render(<AssemblyCanvas />);

    fireEvent.click(await screen.findByTestId('canvas-node-button_one'));
    fireEvent.mouseDown(screen.getByLabelText('corner-radius-handle'), { clientX: 172, clientY: 160, button: 0 });
    fireEvent.mouseMove(window, { clientX: 200, clientY: 174 });
    fireEvent.mouseUp(window);

    await waitFor(() => {
      expect(useProjectStore.getState().project.pages[0]!.nodes.button_one?.props.radius).toBe(24);
    });
  });

  it('resizes the page frame from corner handles', async () => {
    mockCanvasRects();
    render(<AssemblyCanvas />);

    await screen.findByTestId('canvas-page-frame');
    await waitFor(() => {
      expect(useProjectStore.getState().project.pages[0]!.frames?.[0]?.id).toBe('frame_page_canvas_default');
    });

    fireEvent.mouseDown(screen.getByLabelText('resize-frame-se'), { clientX: 1300, clientY: 840, button: 0 });
    fireEvent.mouseMove(window, { clientX: 1360, clientY: 880 });
    fireEvent.mouseUp(window);

    await waitFor(() => {
      expect(useProjectStore.getState().project.pages[0]!.frames?.[0]).toMatchObject({ width: 1260, height: 800 });
    });
  });

  it('moves all selected canvas nodes together when dragging one selected node', async () => {
    replaceProject(projectWithThreeButtons());
    mockCanvasRects();
    render(<AssemblyCanvas />);

    fireEvent.click(await screen.findByTestId('canvas-node-button_one'));
    fireEvent.click(screen.getByTestId('canvas-node-button_two'), { shiftKey: true });
    fireEvent.mouseDown(screen.getByTestId('canvas-node-button_one'), { clientX: 180, clientY: 170, button: 0 });
    fireEvent.mouseMove(window, { clientX: 210, clientY: 205 });
    await waitFor(() => {
      expect(screen.getByTestId('canvas-node-button_two')).toHaveStyle({ transform: 'translate(30px, 35px)' });
    });
    fireEvent.mouseUp(window);

    await waitFor(() => {
      const nodes = useProjectStore.getState().project.pages[0]!.nodes;
      expect(nodes.button_one?.canvas).toMatchObject({ x: 94, y: 107 });
      expect(nodes.button_two?.canvas).toMatchObject({ x: 290, y: 195 });
      expect(nodes.button_three?.canvas).toMatchObject({ x: 520, y: 260 });
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

  it('saves double-click table cell edits back to project data', async () => {
    replaceProject({
      ...baseProject,
      pages: [
        {
          ...baseProject.pages[0]!,
          nodes: {
            ...baseProject.pages[0]!.nodes,
            root: {
              ...baseProject.pages[0]!.nodes.root!,
              children: ['table_one'],
            },
            table_one: {
              id: 'table_one',
              type: 'Table',
              name: 'Activity table',
              props: { columns: ['活动名称'] },
              data: { rows: [{ id: 'row_1', 活动名称: '春节活动' }] },
              canvas: { x: 64, y: 72, width: 520, height: 260, zIndex: 3, parentFrameId: 'frame_page_canvas_default' },
            },
          },
        },
      ],
    });

    render(<AssemblyCanvas />);

    fireEvent.doubleClick(await screen.findByText('春节活动'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '元宵活动' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

    await waitFor(() => {
      const rows = useProjectStore.getState().project.pages[0]!.nodes.table_one?.data?.rows;
      const row = Array.isArray(rows) ? rows[0] : undefined;
      expect(row).toMatchObject({ 活动名称: '元宵活动' });
    });
  });

  it('copies and pastes the selected canvas node with a new id', async () => {
    render(<AssemblyCanvas />);

    fireEvent.click(await screen.findByTestId('canvas-node-button_one'));
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true });
    dispatchPlainPaste();

    await waitFor(() => {
      expect(useProjectStore.getState().selectedNodeId).not.toBe('button_one');
    });
    const { project, selectedNodeId } = useProjectStore.getState();
    const page = project.pages[0]!;
    const pasted = selectedNodeId ? page.nodes[selectedNodeId] : undefined;

    expect(pasted?.id).not.toBe('button_one');
    expect(pasted?.type).toBe('Button');
    expect(pasted?.props).toEqual(page.nodes.button_one?.props);
    expect(pasted?.canvas).toMatchObject({ x: 88, y: 96, zIndex: 5, parentFrameId: 'frame_page_canvas_default' });
    expect(page.nodes.root?.children).toContain(pasted?.id);
  });

  it('groups and ungroups selected nodes with keyboard shortcuts', async () => {
    replaceProject(projectWithThreeButtons());
    render(<AssemblyCanvas />);

    fireEvent.click(await screen.findByTestId('canvas-node-button_one'));
    fireEvent.click(screen.getByTestId('canvas-node-button_two'), { shiftKey: true });
    fireEvent.keyDown(document, { key: 'g', ctrlKey: true });

    const grouped = useProjectStore.getState();
    const groupId = grouped.project.pages[0]!.nodes.button_one?.canvas?.groupId;
    expect(groupId).toBeTruthy();
    expect(grouped.project.pages[0]!.nodes.button_two?.canvas?.groupId).toBe(groupId);
    expect(grouped.project.pages[0]!.nodes.root?.children).toEqual(['button_one', 'button_two', 'button_three']);
    expect(grouped.selectedNodeIds).toEqual(['button_one', 'button_two']);

    fireEvent.keyDown(document, { key: 'G', ctrlKey: true, shiftKey: true });

    expect(useProjectStore.getState().project.pages[0]!.nodes.button_one?.canvas?.groupId).toBeUndefined();
    expect(useProjectStore.getState().project.pages[0]!.nodes.button_two?.canvas?.groupId).toBeUndefined();
    expect(useProjectStore.getState().selectedNodeIds).toEqual(['button_one', 'button_two']);
  });

  it('keeps the layer panel selection and canvas selection synchronized', async () => {
    render(<PageOutlinePanel />);

    fireEvent.click(await screen.findByTestId('layer-row-button_one'));

    expect(useProjectStore.getState().selectedNodeIds).toEqual(['button_one']);
    expect(screen.getByTestId('layer-row-button_one')).toHaveClass('active');
  });

  it('updates lock hide and rename state from the layer panel', async () => {
    render(<PageOutlinePanel />);

    fireEvent.click(await screen.findByLabelText('lock-layer-button_one'));
    fireEvent.click(screen.getByLabelText('hide-layer-button_one'));
    fireEvent.change(screen.getByDisplayValue('Primary action'), { target: { value: 'Layer renamed action' } });
    fireEvent.blur(screen.getByDisplayValue('Layer renamed action'));

    const node = useProjectStore.getState().project.pages[0]!.nodes.button_one;
    expect(node?.canvas).toMatchObject({ locked: true, hidden: true });
    expect(node?.name).toBe('Layer renamed action');
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

  it('matches selected canvas node dimensions through store commands', async () => {
    const project: Project = structuredClone(baseProject);
    project.pages[0]!.nodes.button_two = {
      id: 'button_two',
      type: 'Button',
      name: 'Secondary action',
      props: { text: 'Archive', variant: 'default', danger: false },
      canvas: { x: 260, y: 160, width: 260, height: 64, zIndex: 5, parentFrameId: 'frame_page_canvas_default' },
    };
    project.pages[0]!.nodes.root!.children = ['button_one', 'button_two'];
    replaceProject(project);

    const store = useProjectStore.getState();
    store.selectNodes(['button_one', 'button_two']);
    store.matchSelectedNodesSize('both');

    const nodes = useProjectStore.getState().project.pages[0]!.nodes;
    expect(nodes.button_two?.canvas?.width).toBe(180);
    expect(nodes.button_two?.canvas?.height).toBe(48);
  });

  it('nudges selected canvas nodes with arrow keys', async () => {
    render(<AssemblyCanvas />);
    const store = useProjectStore.getState();
    store.selectNodes(['button_one']);

    fireEvent.keyDown(document, { key: 'ArrowRight' });
    fireEvent.keyDown(document, { key: 'ArrowDown', shiftKey: true });

    const canvas = useProjectStore.getState().project.pages[0]!.nodes.button_one?.canvas;
    expect(canvas?.x).toBe(65);
    expect(canvas?.y).toBe(82);
  });

  it('opens a node context menu and updates z-order actions', async () => {
    render(<AssemblyCanvas />);

    const node = await screen.findByTestId('canvas-node-button_one');
    fireEvent.contextMenu(node);

    expect(screen.getByLabelText('context-bring-front')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('context-bring-front'));

    expect(useProjectStore.getState().project.pages[0]!.nodes.button_one?.canvas?.zIndex).toBe(5);

    fireEvent.contextMenu(node);
    fireEvent.click(screen.getByLabelText('context-send-back'));

    expect(useProjectStore.getState().project.pages[0]!.nodes.button_one?.canvas?.zIndex).toBeLessThan(0);
  });

  it('saves selected component props as defaults from the context menu', async () => {
    render(<AssemblyCanvas />);

    const node = await screen.findByTestId('canvas-node-button_one');
    fireEvent.contextMenu(node);
    fireEvent.click(screen.getByLabelText('context-save-default'));

    expect(getComponentDefaultOverrides().Button).toEqual({
      text: 'Create order',
      variant: 'primary',
      danger: false,
    });
    expect(getComponentCanvasOverrides().Button).toEqual({
      width: 180,
      height: 48,
    });
    expect(screen.queryByLabelText('context-save-default')).not.toBeInTheDocument();

    useProjectStore.getState().addComponent('Button');
    const newId = useProjectStore.getState().selectedNodeId!;
    expect(newId).not.toBe('button_one');
    expect(useProjectStore.getState().project.pages[0]!.nodes[newId]?.canvas).toMatchObject({
      width: 180,
      height: 48,
    });
  });

  it('runs context menu copy paste rename lock hide delete and save template actions', async () => {
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('Renamed from menu');
    render(<AssemblyCanvas />);

    const node = await screen.findByTestId('canvas-node-button_one');
    fireEvent.contextMenu(node);
    fireEvent.click(screen.getByLabelText('context-copy'));

    fireEvent.contextMenu(node);
    fireEvent.click(screen.getByLabelText('context-paste'));

    let page = useProjectStore.getState().project.pages[0]!;
    const pastedId = useProjectStore.getState().selectedNodeId!;
    expect(pastedId).not.toBe('button_one');
    expect(page.nodes[pastedId]?.type).toBe('Button');

    fireEvent.contextMenu(screen.getByTestId(`canvas-node-${pastedId}`));
    fireEvent.click(screen.getByLabelText('context-rename'));
    expect(useProjectStore.getState().project.pages[0]!.nodes[pastedId]?.name).toBe('Renamed from menu');

    fireEvent.contextMenu(screen.getByTestId(`canvas-node-${pastedId}`));
    fireEvent.click(screen.getByLabelText('context-lock'));
    expect(useProjectStore.getState().project.pages[0]!.nodes[pastedId]?.canvas?.locked).toBe(true);

	fireEvent.contextMenu(screen.getByTestId(`canvas-node-${pastedId}`));
	fireEvent.click(screen.getByLabelText('context-save-template'));
	expect(screen.getByRole('dialog')).toBeInTheDocument();
	fireEvent.click(screen.getByRole('button', { name: '保存模板' }));
	await waitFor(() => expect(listUserTemplates().length).toBeGreaterThan(0));
	expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.contextMenu(screen.getByTestId(`canvas-node-${pastedId}`));
    fireEvent.click(screen.getByLabelText('context-hide'));
    expect(screen.queryByTestId(`canvas-node-${pastedId}`)).not.toBeInTheDocument();

    useProjectStore.getState().selectNode('button_one');
    fireEvent.contextMenu(screen.getByTestId('canvas-node-button_one'));
    fireEvent.click(screen.getByLabelText('context-delete'));
    page = useProjectStore.getState().project.pages[0]!;
    expect(page.nodes.button_one).toBeUndefined();
    expect(promptSpy).toHaveBeenCalledWith('重命名组件', 'Primary action');
  });

  it('preserves multi-selection when opening the context menu on an already selected node', async () => {
    replaceProject(projectWithThreeButtons());
    render(<AssemblyCanvas />);

    fireEvent.click(await screen.findByTestId('canvas-node-button_one'));
    fireEvent.click(screen.getByTestId('canvas-node-button_two'), { shiftKey: true });
    fireEvent.contextMenu(screen.getByTestId('canvas-node-button_two'));
    fireEvent.click(screen.getByLabelText('context-group'));

    const page = useProjectStore.getState().project.pages[0]!;
    const groupId = page.nodes.button_one?.canvas?.groupId;
    expect(groupId).toBeTruthy();
    expect(page.nodes.button_two?.canvas?.groupId).toBe(groupId);
    expect(page.nodes.root?.children).toEqual(['button_one', 'button_two', 'button_three']);
  });

  it('handles delete undo redo and layer ordering shortcuts without firing inside inputs', async () => {
    replaceProject(projectWithThreeButtons());
    render(<AssemblyCanvas />);

    fireEvent.click(await screen.findByTestId('canvas-node-button_two'));
    fireEvent.keyDown(document, { key: ']', ctrlKey: true });
    expect(useProjectStore.getState().project.pages[0]!.nodes.button_two?.canvas?.zIndex).toBe(6);
    expect(useProjectStore.getState().project.pages[0]!.nodes.button_three?.canvas?.zIndex).toBe(5);

    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
    expect(useProjectStore.getState().project.pages[0]!.nodes.button_two?.canvas?.zIndex).toBe(5);
    expect(useProjectStore.getState().project.pages[0]!.nodes.button_three?.canvas?.zIndex).toBe(6);

    fireEvent.keyDown(document, { key: 'Z', ctrlKey: true, shiftKey: true });
    expect(useProjectStore.getState().project.pages[0]!.nodes.button_two?.canvas?.zIndex).toBe(6);
    expect(useProjectStore.getState().project.pages[0]!.nodes.button_three?.canvas?.zIndex).toBe(5);

    fireEvent.keyDown(document, { key: '[', ctrlKey: true });
    expect(useProjectStore.getState().project.pages[0]!.nodes.button_two?.canvas?.zIndex).toBe(5);

    fireEvent.keyDown(document, { key: ']', ctrlKey: true, shiftKey: true });
    expect(useProjectStore.getState().project.pages[0]!.nodes.button_two?.canvas?.zIndex).toBeGreaterThan(6);

    fireEvent.keyDown(document, { key: '[', ctrlKey: true, shiftKey: true });
    expect(useProjectStore.getState().project.pages[0]!.nodes.button_two?.canvas?.zIndex).toBeLessThan(3);

    fireEvent.keyDown(document, { key: 'Delete' });
    expect(useProjectStore.getState().project.pages[0]!.nodes.button_two).toBeUndefined();

    fireEvent.keyDown(document, { key: 'z', ctrlKey: true });
    expect(useProjectStore.getState().project.pages[0]!.nodes.button_two).toBeDefined();

    fireEvent.keyDown(document, { key: 'Z', ctrlKey: true, shiftKey: true });
    expect(useProjectStore.getState().project.pages[0]!.nodes.button_two).toBeUndefined();

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    fireEvent.keyDown(input, { key: 'z', ctrlKey: true });
    fireEvent.keyDown(input, { key: 'Delete' });

    expect(useProjectStore.getState().project.pages[0]!.nodes.button_two).toBeUndefined();
    input.remove();
  });

  it('deletes and reorders selected canvas nodes as a group', () => {
    replaceProject(projectWithThreeButtons());

    useProjectStore.getState().selectNodes(['button_one', 'button_two']);
    useProjectStore.getState().moveSelectedForward();
    let nodes = useProjectStore.getState().project.pages[0]!.nodes;
    expect(nodes.button_one!.canvas!.zIndex).toBeGreaterThan(nodes.button_three!.canvas!.zIndex);
    expect(nodes.button_two!.canvas!.zIndex).toBeGreaterThan(nodes.button_one!.canvas!.zIndex);

    useProjectStore.getState().bringSelectedToFront();
    nodes = useProjectStore.getState().project.pages[0]!.nodes;
    expect(nodes.button_one?.canvas?.zIndex).toBeGreaterThan(3);
    expect(nodes.button_two?.canvas?.zIndex).toBeGreaterThan(nodes.button_one!.canvas!.zIndex);

    useProjectStore.getState().deleteSelectedNode();
    nodes = useProjectStore.getState().project.pages[0]!.nodes;
    expect(nodes.button_one).toBeUndefined();
    expect(nodes.button_two).toBeUndefined();
    expect(nodes.button_three).toBeDefined();
  });

  it('binds and unbinds selected canvas nodes as a group without wrapping them', () => {
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
    const groupedPage = groupedState.project.pages[0]!;
    const groupId = groupedPage.nodes.button_one?.canvas?.groupId;
    expect(groupId).toBeTruthy();
    expect(groupedPage.nodes.button_two?.canvas?.groupId).toBe(groupId);
    expect(groupedPage.nodes.root?.children).toEqual(['button_one', 'button_two']);
    expect(groupedState.selectedNodeIds).toEqual(['button_one', 'button_two']);

    groupedState.ungroupSelectedNode();

    const ungroupedPage = useProjectStore.getState().project.pages[0]!;
    expect(ungroupedPage.nodes.button_one?.canvas?.groupId).toBeUndefined();
    expect(ungroupedPage.nodes.button_two?.canvas?.groupId).toBeUndefined();
    expect(ungroupedPage.nodes.root?.children).toEqual(['button_one', 'button_two']);
  });

  it('keeps grouped nodes selectable and movable through the binding', () => {
    replaceProject(projectWithThreeButtons());

    useProjectStore.getState().selectNodes(['button_one', 'button_two']);
    useProjectStore.getState().groupSelectedNodes();
    useProjectStore.getState().selectNode('button_one');
    const groupId = useProjectStore.getState().project.pages[0]!.nodes.button_one?.canvas?.groupId;
    const page = useProjectStore.getState().project.pages[0]!;
    const groupedNodeIds = Object.values(page.nodes)
      .filter((node) => node.canvas?.groupId === groupId)
      .map((node) => node.id);
    useProjectStore.getState().selectNodes(groupedNodeIds);
    useProjectStore.getState().moveSelectedCanvasBy('button_one', 12, 10);

    const nodes = useProjectStore.getState().project.pages[0]!.nodes;
    expect(nodes.button_one?.canvas).toMatchObject({ x: 76, y: 82, groupId });
    expect(nodes.button_two?.canvas).toMatchObject({ x: 272, y: 170, groupId });
  });

  it('keeps grouped nodes as individual nodes for template selection', () => {
    replaceProject(projectWithThreeButtons());

    useProjectStore.getState().selectNodes(['button_one', 'button_two']);
    useProjectStore.getState().groupSelectedNodes();
    const groupId = useProjectStore.getState().project.pages[0]!.nodes.button_one?.canvas?.groupId;
    const { project } = useProjectStore.getState();
    const template = createTemplateFromSelection(project, 'page_canvas', 'button_one', {
      name: 'Order action group',
      type: 'group',
      category: '业务模块',
    });
    saveUserTemplate(template);

    expect(listUserTemplates()[0]).toMatchObject({ type: 'group', content: { rootNodeId: 'button_one' } });
    expect(listUserTemplates()[0]!.content.nodes.button_one?.canvas?.groupId).toBe(groupId);
    expect(Object.keys(listUserTemplates()[0]!.content.nodes)).toEqual(['button_one']);
  });

  it('pans the canvas while Space is held without changing project data', async () => {
    render(<AssemblyCanvas />);

    const canvas = (await screen.findByTestId('canvas-page-frame')).closest('.assembly-canvas') as HTMLElement;
    setCanvasViewport(canvas, { scrollLeft: 260, scrollTop: 240, clientWidth: 800, clientHeight: 600 });
    const beforeProject = useProjectStore.getState().project;
    let projectNotifications = 0;
    const unsubscribe = useProjectStore.subscribe(() => {
      projectNotifications += 1;
    });

    fireEvent.keyDown(document, { key: ' ' });
    fireEvent.mouseDown(canvas, { clientX: 320, clientY: 260, button: 0 });
    fireEvent.mouseMove(window, { clientX: 380, clientY: 310 });
    fireEvent.mouseUp(window);
    fireEvent.keyUp(document, { key: ' ' });
    unsubscribe();

    expect(canvas.scrollLeft).toBe(200);
    expect(canvas.scrollTop).toBe(190);
    expect(useProjectStore.getState().project).toBe(beforeProject);
    expect(projectNotifications).toBe(0);
  });

  it('pans instead of moving a node when Space drag starts over a canvas node', async () => {
    render(<AssemblyCanvas />);

    const node = await screen.findByTestId('canvas-node-button_one');
    const canvas = node.closest('.assembly-canvas') as HTMLElement;
    setCanvasViewport(canvas, { scrollLeft: 260, scrollTop: 240, clientWidth: 800, clientHeight: 600 });
    const beforeProject = useProjectStore.getState().project;

    fireEvent.keyDown(document, { key: ' ' });
    fireEvent.mouseDown(node, { clientX: 320, clientY: 260, button: 0 });
    fireEvent.mouseMove(window, { clientX: 380, clientY: 310 });
    fireEvent.mouseUp(window);
    fireEvent.keyUp(document, { key: ' ' });

    expect(canvas.scrollLeft).toBe(200);
    expect(canvas.scrollTop).toBe(190);
    expect(useProjectStore.getState().project).toBe(beforeProject);
    expect(useProjectStore.getState().project.pages[0]!.nodes.button_one?.canvas).toMatchObject({ x: 64, y: 72 });
  });

  it('pans the canvas with middle mouse drag without selecting nodes or changing project data', async () => {
    render(<AssemblyCanvas />);

    const canvas = (await screen.findByTestId('canvas-page-frame')).closest('.assembly-canvas') as HTMLElement;
    setCanvasViewport(canvas, { scrollLeft: 320, scrollTop: 300, clientWidth: 800, clientHeight: 600 });
    const beforeProject = useProjectStore.getState().project;

    fireEvent.mouseDown(canvas, { clientX: 420, clientY: 360, button: 1 });
    fireEvent.mouseMove(window, { clientX: 390, clientY: 330 });
    fireEvent.mouseUp(window);

    expect(canvas.scrollLeft).toBe(350);
    expect(canvas.scrollTop).toBe(330);
    expect(useProjectStore.getState().selectedNodeId).toBe('root');
    expect(useProjectStore.getState().project).toBe(beforeProject);
  });

  it('keeps Ctrl or Cmd wheel zoom as viewport-only editor state', async () => {
    render(<AssemblyCanvas />);

    const canvas = (await screen.findByTestId('canvas-page-frame')).closest('.assembly-canvas') as HTMLElement;
    const beforeProject = useProjectStore.getState().project;

    const zoomInEvent = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -120, ctrlKey: true });
    canvas.dispatchEvent(zoomInEvent);

    expect(zoomInEvent.defaultPrevented).toBe(true);
    expect(useCanvasViewportStore.getState().zoom).toBe(1.08);
    expect(useProjectStore.getState().project).toBe(beforeProject);

    const zoomOutEvent = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 120, metaKey: true });
    canvas.dispatchEvent(zoomOutEvent);

    expect(zoomOutEvent.defaultPrevented).toBe(true);
    expect(useCanvasViewportStore.getState().zoom).toBe(1);
    expect(useProjectStore.getState().project).toBe(beforeProject);
  });

  it('centers the active page frame with Home without changing project data', async () => {
    render(<AssemblyCanvas />);

    const canvas = (await screen.findByTestId('canvas-page-frame')).closest('.assembly-canvas') as HTMLElement;
    setCanvasViewport(canvas, { scrollLeft: 0, scrollTop: 0, clientWidth: 800, clientHeight: 600 });
    const beforeProject = useProjectStore.getState().project;

    fireEvent.keyDown(document, { key: 'Home' });

    expect(canvas.scrollLeft).toBe(360);
    expect(canvas.scrollTop).toBe(240);
    expect(useProjectStore.getState().project).toBe(beforeProject);
  });

  it('fits the active page frame into the middle canvas viewport on first display', async () => {
    const clientWidthSpy = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function width(this: HTMLElement) {
      return this.classList.contains('assembly-canvas') ? 800 : 0;
    });
    const clientHeightSpy = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function height(this: HTMLElement) {
      return this.classList.contains('assembly-canvas') ? 600 : 0;
    });

    render(<AssemblyCanvas />);

    const canvas = (await screen.findByTestId('canvas-page-frame')).closest('.assembly-canvas') as HTMLElement;

    await waitFor(() => expect(useCanvasViewportStore.getState().zoom).toBe(0.59));
    expect(canvas.scrollLeft).toBe(48);
    expect(canvas.scrollTop).toBe(19);
    clientWidthSpy.mockRestore();
    clientHeightSpy.mockRestore();
  });

  it('suppresses Space pan and Home canvas shortcuts while editing form controls', async () => {
    render(<AssemblyCanvas />);

    const canvas = (await screen.findByTestId('canvas-page-frame')).closest('.assembly-canvas') as HTMLElement;
    setCanvasViewport(canvas, { scrollLeft: 260, scrollTop: 240, clientWidth: 800, clientHeight: 600 });
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    fireEvent.keyDown(input, { key: ' ' });
    fireEvent.mouseDown(canvas, { clientX: 320, clientY: 260, button: 0 });
    fireEvent.mouseMove(window, { clientX: 380, clientY: 310 });
    fireEvent.mouseUp(window);
    fireEvent.keyDown(input, { key: 'Home' });

    expect(canvas.scrollLeft).toBe(260);
    expect(canvas.scrollTop).toBe(240);

    input.remove();
  });
});
