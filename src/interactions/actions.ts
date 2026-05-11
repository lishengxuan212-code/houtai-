import type { Action, JsonRecord, JsonValue, Project } from '../domain/types';
import type { RuntimeState } from '../runtime/runtimeState';
import { setRuntimeNodeDisabled, setRuntimeNodeVisible, toggleRuntimeNodeDisabled, toggleRuntimeNodeVisible } from '../runtime/runtimeState';
import { filterRecords, submitMock } from '../runtime/mockData';
import { resolvePageId } from '../runtime/navigation';
import { resolveValue } from './conditions';

export type RuntimeEvent = {
  componentId: string;
  event: 'click' | 'submit' | 'change' | 'rowClick' | 'search' | 'openChange' | 'select';
  payload?: JsonRecord;
};

export function reorderInteractionActions<TAction extends Action>(actions: readonly TAction[], fromIndex: number, toIndex: number): TAction[] {
  const next = [...actions];
  if (fromIndex < 0 || fromIndex >= next.length) return next;
  const [removed] = next.splice(fromIndex, 1);
  if (!removed) return next;
  const targetIndex = Math.min(Math.max(toIndex, 0), next.length);
  next.splice(targetIndex, 0, removed);
  return next;
}

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
    nodeVisibility: { ...state.nodeVisibility },
    nodeDisabled: { ...state.nodeDisabled },
    nodeProps: { ...state.nodeProps },
    activeTabs: { ...state.activeTabs },
    scrollRequests: [...state.scrollRequests],
  };

  switch (action.type) {
    case 'openModal':
    case 'openDrawer':
      if (!next.openNodes.includes(action.targetNodeId)) next.openNodes.push(action.targetNodeId);
      return next;
    case 'closeModal':
    case 'closeDrawer':
      next.openNodes = next.openNodes.filter((nodeId) => nodeId !== action.targetNodeId);
      return next;
    case 'showNode':
      return setRuntimeNodeVisible(next, action.targetNodeId, true);
    case 'hideNode':
      return setRuntimeNodeVisible(next, action.targetNodeId, false);
    case 'toggleNodeVisibility':
      return toggleRuntimeNodeVisible(next, action.targetNodeId);
    case 'enableNode':
      return setRuntimeNodeDisabled(next, action.targetNodeId, false);
    case 'disableNode':
      return setRuntimeNodeDisabled(next, action.targetNodeId, true);
    case 'toggleNodeDisabled':
      return toggleRuntimeNodeDisabled(next, action.targetNodeId);
    case 'navigate':
    case 'navigateToPage': {
      const pageId = resolvePageId(project, action.targetPageId);
      if (pageId) next.currentPageId = pageId;
      return next;
    }
    case 'setVariable':
      next.variables[action.variableId] = resolveValue(action.value, { state: next, event: event.payload });
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
    case 'setNodeProp':
      next.nodeProps[action.targetNodeId] = {
        ...(next.nodeProps[action.targetNodeId] ?? {}),
        [action.propKey]: resolveValue(action.value, { state: next, event: event.payload }),
      };
      return next;
    case 'setFormValue':
      next.forms[action.targetNodeId] = {
        ...(next.forms[action.targetNodeId] ?? {}),
        [action.field]: resolveValue(action.value, { state: next, event: event.payload }),
      };
      return next;
    case 'resetForm':
      next.forms[action.targetNodeId] = {};
      return next;
    case 'selectTab':
      next.activeTabs[action.targetNodeId] = action.tabKey;
      return next;
    case 'scrollToNode':
      next.scrollRequests.push({ id: `scroll_${Date.now().toString(36)}_${next.scrollRequests.length}`, targetNodeId: action.targetNodeId });
      return next;
    case 'submitMock': {
      const payload = action.payloadFrom === 'currentRow' ? toRecord(next.currentRow ?? event.payload?.row ?? {}) : toRecord(event.payload?.values ?? {});
      next.data[action.dataSourceId] = submitMock(next.data[action.dataSourceId] ?? [], payload, action.operation);
      return next;
    }
  }
}
