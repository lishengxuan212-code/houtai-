import type { ReactNode } from 'react';
import type { ComponentNode, JsonRecord } from '../../domain/types';

export type RendererMode = 'edit' | 'preview';

export type RenderEvent = {
  componentId: string;
  event: 'click' | 'submit' | 'change' | 'rowClick' | 'search' | 'openChange' | 'select';
  payload?: JsonRecord;
};

export type RendererContext = {
  mode: RendererMode;
  isNodeOpen?: (nodeId: string) => boolean;
  isNodeVisible?: (nodeId: string) => boolean;
  isNodeDisabled?: (nodeId: string) => boolean;
  getNodeProps?: (nodeId: string) => JsonRecord;
  getFormValues?: (nodeId: string) => JsonRecord;
  getActiveTab?: (nodeId: string) => string | undefined;
  getLatestScrollRequest?: (nodeId: string) => { id: string; targetNodeId: string } | undefined;
  getData?: (dataSourceId: string) => JsonRecord[];
  dispatch?: (event: RenderEvent) => void;
  selectInteractionTarget?: (componentId: string) => void;
  reorderNodeToIndex?: (nodeId: string, parentNodeId: string, targetIndex: number) => void;
  inlineEdit?: {
    text: (args: { node: ComponentNode; propKey: string; value: string }) => ReactNode;
    arrayItemText: (args: { node: ComponentNode; arrayProp: string; itemKey: string; labelKey: string; value: string }) => ReactNode;
    tableCellText?: (args: { node: ComponentNode; rowIndex: number; columnKey: string; value: string; row: JsonRecord }) => ReactNode;
  };
};

export type NodeRendererProps = {
  node: ComponentNode;
  children?: ReactNode;
  context: RendererContext;
};
