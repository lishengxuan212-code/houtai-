import type { JsonRecord, JsonValue } from '../../domain/types';

function isEditableItem(value: JsonValue): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function patchScalarProp(_props: JsonRecord, propKey: string, value: string): JsonRecord {
  return { [propKey]: value };
}

export function patchArrayItemLabel(
  props: JsonRecord,
  arrayProp: string,
  itemKey: string,
  labelKey: string,
  value: string,
): JsonRecord {
  const items = props[arrayProp];
  if (!Array.isArray(items)) return {};
  let changed = false;
  const next = items.map((item) => {
    if (labelKey === '' && typeof item === 'string' && item === itemKey) {
      changed = true;
      return value;
    }
    if (!isEditableItem(item) || item.key !== itemKey) return item;
    changed = true;
    return { ...item, [labelKey]: value };
  });
  return changed ? { [arrayProp]: next as JsonValue } : {};
}
