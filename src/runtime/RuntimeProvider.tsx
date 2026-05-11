import { useMemo, useState, type ReactNode } from 'react';
import type { Project } from '../domain/types';
import { runInteraction } from '../interactions/runner';
import { RuntimeContext, type RuntimeContextValue } from './runtimeContext';
import { createRuntimeState, isRuntimeNodeDisabled, isRuntimeNodeVisible } from './runtimeState';

function latestScrollRequest(state: ReturnType<typeof createRuntimeState>, nodeId: string) {
  for (let index = state.scrollRequests.length - 1; index >= 0; index -= 1) {
    const request = state.scrollRequests[index];
    if (request?.targetNodeId === nodeId) return request;
  }
  return undefined;
}

export function RuntimeProvider({ project, initialPageId, children }: { project: Project; initialPageId: string; children: ReactNode }) {
  const stateKey = `${project.id}:${project.updatedAt}:${initialPageId}`;
  const [runtime, setRuntime] = useState(() => ({ key: stateKey, state: createRuntimeState(project, initialPageId) }));
  const state = runtime.key === stateKey ? runtime.state : createRuntimeState(project, initialPageId);

  const value = useMemo<RuntimeContextValue>(
    () => ({
      state,
      dispatch: (event) =>
        setRuntime((current) => {
          const currentState = current.key === stateKey ? current.state : createRuntimeState(project, initialPageId);
          return { key: stateKey, state: runInteraction(project, currentState, event) };
        }),
      getData: (dataSourceId) => state.data[dataSourceId] ?? [],
      isNodeOpen: (nodeId) => state.openNodes.includes(nodeId),
      isNodeVisible: (nodeId) => isRuntimeNodeVisible(state, nodeId),
      isNodeDisabled: (nodeId) => isRuntimeNodeDisabled(state, nodeId),
      getNodeProps: (nodeId) => state.nodeProps[nodeId] ?? {},
      getFormValues: (nodeId) => state.forms[nodeId] ?? {},
      getActiveTab: (nodeId) => state.activeTabs[nodeId],
      getLatestScrollRequest: (nodeId) => latestScrollRequest(state, nodeId),
    }),
    [initialPageId, project, state, stateKey],
  );

  return <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>;
}
