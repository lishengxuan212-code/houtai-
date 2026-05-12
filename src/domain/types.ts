export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonRecord = Record<string, JsonValue>;

export type BusinessType = 'blank' | 'ecommerce' | 'crm' | 'approval' | 'cms' | 'user_permission' | 'dashboard' | 'custom';
export type ComponentCategory = 'layout' | 'data' | 'form' | 'feedback' | 'navigation' | 'business';
export type ComponentEvent = 'click' | 'submit' | 'change' | 'rowClick' | 'search' | 'openChange' | 'select';

export type ContainerLayoutConfig =
    | { mode: 'stack'; gap?: number; align?: 'left' | 'center' | 'right' | 'stretch'; justify?: 'top' | 'center' | 'bottom' }
    | { mode: 'row'; gap?: number; wrap?: boolean; align?: 'top' | 'center' | 'bottom' | 'stretch'; justify?: 'left' | 'center' | 'right' | 'between' }
    | { mode: 'grid'; gap?: number; columns: number; columnWidths?: number[]; align?: 'top' | 'center' | 'bottom' | 'stretch'; justify?: 'left' | 'center' | 'right' | 'stretch' }
    | { mode: 'free'; gap?: number; snapToGrid?: boolean; gridSize?: number; height?: number };

export type NodeLayoutConfig = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export type NodeCanvasConfig = {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  locked?: boolean;
  hidden?: boolean;
  rotation?: number;
  parentFrameId?: string;
};

export type ComponentSemantic = {
  moduleName?: string;
  moduleType?: string;
  description?: string;
};

export type ComponentRuntimeConfig = {
  initialVisible?: boolean;
  initialDisabled?: boolean;
};

export type PageFrameBackground = {
  color?: string;
  imageUrl?: string;
  opacity?: number;
  metadata?: JsonRecord;
};

export type PageFrame = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  background?: PageFrameBackground;
};

export type Binding = {
  source: 'variable' | 'dataSource' | 'field' | 'event';
  path: string;
};

export type EditableProp =
  | { key: string; label: string; control: 'text'; placeholder?: string }
  | { key: string; label: string; control: 'textarea'; placeholder?: string }
  | { key: string; label: string; control: 'number'; min?: number; max?: number }
  | { key: string; label: string; control: 'boolean' }
  | { key: string; label: string; control: 'select'; options: { label: string; value: string }[] }
  | { key: string; label: string; control: 'json'; hint?: string };

export type ComponentDescriptor = {
  type: string;
  displayName: string;
  category: ComponentCategory;
  defaultProps: JsonRecord;
  editableProps: EditableProp[];
  supportedEvents: ComponentEvent[];
  allowedChildren?: string[];
  canHaveChildren?: boolean;
};

export type ComponentNode = {
  id: string;
  type: string;
  name: string;
  props: JsonRecord;
  content?: JsonRecord;
  data?: JsonRecord;
  events?: Record<string, JsonRecord>;
  canvas?: NodeCanvasConfig;
  semantic?: ComponentSemantic;
  runtime?: ComponentRuntimeConfig;
  layout?: NodeLayoutConfig;
  containerLayout?: ContainerLayoutConfig;
  children?: string[];
  bindings?: Record<string, Binding>;
  meta?: {
    locked?: boolean;
    hiddenInEditor?: boolean;
  };
};

export type FieldConfig = {
  id?: string;
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'money' | 'status';
  required?: boolean;
  options?: string[];
};

export type DataSource = {
  id: string;
  name: string;
  type: 'static' | 'mock';
  fields: FieldConfig[];
  records: JsonRecord[];
};

export type Variable = {
  id: string;
  name: string;
  scope: 'project' | 'page' | 'runtime';
  value: JsonValue;
};

export type Trigger = {
  componentId: string;
  event: ComponentEvent;
};

export type ValueRef =
  | { kind: 'literal'; value: JsonValue }
  | { kind: 'variable'; variableId: string }
  | { kind: 'event'; path: string }
  | { kind: 'form'; formId: string; path?: string }
  | { kind: 'currentRow'; path?: string };

export type Condition = {
  left: ValueRef;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'empty' | 'notEmpty';
  right?: ValueRef;
};

export type Action =
  | { type: 'openModal'; targetNodeId: string }
  | { type: 'closeModal'; targetNodeId: string }
  | { type: 'openDrawer'; targetNodeId: string }
  | { type: 'closeDrawer'; targetNodeId: string }
  | { type: 'showNode'; targetNodeId: string }
  | { type: 'hideNode'; targetNodeId: string }
  | { type: 'toggleNodeVisibility'; targetNodeId: string }
  | { type: 'enableNode'; targetNodeId: string }
  | { type: 'disableNode'; targetNodeId: string }
  | { type: 'toggleNodeDisabled'; targetNodeId: string }
  | { type: 'navigate'; targetPageId: string }
  | { type: 'navigateToPage'; targetPageId: string }
  | { type: 'setVariable'; variableId: string; value: ValueRef }
  | { type: 'refreshData'; dataSourceId: string }
  | { type: 'showMessage'; level: 'success' | 'info' | 'warning' | 'error'; message: string }
  | { type: 'setNodeProp'; targetNodeId: string; propKey: string; value: ValueRef }
  | { type: 'setFormValue'; targetNodeId: string; field: string; value: ValueRef }
  | { type: 'resetForm'; targetNodeId: string }
  | { type: 'selectTab'; targetNodeId: string; tabKey: string }
  | { type: 'scrollToNode'; targetNodeId: string }
  | { type: 'submitMock'; dataSourceId: string; payloadFrom: 'form' | 'currentRow'; operation?: 'create' | 'update' | 'delete' };

export type Interaction = {
  id: string;
  name: string;
  trigger: Trigger;
  conditions?: Condition[];
  actions: Action[];
  enabled: boolean;
};

export type Page = {
  id: string;
  name: string;
  route: string;
  purpose?: string;
  frames?: PageFrame[];
  rootNodeId: string;
  nodes: Record<string, ComponentNode>;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  businessType?: BusinessType;
  pages: Page[];
  dataSources: DataSource[];
  variables: Variable[];
  interactions: Interaction[];
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectSummary = {
  id: string;
  name: string;
  description?: string;
  businessType: BusinessType;
  createdAt: string;
  updatedAt: string;
  pageCount: number;
  canvasSize?: {
    width: number;
    height: number;
  };
  templateSourceId?: string;
};

export type Operation =
  | { type: 'addNode'; pageId: string; parentNodeId: string; node: ComponentNode }
    | { type: 'updateNodeName'; pageId: string; nodeId: string; name: string }
    | { type: 'updateNodeProps'; pageId: string; nodeId: string; props: JsonRecord }
  | { type: 'updateNodeContent'; pageId: string; nodeId: string; content: JsonRecord }
  | { type: 'updateNodeData'; pageId: string; nodeId: string; data: JsonRecord }
  | { type: 'updateNodeEvents'; pageId: string; nodeId: string; events: Record<string, JsonRecord> }
  | { type: 'updateNodeSemantic'; pageId: string; nodeId: string; semantic: ComponentSemantic }
  | { type: 'updateNodeRuntime'; pageId: string; nodeId: string; runtime: ComponentRuntimeConfig }
  | { type: 'replaceNodesWithComponent'; pageId: string; sourceNodeIds: string[]; node: ComponentNode }
  | { type: 'cloneNodes'; pageId: string; parentNodeId: string; nodeIds: string[]; offset?: { x: number; y: number }; targetFrameId?: string; placeAtHighestLayer?: boolean }
  | { type: 'updateNodeLayerOrder'; pageId: string; frameId: string; orderedNodeIds: string[] }
  | { type: 'groupNodes'; pageId: string; parentNodeId: string; groupNode: ComponentNode; childNodeIds: string[] }
  | { type: 'ungroupNode'; pageId: string; groupNodeId: string }
  | { type: 'alignNodes'; pageId: string; nodeIds: string[]; alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' }
  | { type: 'distributeNodes'; pageId: string; nodeIds: string[]; direction: 'horizontal' | 'vertical' }
  | { type: 'updateNodeCanvas'; pageId: string; nodeId: string; canvas: Partial<NodeCanvasConfig> }
  | { type: 'assignNodeToFrame'; pageId: string; nodeId: string; frameId: string }
  | { type: 'setNodeCanvasLocked'; pageId: string; nodeId: string; locked: boolean }
  | { type: 'setNodeCanvasHidden'; pageId: string; nodeId: string; hidden: boolean }
  | { type: 'updateNodeLayout'; pageId: string; nodeId: string; layout: NodeLayoutConfig }
  | { type: 'updateContainerLayout'; pageId: string; nodeId: string; layout: ContainerLayoutConfig }
  | { type: 'deleteNode'; pageId: string; nodeId: string }
    | { type: 'moveNode'; pageId: string; parentNodeId: string; nodeId: string; direction: 'up' | 'down' }
    | { type: 'reorderNode'; pageId: string; parentNodeId: string; nodeId: string; targetNodeId: string; position?: 'before' | 'after' }
    | { type: 'reorderNodeToIndex'; pageId: string; parentNodeId: string; nodeId: string; targetIndex: number }
    | { type: 'moveNodeToParent'; pageId: string; nodeId: string; newParentNodeId: string }
  | { type: 'addInteraction'; interaction: Interaction }
  | { type: 'updateInteraction'; interactionId: string; patch: Partial<Interaction> }
  | { type: 'deleteInteraction'; interactionId: string }
  | { type: 'updateDataSourceFields'; dataSourceId: string; fields: FieldConfig[] }
  | { type: 'updateDataSourceRecords'; dataSourceId: string; records: JsonRecord[] }
  | { type: 'renameDataSourceFieldKey'; dataSourceId: string; fromKey: string; toKey: string }
  | { type: 'addPageFrame'; pageId: string; frame: PageFrame }
  | { type: 'updatePageFrame'; pageId: string; frameId: string; patch: Partial<PageFrame> }
  | { type: 'addPage'; page: Page }
  | { type: 'updatePage'; pageId: string; patch: Partial<Page> };

export type AiSuggestion = {
  id: string;
  severity: 'info' | 'warning' | 'error';
  category: 'interaction' | 'schema' | 'flow' | 'content' | 'best_practice';
  title: string;
  description: string;
  affectedNodeIds?: string[];
  affectedInteractionIds?: string[];
  operations?: Operation[];
  canApplyAutomatically: boolean;
};
