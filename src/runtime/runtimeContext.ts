import { createContext, useContext } from 'react';
import type { JsonRecord } from '../domain/types';
import type { RuntimeEvent } from '../interactions/actions';
import type { RuntimeState } from './runtimeState';

export type RuntimeContextValue = {
  state: RuntimeState;
  dispatch: (event: RuntimeEvent) => void;
  getData: (dataSourceId: string) => JsonRecord[];
  isNodeOpen: (nodeId: string) => boolean;
  isNodeVisible: (nodeId: string) => boolean;
  isNodeDisabled: (nodeId: string) => boolean;
  getNodeProps: (nodeId: string) => JsonRecord;
  getFormValues: (nodeId: string) => JsonRecord;
  getActiveTab: (nodeId: string) => string | undefined;
  getLatestScrollRequest: (nodeId: string) => { id: string; targetNodeId: string } | undefined;
};

export const RuntimeContext = createContext<RuntimeContextValue | null>(null);

export function useRuntime() {
  const context = useContext(RuntimeContext);
  if (!context) throw new Error('useRuntime must be used within RuntimeProvider');
  return context;
}
