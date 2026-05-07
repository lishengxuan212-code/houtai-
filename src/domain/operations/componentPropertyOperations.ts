import type { JsonRecord, JsonValue } from '../types';

function pathParts(path: string | readonly (string | number)[]): (string | number)[] {
  const parts = typeof path === 'string' ? path.split('.').filter(Boolean) : [...path];
  return parts[0] === 'props' || parts[0] === 'content' || parts[0] === 'data' || parts[0] === 'events' ? parts.slice(1) : parts;
}

function cloneContainer(value: JsonValue | undefined, nextKey: string | number): JsonRecord | JsonValue[] {
  if (Array.isArray(value)) return [...value];
  if (value && typeof value === 'object') return { ...value };
  return typeof nextKey === 'number' || /^\d+$/.test(String(nextKey)) ? [] : {};
}

function normalizeKey(key: string | number): string | number {
  return typeof key === 'string' && /^\d+$/.test(key) ? Number(key) : key;
}

export function setValueAtPropPath(props: JsonRecord, path: string | readonly (string | number)[], value: JsonValue): JsonRecord {
  const parts = pathParts(path).map(normalizeKey);
  if (parts.length === 0) return structuredClone(props);

  const next = structuredClone(props);
  let cursor: JsonRecord | JsonValue[] = next;
  for (let index = 0; index < parts.length; index += 1) {
    const key = parts[index]!;
    const isLast = index === parts.length - 1;
    if (isLast) {
      if (Array.isArray(cursor) && typeof key === 'number') cursor[key] = structuredClone(value);
      if (!Array.isArray(cursor) && typeof key === 'string') cursor[key] = structuredClone(value);
      continue;
    }

    const nextKey = parts[index + 1]!;
    const current = Array.isArray(cursor) && typeof key === 'number' ? cursor[key] : !Array.isArray(cursor) && typeof key === 'string' ? cursor[key] : undefined;
    const child = cloneContainer(current, nextKey);
    if (Array.isArray(cursor) && typeof key === 'number') cursor[key] = child;
    if (!Array.isArray(cursor) && typeof key === 'string') cursor[key] = child;
    cursor = child;
  }
  return next;
}

export function setNestedNodeProp(props: JsonRecord, path: readonly (string | number)[], value: JsonValue): JsonRecord {
  return setValueAtPropPath(props, path, value);
}

export function getValueAtPropPath(props: JsonRecord, path: string | readonly (string | number)[]): JsonValue | undefined {
  const parts = pathParts(path).map(normalizeKey);
  let cursor: JsonValue | undefined = props;
  for (const key of parts) {
    if (Array.isArray(cursor) && typeof key === 'number') {
      cursor = cursor[key];
    } else if (cursor && typeof cursor === 'object' && !Array.isArray(cursor) && typeof key === 'string') {
      cursor = cursor[key];
    } else {
      return undefined;
    }
  }
  return cursor;
}
