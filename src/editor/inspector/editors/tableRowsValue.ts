import type { JsonRecord, JsonValue } from '../../../domain/types';

export function asRows(value: JsonValue | undefined): JsonRecord[] {
  return Array.isArray(value) ? (value.filter((item): item is JsonRecord => Boolean(item) && typeof item === 'object' && !Array.isArray(item)) as JsonRecord[]) : [];
}
