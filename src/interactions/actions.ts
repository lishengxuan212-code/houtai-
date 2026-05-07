import type { Action, JsonRecord, JsonValue, Project } from '../domain/types';
import type { RuntimeState } from '../runtime/runtimeState';
import { filterRecords, submitMock } from '../runtime/mockData';
import { resolvePageId } from '../runtime/navigation';
import { resolveValue } from './conditions';

export type RuntimeEvent = {
  componentId: string;
  event: 'click' | 'submit' | 'change' | 'rowClick' | 'search' | 'openChange' | 'select';
  payload?: JsonRecord;
};

function toRecord(value: JsonValue): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : {};
}

export function executeAction(project: Project, state: RuntimeState, action: Action, event: RuntimeEvent): RuntimeState {
  const next: RuntimeState = {
    ...state,
    variables: { ...state.variables },
    data: { ...state.data },
    forms: { ...state.forms },
    openNodes: [...state.openNodes],
    messages: [...state.messages],
    refreshCount: { ...state.refreshCount },
  };

  switch (action.type) {
    case 'openModal':
      if (!next.openNodes.includes(action.targetNodeId)) next.openNodes.push(action.targetNodeId);
      return next;
    case 'closeModal':
      next.openNodes = next.openNodes.filter((nodeId) => nodeId !== action.targetNodeId);
      return next;
    case 'navigate': {
      const pageId = resolvePageId(project, action.targetPageId);
      if (pageId) next.currentPageId = pageId;
      return next;
    }
    case 'setVariable':
      next.variables[action.variableId] = resolveValue(action.value, { state, event: event.payload });
      return next;
    case 'refreshData': {
      const query = toRecord(next.variables.var_search_params ?? {});
      const source = project.dataSources.find((item) => item.id === action.dataSourceId);
      const base = next.data[action.dataSourceId] ?? source?.records ?? [];
      next.data[action.dataSourceId] = filterRecords(base, query);
      next.refreshCount[action.dataSourceId] = (next.refreshCount[action.dataSourceId] ?? 0) + 1;
      return next;
    }
    case 'showMessage':
      next.messages.push({ id: `message_${Date.now().toString(36)}_${next.messages.length}`, level: action.level, message: action.message });
      return next;
    case 'resetForm':
      next.forms[action.targetNodeId] = {};
      return next;
    case 'submitMock': {
      const payload = action.payloadFrom === 'currentRow' ? toRecord(next.currentRow ?? event.payload?.row ?? {}) : toRecord(event.payload?.values ?? {});
      next.data[action.dataSourceId] = submitMock(next.data[action.dataSourceId] ?? [], payload, action.operation);
      return next;
    }
  }
}
