import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project } from '../domain/types';
import { PropertyPanel } from '../editor/PropertyPanel';
import { PageOutlinePanel } from '../editor/workbench/PageOutlinePanel';
import { exportPlainPrd } from '../export/plainPrd';
import { RuntimeProvider } from '../runtime/RuntimeProvider';
import { RuntimeRenderer } from '../runtime/RuntimeRenderer';
import { useProjectStore } from '../store/projectStore';

const storage = new Map<string, string>();

const project: Project = {
  id: 'project_inspector_state',
  name: 'Inspector state project',
  version: 1,
  createdAt: '2026-05-08T00:00:00.000+08:00',
  updatedAt: '2026-05-08T00:00:00.000+08:00',
  variables: [],
  dataSources: [],
  interactions: [],
  pages: [
    {
      id: 'page_main',
      name: 'Orders',
      route: '/orders',
      rootNodeId: 'root',
      frames: [{ id: 'frame_main', name: 'Orders frame', x: 0, y: 0, width: 960, height: 640, zIndex: 1 }],
      nodes: {
        root: { id: 'root', type: 'PageContainer', name: 'Root', props: {}, children: ['button_one'] },
        button_one: {
          id: 'button_one',
          type: 'Button',
          name: 'Create order',
          props: { text: 'Create order', variant: 'primary', danger: false },
          semantic: { moduleName: 'Create order' },
          canvas: { x: 64, y: 72, width: 180, height: 48, zIndex: 3, parentFrameId: 'frame_main' },
        },
      },
    },
  ],
};

function replaceProject() {
  useProjectStore.getState().replaceProject(structuredClone(project), 'page_main', 'button_one');
}

function changeNumber(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe('inspector state panel', () => {
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

  it('updates canvas placement layer lock visibility runtime defaults and name from the property panel', () => {
    const { unmount } = render(<PropertyPanel />);

    fireEvent.change(screen.getByLabelText('inspector-component-name'), { target: { value: 'Inspector renamed action' } });
    changeNumber('inspector-x', '96');
    changeNumber('inspector-y', '112');
    changeNumber('inspector-width', '240');
    changeNumber('inspector-height', '64');
    changeNumber('inspector-z-index', '9');
    fireEvent.click(screen.getByLabelText('inspector-locked'));
    fireEvent.click(screen.getByLabelText('inspector-editor-visible'));
    fireEvent.click(screen.getByLabelText('inspector-preview-initial-visible'));
    fireEvent.click(screen.getByLabelText('inspector-preview-initial-enabled'));

    const node = useProjectStore.getState().project.pages[0]!.nodes.button_one!;
    expect(node.name).toBe('Inspector renamed action');
    expect(node.semantic?.moduleName).toBe('Inspector renamed action');
    expect(node.canvas).toMatchObject({ x: 96, y: 112, width: 240, height: 64, zIndex: 9, locked: true, hidden: true });
    expect(node.runtime).toMatchObject({ initialVisible: false, initialDisabled: true });

    unmount();
    render(<PageOutlinePanel />);
    expect(screen.getByDisplayValue('Inspector renamed action')).toBeInTheDocument();
  });

  it('uses inspector name and preview defaults in PRD export and runtime preview', () => {
    render(<PropertyPanel />);

    fireEvent.change(screen.getByLabelText('inspector-component-name'), { target: { value: 'PRD visible action' } });
    fireEvent.click(screen.getByLabelText('inspector-preview-initial-visible'));
    fireEvent.click(screen.getByLabelText('inspector-preview-initial-enabled'));

    const nextProject = useProjectStore.getState().project;
    expect(exportPlainPrd(nextProject)).toContain('PRD visible action');

    render(
      <RuntimeProvider project={nextProject} initialPageId="page_main">
        <RuntimeRenderer project={nextProject} />
      </RuntimeProvider>,
    );

    expect(screen.queryByRole('button', { name: 'Create order' })).not.toBeInTheDocument();
  });
});
