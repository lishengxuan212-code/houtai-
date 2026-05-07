import type { JsonRecord } from '../domain/types';
import type { ComponentPreset } from '../registry/types/componentPreset';
import { clearComponentLibraryStorage, loadComponentLibraryState, overrideRecordToProps, saveComponentLibraryState, type ComponentLibraryState } from '../storage/componentLibraryStorage';

let state: ComponentLibraryState = loadComponentLibraryState();

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
}

export function clearComponentLibraryState(): void {
  clearComponentLibraryStorage();
  state = { overrides: {}, presets: [] };
}
