import type { JsonRecord } from '../domain/types';
import type { ComponentPreset } from '../registry/types/componentPreset';
import {
  clearComponentLibraryStorage,
  loadComponentLibraryState,
  overrideRecordToProps,
  saveComponentLibraryState,
  type ComponentLibraryState,
  type RecentLibraryItem,
  type RecentLibraryItemKind,
} from '../storage/componentLibraryStorage';

let state: ComponentLibraryState = loadComponentLibraryState();
const maxRecentItems = 50;

function persist(next: ComponentLibraryState) {
  state = next;
  saveComponentLibraryState(state);
}

export function getComponentDefaultOverrides(): Record<string, JsonRecord> {
  return overrideRecordToProps(state.overrides);
}

export function getComponentLibraryOverrides() {
  return structuredClone(state.overrides);
}

export function saveComponentDefaultProps(componentType: string, defaultProps: JsonRecord, updatedAt = new Date().toISOString()): void {
  persist({
    ...state,
    overrides: {
      ...state.overrides,
      [componentType]: {
        componentType,
        defaultProps: structuredClone(defaultProps),
        updatedAt,
      },
    },
  });
  recordRecentLibraryItem({
    kind: 'userComponent',
    sourceId: componentType,
    name: componentType,
    category: 'User component',
    usedAt: updatedAt,
  });
}

export function restoreComponentDefaultProps(componentType: string): void {
  const overrides = { ...state.overrides };
  delete overrides[componentType];
  persist({ ...state, overrides });
}

export function listComponentPresets(): ComponentPreset[] {
  return structuredClone(state.presets);
}

export function saveComponentPreset(preset: ComponentPreset): void {
  persist({
    ...state,
    presets: [...state.presets.filter((item) => item.id !== preset.id), structuredClone(preset)],
  });
  recordRecentLibraryItem({
    kind: 'componentPreset',
    sourceId: preset.id,
    name: preset.name,
    category: preset.category,
    description: preset.description,
    usedAt: preset.updatedAt,
  });
}

export type RecordRecentLibraryItemInput = {
  kind: RecentLibraryItemKind;
  sourceId: string;
  name: string;
  category?: string | undefined;
  description?: string | undefined;
  usedAt?: string | undefined;
};

function recentId(kind: RecentLibraryItemKind, sourceId: string): string {
  return `${kind}:${sourceId}`;
}

function sortRecentItems(items: RecentLibraryItem[]): RecentLibraryItem[] {
  return [...items].sort((left, right) => right.usedAt.localeCompare(left.usedAt));
}

export function recordRecentLibraryItem(input: RecordRecentLibraryItemInput): RecentLibraryItem {
  const usedAt = input.usedAt ?? new Date().toISOString();
  const id = recentId(input.kind, input.sourceId);
  const existing = state.recent.find((item) => item.id === id);
  const nextItem: RecentLibraryItem = {
    id,
    kind: input.kind,
    sourceId: input.sourceId,
    name: input.name,
    ...(input.category ? { category: input.category } : {}),
    ...(input.description ? { description: input.description } : {}),
    usedAt,
    useCount: (existing?.useCount ?? 0) + 1,
    favorite: existing?.favorite ?? false,
  };
  persist({
    ...state,
    recent: sortRecentItems([nextItem, ...state.recent.filter((item) => item.id !== id)]).slice(0, maxRecentItems),
  });
  return structuredClone(nextItem);
}

export function listRecentLibraryItems(): RecentLibraryItem[] {
  return structuredClone(sortRecentItems(state.recent));
}

export function clearRecentLibraryItems(): void {
  persist({ ...state, recent: [] });
}

export function toggleRecentLibraryFavorite(itemId: string, favorite?: boolean): RecentLibraryItem | undefined {
  let updated: RecentLibraryItem | undefined;
  const recent = state.recent.map((item) => {
    if (item.id !== itemId) return item;
    updated = { ...item, favorite: favorite ?? !item.favorite };
    return updated;
  });
  persist({ ...state, recent });
  return updated ? structuredClone(updated) : undefined;
}

export function reloadComponentLibraryState(): void {
  state = loadComponentLibraryState();
}

export function clearComponentLibraryState(): void {
  clearComponentLibraryStorage();
  state = { overrides: {}, presets: [], recent: [] };
}
