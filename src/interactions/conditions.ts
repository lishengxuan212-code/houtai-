import type { Condition, JsonRecord, JsonValue, ValueRef } from '../domain/types';
import type { RuntimeState } from '../runtime/runtimeState';

type ConditionContext = {
  state: RuntimeState;
  event: JsonRecord | undefined;
};

function readPath(source: unknown, path = ''): JsonValue {
  if (!path) return (source ?? null) as JsonValue;
  if (path.includes('__proto__') || path.includes('constructor') || path.includes('prototype')) return null;
  return path.split('.').reduce<unknown>((current, part) => {
    if (current && typeof current === 'object' && part in current) return (current as Record<string, unknown>)[part];
    return null;
  }, source) as JsonValue;
}

export function resolveValue(ref: ValueRef, context: ConditionContext): JsonValue {
  switch (ref.kind) {
    case 'literal':
      return ref.value;
    case 'variable':
      return context.state.variables[ref.variableId] ?? null;
    case 'event':
      return readPath(context.event, ref.path);
    case 'form':
      return readPath(context.state.forms[ref.formId], ref.path);
    case 'currentRow':
      return readPath(context.state.currentRow, ref.path);
  }
}

function isEmpty(value: JsonValue): boolean {
  return value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

export function evaluateCondition(condition: Condition, context: ConditionContext): boolean {
  const left = resolveValue(condition.left, context);
  const right = condition.right ? resolveValue(condition.right, context) : null;
  switch (condition.operator) {
    case 'eq':
      return left === right;
    case 'neq':
      return left !== right;
    case 'gt':
      return Number(left) > Number(right);
    case 'gte':
      return Number(left) >= Number(right);
    case 'lt':
      return Number(left) < Number(right);
    case 'lte':
      return Number(left) <= Number(right);
    case 'contains':
      return String(left ?? '').includes(String(right ?? ''));
    case 'in':
      return Array.isArray(right) && right.includes(left);
    case 'empty':
      return isEmpty(left);
    case 'notEmpty':
      return !isEmpty(left);
  }
}

export function conditionsPass(conditions: Condition[] | undefined, context: ConditionContext): boolean {
  return (conditions ?? []).every((condition) => evaluateCondition(condition, context));
}
