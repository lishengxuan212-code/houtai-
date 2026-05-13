import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  AI_MODEL_DEFAULT_SETTINGS_STORAGE_KEY,
  defaultAiModelSettings,
  loadAiModelDefaultSettings,
  saveAiModelDefaultSettings,
  type AiModelSettings,
} from '../ai/modelSettings';

const configuredSettings: AiModelSettings = {
  visionStructure: {
    ...defaultAiModelSettings.visionStructure,
    apiUrl: 'https://example.test/chat',
    apiKey: 'structure-key',
    model: 'qwen3.6-plus',
  },
  visionEmbedding: {
    ...defaultAiModelSettings.visionEmbedding,
    apiUrl: 'https://example.test/embeddings',
    apiKey: 'embedding-key',
    model: 'embedding-model',
  },
};

beforeEach(() => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    get length() {
      return values.size;
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  });
});

afterEach(() => {
  globalThis.localStorage.clear();
});

describe('AI model default settings', () => {
  it('saves and loads the full default model settings including api keys', () => {
    saveAiModelDefaultSettings(configuredSettings);

    expect(localStorage.getItem(AI_MODEL_DEFAULT_SETTINGS_STORAGE_KEY)).toContain('structure-key');
    expect(loadAiModelDefaultSettings()).toEqual(configuredSettings);
  });

  it('falls back to built-in defaults when no saved default exists', () => {
    expect(loadAiModelDefaultSettings()).toEqual(defaultAiModelSettings);
  });
});
