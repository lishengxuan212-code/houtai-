import type { JsonRecord } from '../domain/types';
import type { ComponentPreset } from '../registry/types/componentPreset';
import type { ComponentLibraryOverride } from '../registry/types/componentDefinition';

const storageKey = 'admin-prototype-studio-component-library';

export type ComponentLibraryState = {
  overrides: Record<string, ComponentLibraryOverride>;
  presets: ComponentPreset[];
};

const emptyState: ComponentLibraryState = {
  overrides: {},
  presets: [],
};

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

export function loadComponentLibraryState(): ComponentLibraryState {
  if (!canUseStorage()) return structuredClone(emptyState);
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return structuredClone(emptyState);
  try {
    const parsed = JSON.parse(raw) as ComponentLibraryState;
    return { overrides: parsed.overrides ?? {}, presets: parsed.presets ?? [] };
  } catch {
    return structuredClone(emptyState);
  }
}

export function saveComponentLibraryState(state: ComponentLibraryState): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

export function clearComponentLibraryStorage(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(storageKey);
}

export function overrideRecordToProps(overrides: Record<string, ComponentLibraryOverride>): Record<string, JsonRecord> {
  return Object.fromEntries(Object.entries(overrides).map(([type, override]) => [type, override.defaultProps]));
}
