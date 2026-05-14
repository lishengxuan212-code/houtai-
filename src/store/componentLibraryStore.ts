import type { JsonRecord } from '../domain/types';
import type { ComponentPreset } from '../registry/types/componentPreset';
import {
  clearComponentLibraryStorage,
  componentLibraryStorageKey,
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
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('component-library-state-change'));
}

export function getComponentDefaultOverrides(): Record<string, JsonRecord> {
  return overrideRecordToProps(state.overrides);
}

export function getComponentLibraryOverrides() {
  return structuredClone(state.overrides);
}

export function getComponentCanvasOverrides(): Record<string, { width: number; height: number }> {
  return structuredClone(state.canvasOverrides ?? {});
}

export function getComponentDefaultCanvas(componentType: string): { width: number; height: number } | undefined {
  const canvas = state.canvasOverrides?.[componentType];
  return canvas ? structuredClone(canvas) : undefined;
}

export function getComponentNameOverrides(): Record<string, string> {
  return structuredClone(state.nameOverrides ?? {});
}

export function getComponentDisplayName(componentType: string, fallback: string): string {
  return state.nameOverrides?.[componentType] || fallback;
}

export function getActiveComponentLibraryGroupLabel(): string | undefined {
  return state.ui.activeLibraryGroupLabel;
}

export function saveActiveComponentLibraryGroupLabel(groupLabel: string): void {
  persist({ ...state, ui: { ...state.ui, activeLibraryGroupLabel: groupLabel } });
}

export function saveComponentNameOverride(componentType: string, name: string): void {
  const nextName = name.trim();
  const nameOverrides = { ...(state.nameOverrides ?? {}) };
  if (nextName) nameOverrides[componentType] = nextName;
  else delete nameOverrides[componentType];
  persist({ ...state, nameOverrides });
}

export function restoreComponentNameOverride(componentType: string): void {
  const nameOverrides = { ...(state.nameOverrides ?? {}) };
  delete nameOverrides[componentType];
  persist({ ...state, nameOverrides });
}

export function saveComponentDefaultProps(
  componentType: string,
  defaultProps: JsonRecord,
  updatedAt = new Date().toISOString(),
  defaultCanvas?: { width: number; height: number } | undefined,
): void {
  const canvasOverrides = { ...(state.canvasOverrides ?? {}) };
  if (defaultCanvas) {
    canvasOverrides[componentType] = {
      width: Math.max(1, Math.round(defaultCanvas.width)),
      height: Math.max(1, Math.round(defaultCanvas.height)),
    };
  }
  persist({
    ...state,
    canvasOverrides,
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
  const canvasOverrides = { ...(state.canvasOverrides ?? {}) };
  delete overrides[componentType];
  delete canvasOverrides[componentType];
  persist({ ...state, overrides, canvasOverrides });
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
  return [...items].sort((left, right) => {
    if (left.favorite && right.favorite) {
      return (left.favoriteAt ?? left.usedAt).localeCompare(right.favoriteAt ?? right.usedAt);
    }
    if (left.favorite !== right.favorite) return left.favorite ? -1 : 1;
    return right.usedAt.localeCompare(left.usedAt);
  });
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
    ...(existing?.favoriteAt ? { favoriteAt: existing.favoriteAt } : {}),
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
    const nextFavorite = favorite ?? !item.favorite;
    if (nextFavorite) {
      updated = { ...item, favorite: true, favoriteAt: item.favoriteAt ?? new Date().toISOString() };
    } else {
      const { favoriteAt: _favoriteAt, ...rest } = item;
      void _favoriteAt;
      updated = { ...rest, favorite: false };
    }
    return updated;
  });
  persist({ ...state, recent: sortRecentItems(recent) });
  return updated ? structuredClone(updated) : undefined;
}

export function reloadComponentLibraryState(): void {
  state = loadComponentLibraryState();
}

export function clearComponentLibraryState(): void {
  clearComponentLibraryStorage();
  state = { overrides: {}, nameOverrides: {}, canvasOverrides: {}, presets: [], recent: [], ui: {} };
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== componentLibraryStorageKey) return;
    state = loadComponentLibraryState();
    window.dispatchEvent(new CustomEvent('component-library-state-change'));
  });
}
