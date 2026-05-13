import { setValueAtPropPath } from '../../domain/operations/componentPropertyOperations';
import type { ComponentNode, JsonRecord, JsonValue } from '../../domain/types';

function isEditableItem(value: JsonValue): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function patchScalarProp(_props: JsonRecord, propKey: string, value: string): JsonRecord {
  return { [propKey]: value };
}

export function patchScopedText(node: ComponentNode, propKey: string, value: string): { scope: 'props' | 'content'; patch: JsonRecord } {
  if (propKey.startsWith('content.')) {
    return { scope: 'content', patch: setValueAtPropPath(node.content ?? {}, propKey, value) };
  }
  return { scope: 'props', patch: patchScalarProp(node.props, propKey, value) };
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
    if (typeof item === 'string' && item === itemKey && labelKey === 'title') {
      changed = true;
      return { key: item, title: value };
    }
    if (!isEditableItem(item) || item.key !== itemKey) return item;
    changed = true;
    return { ...item, [labelKey]: value };
  });
  return changed ? { [arrayProp]: next as JsonValue } : {};
}

export function patchScopedArrayItemLabel(
  node: ComponentNode,
  arrayProp: string,
  itemKey: string,
  labelKey: string,
  value: string,
): { scope: 'props' | 'content'; patch: JsonRecord } {
  if (Array.isArray(node.content?.[arrayProp])) {
    return { scope: 'content', patch: patchArrayItemLabel(node.content, arrayProp, itemKey, labelKey, value) };
  }
  return { scope: 'props', patch: patchArrayItemLabel(node.props, arrayProp, itemKey, labelKey, value) };
}

export function patchTableCell(rows: JsonValue | undefined, rowIndex: number, columnKey: string, value: string, fallbackRow: JsonRecord = {}): JsonRecord[] {
  const rowItems = Array.isArray(rows) ? rows : [];
  const nextRows = Array.from({ length: Math.max(rowItems.length, rowIndex + 1) }, (_, index) => {
    const row = rowItems[index];
    const editableRow = row !== undefined && isEditableItem(row);
    if (index !== rowIndex || !editableRow) return editableRow ? row : index === rowIndex ? fallbackRow : {};
    return { ...row, [columnKey]: value };
  });
  if (nextRows[rowIndex] === undefined || !isEditableItem(nextRows[rowIndex])) nextRows[rowIndex] = {};
  nextRows[rowIndex] = { ...nextRows[rowIndex], [columnKey]: value };
  return nextRows;
}
