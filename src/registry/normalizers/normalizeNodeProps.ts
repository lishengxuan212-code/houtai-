import type { JsonRecord, JsonValue } from '../../domain/types';

function isRecord(value: JsonValue | undefined): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function cloneJson<T extends JsonValue>(value: T): T {
  return structuredClone(value);
}

export function mergeJsonRecords(base: JsonRecord, patch: JsonRecord = {}): JsonRecord {
  const next = cloneJson(base);
  for (const [key, value] of Object.entries(patch)) {
    const current = next[key];
    if (isRecord(current) && isRecord(value)) {
      next[key] = mergeJsonRecords(current, value);
    } else {
      next[key] = cloneJson(value);
    }
  }
  return next;
}

export function normalizeNodeProps(defaultProps: JsonRecord, instanceProps: JsonRecord = {}): JsonRecord {
  return mergeJsonRecords(defaultProps, instanceProps);
}
