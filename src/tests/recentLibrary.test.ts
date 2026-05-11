import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearComponentLibraryState,
  clearRecentLibraryItems,
  listRecentLibraryItems,
  recordRecentLibraryItem,
  reloadComponentLibraryState,
  toggleRecentLibraryFavorite,
} from '../store/componentLibraryStore';

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  clearComponentLibraryState();
});

describe('recent library items', () => {
  it('records recent use for library item families', () => {
    recordRecentLibraryItem({ kind: 'antDesignComponent', sourceId: 'Button', name: 'Button', usedAt: '2026-05-08T00:00:00.000Z' });
    recordRecentLibraryItem({ kind: 'proComponent', sourceId: 'pro.ProTable', name: 'ProTable', usedAt: '2026-05-08T00:01:00.000Z' });
    recordRecentLibraryItem({ kind: 'prototypeWidget', sourceId: 'StickyNote', name: 'Sticky Note', usedAt: '2026-05-08T00:02:00.000Z' });
    recordRecentLibraryItem({ kind: 'userComponent', sourceId: 'Button', name: 'Custom Button', usedAt: '2026-05-08T00:03:00.000Z' });
    recordRecentLibraryItem({ kind: 'componentPreset', sourceId: 'preset_1', name: 'Preset', usedAt: '2026-05-08T00:04:00.000Z' });
    recordRecentLibraryItem({ kind: 'componentTemplate', sourceId: 'template_1', name: 'Component Template', usedAt: '2026-05-08T00:05:00.000Z' });
    recordRecentLibraryItem({ kind: 'groupTemplate', sourceId: 'template_2', name: 'Group Template', usedAt: '2026-05-08T00:06:00.000Z' });
    recordRecentLibraryItem({ kind: 'pageTemplate', sourceId: 'template_3', name: 'Page Template', usedAt: '2026-05-08T00:07:00.000Z' });

    expect(listRecentLibraryItems().map((item) => item.kind).sort()).toEqual([
      'antDesignComponent',
      'componentPreset',
      'componentTemplate',
      'groupTemplate',
      'pageTemplate',
      'proComponent',
      'prototypeWidget',
      'userComponent',
    ]);
  });

  it('dedupes repeated use and updates usedAt and useCount', () => {
    recordRecentLibraryItem({ kind: 'antDesignComponent', sourceId: 'Button', name: 'Button', usedAt: '2026-05-08T00:00:00.000Z' });
    recordRecentLibraryItem({ kind: 'antDesignComponent', sourceId: 'Button', name: 'Button', usedAt: '2026-05-08T00:05:00.000Z' });

    expect(listRecentLibraryItems()).toMatchObject([{ sourceId: 'Button', usedAt: '2026-05-08T00:05:00.000Z', useCount: 2 }]);
  });

  it('keeps the newest 50 items', () => {
    for (let index = 0; index < 55; index += 1) {
      recordRecentLibraryItem({
        kind: 'componentTemplate',
        sourceId: `template_${index}`,
        name: `Template ${index}`,
        usedAt: `2026-05-08T00:${String(index).padStart(2, '0')}:00.000Z`,
      });
    }

    const items = listRecentLibraryItems();
    expect(items).toHaveLength(50);
    expect(items[0]?.sourceId).toBe('template_54');
    expect(items.at(-1)?.sourceId).toBe('template_5');
  });

  it('clears recent items', () => {
    recordRecentLibraryItem({ kind: 'pageTemplate', sourceId: 'template_1', name: 'Page Template' });
    clearRecentLibraryItems();

    expect(listRecentLibraryItems()).toEqual([]);
  });

  it('toggles favorite state without resetting useCount', () => {
    const item = recordRecentLibraryItem({ kind: 'componentPreset', sourceId: 'preset_1', name: 'Preset' });
    toggleRecentLibraryFavorite(item.id, true);

    expect(listRecentLibraryItems()[0]).toMatchObject({ favorite: true, useCount: 1 });
  });

  it('persists recent items across store reloads', () => {
    recordRecentLibraryItem({ kind: 'pageTemplate', sourceId: 'template_1', name: 'Page Template', usedAt: '2026-05-08T00:00:00.000Z' });
    reloadComponentLibraryState();

    expect(listRecentLibraryItems()).toMatchObject([{ sourceId: 'template_1', name: 'Page Template', useCount: 1 }]);
  });
});
