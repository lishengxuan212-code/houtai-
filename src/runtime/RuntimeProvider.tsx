import { useMemo, useState, type ReactNode } from 'react';
import type { Project } from '../domain/types';
import { runInteraction } from '../interactions/runner';
import { RuntimeContext, type RuntimeContextValue } from './runtimeContext';
import { createRuntimeState } from './runtimeState';

export function RuntimeProvider({ project, initialPageId, children }: { project: Project; initialPageId: string; children: ReactNode }) {
  const [state, setState] = useState(() => createRuntimeState(project, initialPageId));
  const value = useMemo<RuntimeContextValue>(
    () => ({
      state,
      dispatch: (event) => setState((current) => runInteraction(project, current, event)),
      getData: (dataSourceId) => state.data[dataSourceId] ?? [],
      isNodeOpen: (nodeId) => state.openNodes.includes(nodeId),
    }),
    [project, state],
  );

  return <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>;
}
