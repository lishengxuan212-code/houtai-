import type { JsonRecord } from '../domain/types';

function normalizeSearchValue(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export function filterRecords(records: JsonRecord[], query: JsonRecord): JsonRecord[] {
  const entries = Object.entries(query).filter(([, value]) => normalizeSearchValue(value));
  if (entries.length === 0) return records;
  return records.filter((record) =>
    entries.every(([key, value]) => normalizeSearchValue(record[key]).includes(normalizeSearchValue(value))),
  );
}

export function submitMock(records: JsonRecord[], payload: JsonRecord, operation: 'create' | 'update' | 'delete' = 'create'): JsonRecord[] {
  if (operation === 'delete') {
    const id = payload.id;
    return records.filter((record) => record.id !== id);
  }
  if (operation === 'update') {
    return records.map((record) => (record.id === payload.id ? { ...record, ...payload } : record));
  }
  return [{ id: `mock_${Date.now().toString(36)}`, ...payload }, ...records];
}
