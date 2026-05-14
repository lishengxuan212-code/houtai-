import type { JsonRecord } from '../domain/types';
import type { ComponentPreset } from '../registry/types/componentPreset';
import type { ComponentLibraryOverride } from '../registry/types/componentDefinition';

export const componentLibraryStorageKey = 'admin-prototype-studio-component-library';

export type RecentLibraryItemKind =
  | 'antDesignComponent'
  | 'proComponent'
  | 'prototypeWidget'
  | 'userComponent'
  | 'componentPreset'
  | 'componentTemplate'
  | 'groupTemplate'
  | 'pageTemplate';

export type RecentLibraryItem = {
  id: string;
  kind: RecentLibraryItemKind;
  sourceId: string;
  name: string;
  category?: string;
  description?: string;
  usedAt: string;
  useCount: number;
  favorite: boolean;
  favoriteAt?: string;
};

export type ComponentLibraryState = {
  overrides: Record<string, ComponentLibraryOverride>;
  nameOverrides: Record<string, string>;
  canvasOverrides: Record<string, { width: number; height: number }>;
  presets: ComponentPreset[];
  recent: RecentLibraryItem[];
  ui: {
    activeLibraryGroupLabel?: string;
  };
};

const emptyState: ComponentLibraryState = {
  overrides: {},
  nameOverrides: {},
  canvasOverrides: {},
  presets: [],
  recent: [],
  ui: {},
};

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function loadComponentLibraryState(): ComponentLibraryState {
  if (!canUseStorage()) return structuredClone(emptyState);
  const raw = window.localStorage.getItem(componentLibraryStorageKey);
  if (!raw) return structuredClone(emptyState);
  try {
    const parsed = JSON.parse(raw) as ComponentLibraryState;
    return {
      overrides: parsed.overrides ?? {},
      nameOverrides: parsed.nameOverrides ?? {},
      canvasOverrides: parsed.canvasOverrides ?? {},
      presets: parsed.presets ?? [],
      ui: parsed.ui ?? {},
      recent: (parsed.recent ?? []).map((item) => ({
        ...item,
        ...(item.favorite && !item.favoriteAt ? { favoriteAt: item.usedAt } : {}),
      })),
    };
  } catch {
    return structuredClone(emptyState);
  }
}

export function saveComponentLibraryState(state: ComponentLibraryState): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(componentLibraryStorageKey, JSON.stringify(state));
}

export function clearComponentLibraryStorage(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(componentLibraryStorageKey);
}

export function overrideRecordToProps(overrides: Record<string, ComponentLibraryOverride>): Record<string, JsonRecord> {
  return Object.fromEntries(Object.entries(overrides).map(([type, override]) => [type, override.defaultProps]));
}
