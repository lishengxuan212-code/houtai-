import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHistoryEntry, mergeConsecutiveTextEdits } from '../domain/history';
import type { Project } from '../domain/types';
import { flushScheduledProjectSave, PROJECT_SAVE_IDLE_MS, scheduleProjectSave } from '../store/persistence';

const storage = new Map<string, string>();

const project: Project = {
  id: 'project_persistence_perf',
  name: 'Persistence perf',
  version: 1,
  createdAt: '2026-05-07T00:00:00.000Z',
  updatedAt: '2026-05-07T00:00:00.000Z',
  pages: [],
  dataSources: [],
  variables: [],
  interactions: [],
};

describe('persistence and history performance', () => {
  beforeEach(() => {
    vi.useFakeTimers();
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
  });

  afterEach(() => {
    flushScheduledProjectSave();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('debounces repeated scheduled project saves', () => {
    scheduleProjectSave({ ...project, name: 'first' });
    scheduleProjectSave({ ...project, name: 'second' });
    scheduleProjectSave({ ...project, name: 'third' });

    expect(localStorage.getItem('admin-prototype-studio.project')).toBeNull();

    vi.advanceTimersByTime(PROJECT_SAVE_IDLE_MS - 1);
    expect(localStorage.getItem('admin-prototype-studio.project')).toBeNull();

    vi.advanceTimersByTime(1);

    const saved = JSON.parse(localStorage.getItem('admin-prototype-studio.project') ?? '{}') as Project;
    expect(saved.name).toBe('third');
  });

  it('stores history as operations and inverse operations instead of snapshots', () => {
    const entry = createHistoryEntry({
      id: 'history_1',
      label: 'Move node',
      operations: [{ type: 'updateNodeCanvas', pageId: 'page', nodeId: 'node', canvas: { x: 10, y: 12 } }],
      inverseOperations: [{ type: 'updateNodeCanvas', pageId: 'page', nodeId: 'node', canvas: { x: 0, y: 0 } }],
      createdAt: '2026-05-07T00:00:00.000Z',
    });

    expect(entry).toMatchObject({
      id: 'history_1',
      label: 'Move node',
      operations: [{ type: 'updateNodeCanvas' }],
      inverseOperations: [{ type: 'updateNodeCanvas' }],
    });
    expect('project' in entry).toBe(false);
  });

  it('coalesces consecutive text edits for the same node', () => {
    const entries = mergeConsecutiveTextEdits([
      createHistoryEntry({
        id: 'edit_1',
        label: 'Edit text',
        operations: [{ type: 'updateNodeProps', pageId: 'page', nodeId: 'node', props: { text: 'A' } }],
        inverseOperations: [{ type: 'updateNodeProps', pageId: 'page', nodeId: 'node', props: { text: '' } }],
      }),
      createHistoryEntry({
        id: 'edit_2',
        label: 'Edit text',
        operations: [{ type: 'updateNodeProps', pageId: 'page', nodeId: 'node', props: { text: 'AB' } }],
        inverseOperations: [{ type: 'updateNodeProps', pageId: 'page', nodeId: 'node', props: { text: 'A' } }],
      }),
    ]);

    expect(entries).toHaveLength(1);
    expect(entries[0]?.operations[0]).toMatchObject({ type: 'updateNodeProps', props: { text: 'AB' } });
    expect(entries[0]?.inverseOperations[0]).toMatchObject({ type: 'updateNodeProps', props: { text: '' } });
  });
});
