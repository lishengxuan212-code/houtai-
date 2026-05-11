import { z } from 'zod';

const jsonSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonSchema), z.record(z.string(), jsonSchema)]),
);

export const JsonValueSchema = jsonSchema;
export const JsonRecordSchema = z.record(z.string(), jsonSchema);

export const BindingSchema = z.object({
  source: z.enum(['variable', 'dataSource', 'field', 'event']),
  path: z.string(),
});

export const EditablePropSchema = z.discriminatedUnion('control', [
  z.object({ key: z.string(), label: z.string(), control: z.literal('text'), placeholder: z.string().optional() }),
  z.object({ key: z.string(), label: z.string(), control: z.literal('textarea'), placeholder: z.string().optional() }),
  z.object({ key: z.string(), label: z.string(), control: z.literal('number'), min: z.number().optional(), max: z.number().optional() }),
  z.object({ key: z.string(), label: z.string(), control: z.literal('boolean') }),
  z.object({ key: z.string(), label: z.string(), control: z.literal('select'), options: z.array(z.object({ label: z.string(), value: z.string() })) }),
  z.object({ key: z.string(), label: z.string(), control: z.literal('json'), hint: z.string().optional() }),
]);

export const ComponentEventSchema = z.enum(['click', 'submit', 'change', 'rowClick', 'search', 'openChange', 'select']);

export const ContainerLayoutSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('stack'),
    gap: z.number().optional(),
    align: z.enum(['left', 'center', 'right', 'stretch']).optional(),
    justify: z.enum(['top', 'center', 'bottom']).optional(),
  }),
  z.object({
    mode: z.literal('row'),
    gap: z.number().optional(),
    wrap: z.boolean().optional(),
    align: z.enum(['top', 'center', 'bottom', 'stretch']).optional(),
    justify: z.enum(['left', 'center', 'right', 'between']).optional(),
  }),
  z.object({
    mode: z.literal('grid'),
    gap: z.number().optional(),
    columns: z.number(),
    columnWidths: z.array(z.number()).optional(),
    align: z.enum(['top', 'center', 'bottom', 'stretch']).optional(),
    justify: z.enum(['left', 'center', 'right', 'stretch']).optional(),
  }),
  z.object({ mode: z.literal('free'), gap: z.number().optional(), snapToGrid: z.boolean().optional(), gridSize: z.number().optional(), height: z.number().optional() }),
]);

export const NodeLayoutSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const NodeCanvasSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  zIndex: z.number(),
  locked: z.boolean().optional(),
  hidden: z.boolean().optional(),
  rotation: z.number().optional(),
  parentFrameId: z.string().optional(),
});

export const ComponentSemanticSchema = z.object({
  moduleName: z.string().optional(),
  moduleType: z.string().optional(),
  description: z.string().optional(),
});

export const ComponentRuntimeSchema = z.object({
  initialVisible: z.boolean().optional(),
  initialDisabled: z.boolean().optional(),
});

export const PageFrameBackgroundSchema = z.object({
  color: z.string().optional(),
  imageUrl: z.string().optional(),
  opacity: z.number().optional(),
  metadata: JsonRecordSchema.optional(),
});

export const PageFrameSchema = z.object({
  id: z.string(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  zIndex: z.number(),
  background: PageFrameBackgroundSchema.optional(),
});

export const ComponentDescriptorSchema = z.object({
  type: z.string(),
  displayName: z.string(),
  category: z.enum(['layout', 'data', 'form', 'feedback', 'navigation', 'business']),
  defaultProps: JsonRecordSchema,
  editableProps: z.array(EditablePropSchema),
  supportedEvents: z.array(ComponentEventSchema),
  allowedChildren: z.array(z.string()).optional(),
  canHaveChildren: z.boolean().optional(),
});

export const ComponentNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  props: JsonRecordSchema,
  content: JsonRecordSchema.optional(),
  data: JsonRecordSchema.optional(),
  events: z.record(z.string(), JsonRecordSchema).optional(),
  canvas: NodeCanvasSchema.optional(),
  semantic: ComponentSemanticSchema.optional(),
  runtime: ComponentRuntimeSchema.optional(),
  layout: NodeLayoutSchema.optional(),
  containerLayout: ContainerLayoutSchema.optional(),
  children: z.array(z.string()).optional(),
  bindings: z.record(z.string(), BindingSchema).optional(),
  meta: z
    .object({
      locked: z.boolean().optional(),
      hiddenInEditor: z.boolean().optional(),
    })
    .optional(),
});

export const FieldConfigSchema = z.object({
  id: z.string().optional(),
  key: z.string(),
  label: z.string(),
  type: z.enum(['text', 'number', 'select', 'date', 'money', 'status']),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
});

export const DataSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['static', 'mock']),
  fields: z.array(FieldConfigSchema),
  records: z.array(JsonRecordSchema),
});

export const VariableSchema = z.object({
  id: z.string(),
  name: z.string(),
  scope: z.enum(['project', 'page', 'runtime']),
  value: JsonValueSchema,
});

export const TriggerSchema = z.object({
  componentId: z.string(),
  event: ComponentEventSchema,
});

export const ValueRefSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('literal'), value: JsonValueSchema }),
  z.object({ kind: z.literal('variable'), variableId: z.string() }),
  z.object({ kind: z.literal('event'), path: z.string() }),
  z.object({ kind: z.literal('form'), formId: z.string(), path: z.string().optional() }),
  z.object({ kind: z.literal('currentRow'), path: z.string().optional() }),
]);

export const ConditionSchema = z.object({
  left: ValueRefSchema,
  operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'in', 'empty', 'notEmpty']),
  right: ValueRefSchema.optional(),
});

export const ActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('openModal'), targetNodeId: z.string() }),
  z.object({ type: z.literal('closeModal'), targetNodeId: z.string() }),
  z.object({ type: z.literal('openDrawer'), targetNodeId: z.string() }),
  z.object({ type: z.literal('closeDrawer'), targetNodeId: z.string() }),
  z.object({ type: z.literal('showNode'), targetNodeId: z.string() }),
  z.object({ type: z.literal('hideNode'), targetNodeId: z.string() }),
  z.object({ type: z.literal('toggleNodeVisibility'), targetNodeId: z.string() }),
  z.object({ type: z.literal('enableNode'), targetNodeId: z.string() }),
  z.object({ type: z.literal('disableNode'), targetNodeId: z.string() }),
  z.object({ type: z.literal('toggleNodeDisabled'), targetNodeId: z.string() }),
  z.object({ type: z.literal('navigate'), targetPageId: z.string() }),
  z.object({ type: z.literal('navigateToPage'), targetPageId: z.string() }),
  z.object({ type: z.literal('setVariable'), variableId: z.string(), value: ValueRefSchema }),
  z.object({ type: z.literal('refreshData'), dataSourceId: z.string() }),
  z.object({ type: z.literal('showMessage'), level: z.enum(['success', 'info', 'warning', 'error']), message: z.string() }),
  z.object({ type: z.literal('setNodeProp'), targetNodeId: z.string(), propKey: z.string(), value: ValueRefSchema }),
  z.object({ type: z.literal('setFormValue'), targetNodeId: z.string(), field: z.string(), value: ValueRefSchema }),
  z.object({ type: z.literal('resetForm'), targetNodeId: z.string() }),
  z.object({ type: z.literal('selectTab'), targetNodeId: z.string(), tabKey: z.string() }),
  z.object({ type: z.literal('scrollToNode'), targetNodeId: z.string() }),
  z.object({
    type: z.literal('submitMock'),
    dataSourceId: z.string(),
    payloadFrom: z.enum(['form', 'currentRow']),
    operation: z.enum(['create', 'update', 'delete']).optional(),
  }),
]);

export const InteractionSchema = z.object({
  id: z.string(),
  name: z.string(),
  trigger: TriggerSchema,
  conditions: z.array(ConditionSchema).optional(),
  actions: z.array(ActionSchema),
  enabled: z.boolean(),
});

export const PageSchema = z.object({
  id: z.string(),
  name: z.string(),
  route: z.string(),
  purpose: z.string().optional(),
  frames: z.array(PageFrameSchema).optional(),
  rootNodeId: z.string(),
  nodes: z.record(z.string(), ComponentNodeSchema),
});

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  businessType: z.enum(['blank', 'ecommerce', 'crm', 'approval', 'cms', 'user_permission', 'dashboard', 'custom']).optional(),
  pages: z.array(PageSchema),
  dataSources: z.array(DataSourceSchema),
  variables: z.array(VariableSchema),
  interactions: z.array(InteractionSchema),
  version: z.number().int().positive(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const OperationSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('addNode'), pageId: z.string(), parentNodeId: z.string(), node: ComponentNodeSchema }),
  z.object({ type: z.literal('updateNodeName'), pageId: z.string(), nodeId: z.string(), name: z.string() }),
  z.object({ type: z.literal('updateNodeProps'), pageId: z.string(), nodeId: z.string(), props: JsonRecordSchema }),
  z.object({ type: z.literal('updateNodeContent'), pageId: z.string(), nodeId: z.string(), content: JsonRecordSchema }),
  z.object({ type: z.literal('updateNodeData'), pageId: z.string(), nodeId: z.string(), data: JsonRecordSchema }),
  z.object({ type: z.literal('updateNodeEvents'), pageId: z.string(), nodeId: z.string(), events: z.record(z.string(), JsonRecordSchema) }),
  z.object({ type: z.literal('updateNodeSemantic'), pageId: z.string(), nodeId: z.string(), semantic: ComponentSemanticSchema }),
  z.object({ type: z.literal('updateNodeRuntime'), pageId: z.string(), nodeId: z.string(), runtime: ComponentRuntimeSchema }),
  z.object({
    type: z.literal('cloneNodes'),
    pageId: z.string(),
    parentNodeId: z.string(),
    nodeIds: z.array(z.string()),
    offset: z.object({ x: z.number(), y: z.number() }).optional(),
    targetFrameId: z.string().optional(),
    placeAtHighestLayer: z.boolean().optional(),
  }),
  z.object({ type: z.literal('updateNodeLayerOrder'), pageId: z.string(), frameId: z.string(), orderedNodeIds: z.array(z.string()) }),
  z.object({ type: z.literal('groupNodes'), pageId: z.string(), parentNodeId: z.string(), groupNode: ComponentNodeSchema, childNodeIds: z.array(z.string()) }),
  z.object({ type: z.literal('ungroupNode'), pageId: z.string(), groupNodeId: z.string() }),
  z.object({ type: z.literal('alignNodes'), pageId: z.string(), nodeIds: z.array(z.string()), alignment: z.enum(['left', 'center', 'right', 'top', 'middle', 'bottom']) }),
  z.object({ type: z.literal('distributeNodes'), pageId: z.string(), nodeIds: z.array(z.string()), direction: z.enum(['horizontal', 'vertical']) }),
  z.object({ type: z.literal('updateNodeCanvas'), pageId: z.string(), nodeId: z.string(), canvas: NodeCanvasSchema.partial() }),
  z.object({ type: z.literal('assignNodeToFrame'), pageId: z.string(), nodeId: z.string(), frameId: z.string() }),
  z.object({ type: z.literal('setNodeCanvasLocked'), pageId: z.string(), nodeId: z.string(), locked: z.boolean() }),
  z.object({ type: z.literal('setNodeCanvasHidden'), pageId: z.string(), nodeId: z.string(), hidden: z.boolean() }),
  z.object({ type: z.literal('updateNodeLayout'), pageId: z.string(), nodeId: z.string(), layout: NodeLayoutSchema }),
  z.object({ type: z.literal('updateContainerLayout'), pageId: z.string(), nodeId: z.string(), layout: ContainerLayoutSchema }),
  z.object({ type: z.literal('deleteNode'), pageId: z.string(), nodeId: z.string() }),
  z.object({ type: z.literal('moveNode'), pageId: z.string(), parentNodeId: z.string(), nodeId: z.string(), direction: z.enum(['up', 'down']) }),
  z.object({ type: z.literal('reorderNode'), pageId: z.string(), parentNodeId: z.string(), nodeId: z.string(), targetNodeId: z.string(), position: z.enum(['before', 'after']).optional() }),
  z.object({ type: z.literal('reorderNodeToIndex'), pageId: z.string(), parentNodeId: z.string(), nodeId: z.string(), targetIndex: z.number().int().nonnegative() }),
  z.object({ type: z.literal('moveNodeToParent'), pageId: z.string(), nodeId: z.string(), newParentNodeId: z.string() }),
  z.object({ type: z.literal('addInteraction'), interaction: InteractionSchema }),
  z.object({ type: z.literal('updateInteraction'), interactionId: z.string(), patch: InteractionSchema.partial() }),
  z.object({ type: z.literal('deleteInteraction'), interactionId: z.string() }),
  z.object({ type: z.literal('updateDataSourceFields'), dataSourceId: z.string(), fields: z.array(FieldConfigSchema) }),
  z.object({ type: z.literal('updateDataSourceRecords'), dataSourceId: z.string(), records: z.array(JsonRecordSchema) }),
  z.object({ type: z.literal('renameDataSourceFieldKey'), dataSourceId: z.string(), fromKey: z.string(), toKey: z.string() }),
  z.object({ type: z.literal('addPageFrame'), pageId: z.string(), frame: PageFrameSchema }),
  z.object({ type: z.literal('updatePageFrame'), pageId: z.string(), frameId: z.string(), patch: PageFrameSchema.partial() }),
  z.object({ type: z.literal('addPage'), page: PageSchema }),
  z.object({ type: z.literal('updatePage'), pageId: z.string(), patch: PageSchema.partial() }),
]);

export const AiSuggestionSchema = z.object({
  id: z.string(),
  severity: z.enum(['info', 'warning', 'error']),
  category: z.enum(['interaction', 'schema', 'flow', 'content', 'best_practice']),
  title: z.string(),
  description: z.string(),
  affectedNodeIds: z.array(z.string()).optional(),
  affectedInteractionIds: z.array(z.string()).optional(),
  operations: z.array(OperationSchema).optional(),
  canApplyAutomatically: z.boolean(),
});
