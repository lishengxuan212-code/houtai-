import { fireEvent, render } from '@testing-library/react';
import { createElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecentLibraryPanel } from '../editor/library/RecentLibraryPanel';
import {
  clearComponentLibraryState,
  clearRecentLibraryItems,
  listRecentLibraryItems,
  recordRecentLibraryItem,
  reloadComponentLibraryState,
  saveComponentNameOverride,
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

  it('keeps favorites ordered by earliest favorite time when recently used again', () => {
    recordRecentLibraryItem({ kind: 'antDesignComponent', sourceId: 'Button', name: 'Button', usedAt: '2026-05-08T00:00:00.000Z' });
    recordRecentLibraryItem({ kind: 'antDesignComponent', sourceId: 'Input', name: 'Input', usedAt: '2026-05-08T00:01:00.000Z' });
    recordRecentLibraryItem({ kind: 'antDesignComponent', sourceId: 'Table', name: 'Table', usedAt: '2026-05-08T00:02:00.000Z' });

    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-05-08T01:00:00.000Z'));
      toggleRecentLibraryFavorite(listRecentLibraryItems().find((item) => item.sourceId === 'Input')!.id, true);
      vi.setSystemTime(new Date('2026-05-08T01:05:00.000Z'));
      toggleRecentLibraryFavorite(listRecentLibraryItems().find((item) => item.sourceId === 'Button')!.id, true);
    } finally {
      vi.useRealTimers();
    }

    expect(listRecentLibraryItems().map((item) => item.sourceId)).toEqual(['Input', 'Button', 'Table']);

    recordRecentLibraryItem({ kind: 'antDesignComponent', sourceId: 'Button', name: 'Button', usedAt: '2026-05-08T02:00:00.000Z' });

    expect(listRecentLibraryItems().map((item) => item.sourceId)).toEqual(['Input', 'Button', 'Table']);
    expect(listRecentLibraryItems()[0]).toMatchObject({ sourceId: 'Input', favoriteAt: '2026-05-08T01:00:00.000Z' });
  });

  it('persists recent items across store reloads', () => {
    recordRecentLibraryItem({ kind: 'pageTemplate', sourceId: 'template_1', name: 'Page Template', usedAt: '2026-05-08T00:00:00.000Z' });
    reloadComponentLibraryState();

    expect(listRecentLibraryItems()).toMatchObject([{ sourceId: 'template_1', name: 'Page Template', useCount: 1 }]);
  });

  it('drags recent component items into the canvas protocol', () => {
    recordRecentLibraryItem({ kind: 'antDesignComponent', sourceId: 'Button', name: '按钮', usedAt: '2026-05-08T00:00:00.000Z' });
    const { container } = render(createElement(RecentLibraryPanel));

    const setData = vi.fn();
    fireEvent.dragStart(container.querySelector('.recent-icon-tile')!, {
      dataTransfer: {
        setData,
        effectAllowed: '',
      },
    });

    expect(setData).toHaveBeenCalledWith('application/x-admin-component', 'Button');
  });

  it('refreshes recent order after dragging finishes', () => {
    recordRecentLibraryItem({ kind: 'antDesignComponent', sourceId: 'Button', name: 'Button', usedAt: '2026-05-08T00:00:00.000Z' });
    recordRecentLibraryItem({ kind: 'antDesignComponent', sourceId: 'Input', name: 'Input', usedAt: '2026-05-08T00:01:00.000Z' });
    const { container } = render(createElement(RecentLibraryPanel));
    const titles = () => Array.from(container.querySelectorAll('.recent-icon-title')).map((item) => item.textContent);
    const initialTitles = titles();
    const secondTile = container.querySelectorAll('.recent-icon-tile')[1]!;

    fireEvent.dragStart(secondTile, {
      dataTransfer: {
        setData: vi.fn(),
        effectAllowed: '',
      },
    });
    expect(titles()).toEqual(initialTitles);

    fireEvent.dragEnd(secondTile);

    expect(titles()).toEqual([initialTitles[1], initialTitles[0]]);
  });

  it('shows renamed component names in recent items', () => {
    recordRecentLibraryItem({ kind: 'antDesignComponent', sourceId: 'AutoComplete', name: '自动完成', usedAt: '2026-05-08T00:00:00.000Z' });
    saveComponentNameOverride('AutoComplete', '下拉输入框');

    const { container } = render(createElement(RecentLibraryPanel));

    expect(container.textContent).toContain('下拉输入框');
    expect(container.textContent).not.toContain('自动完成');
  });

  it('does not add recent components by clicking the preview tile', () => {
    recordRecentLibraryItem({ kind: 'antDesignComponent', sourceId: 'Button', name: '按钮', usedAt: '2026-05-08T00:00:00.000Z' });
    const { container } = render(createElement(RecentLibraryPanel));

    fireEvent.click(container.querySelector('.recent-preview-button')!);

    expect(listRecentLibraryItems()[0]).toMatchObject({ sourceId: 'Button', useCount: 1 });
  });
});
