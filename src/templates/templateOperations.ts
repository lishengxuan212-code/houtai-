import type { Action, ComponentNode, DataSource, Interaction, JsonRecord, JsonValue, Page, PageFrame, Project, ValueRef } from '../domain/types';
import { cloneNodesWithNewIds, ensureNodeCanvas, getNextFrameZIndex } from '../domain/canvas';
import { createId } from '../domain/ids';
import { createComponentPreset } from '../registry/componentPresetRegistry';
import type { ComponentPreset } from '../registry/types/componentPreset';
import { deleteUserTemplate, duplicateUserTemplate, listUserTemplates, renameUserTemplate, saveUserTemplate, updateUserTemplate } from './templateStorage';
import type { SaveTemplateOptions, UserTemplate, UserTemplateSaveOptions } from './userTemplateTypes';

export { deleteUserTemplate, duplicateUserTemplate, listUserTemplates, renameUserTemplate, saveUserTemplate, updateUserTemplate };

const defaultSaveOptions: UserTemplateSaveOptions = {
  includeProps: true,
  includeContent: true,
  includeData: true,
  includeInternalInteractions: true,
  includeExternalReferences: false,
};

export function componentPresetToTemplate(preset: ComponentPreset): UserTemplate {
  const nodeId = createId('preset_node');
  return {
    id: createId('template'),
    name: preset.name,
    type: 'componentPreset',
    category: preset.category ?? '组件预设',
    content: {
      rootNodeId: nodeId,
      nodes: {
        [nodeId]: {
          id: nodeId,
          type: preset.componentType ?? preset.baseComponentType,
          name: preset.name,
          props: structuredClone(preset.props),
          ...(preset.canvas ? { canvas: structuredClone(preset.canvas) } : {}),
        },
      },
      interactions: structuredClone(preset.interactions ?? []),
    },
    saveOptions: defaultSaveOptions,
    createdAt: preset.createdAt,
    updatedAt: preset.updatedAt,
    version: preset.version,
    ...(preset.description ? { description: preset.description } : {}),
  };
}

export function templateToComponentPreset(template: UserTemplate, now = new Date().toISOString()): ComponentPreset {
  const root = template.content.nodes[template.content.rootNodeId];
  if (!root) throw new Error('Cannot create component preset from empty template');
  return createComponentPreset({
    name: template.name,
    baseComponentType: root.type,
    category: template.category,
    props: root.props,
    ...(root.canvas ? { canvas: root.canvas } : {}),
    interactions: template.content.interactions,
    now,
    ...(template.description ? { description: template.description } : {}),
  });
}

function normalizeSaveOptions(options: SaveTemplateOptions): UserTemplateSaveOptions {
  return {
    includeProps: options.includeProps ?? true,
    includeContent: options.includeContent ?? true,
    includeData: options.includeData ?? options.includeDataSources ?? true,
    includeInternalInteractions: options.includeInternalInteractions ?? options.includeInteractions ?? true,
    includeExternalReferences: options.includeExternalReferences ?? false,
  };
}

function collectSubtree(page: Page, rootNodeId: string, nodes: Record<string, ComponentNode> = {}): Record<string, ComponentNode> {
  const node = page.nodes[rootNodeId];
  if (!node) return nodes;
  nodes[node.id] = structuredClone(node);
  node.children?.forEach((childId) => collectSubtree(page, childId, nodes));
  return nodes;
}

function collectFrameNodes(page: Page, frameId: string): Record<string, ComponentNode> {
  const nodes: Record<string, ComponentNode> = {};
  for (const node of Object.values(page.nodes)) {
    if (node.id !== page.rootNodeId && node.canvas?.parentFrameId === frameId) nodes[node.id] = structuredClone(node);
  }
  return nodes;
}

function sanitizeNodes(nodes: Record<string, ComponentNode>, options: UserTemplateSaveOptions): Record<string, ComponentNode> {
  return Object.fromEntries(
    Object.entries(nodes).map(([id, source]) => {
      const node = structuredClone(source);
      if (!options.includeProps) node.props = {};
      if (!options.includeContent) delete node.content;
      if (!options.includeData) delete node.data;
      return [id, node];
    }),
  );
}

function templateDataSourceIds(nodes: Record<string, ComponentNode>, interactions: Interaction[], dataSources: DataSource[]): Set<string> {
  const ids = new Set<string>();
  const scanValue = (value: JsonValue | undefined) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach(scanValue);
      return;
    }
    if (typeof value.dataSourceId === 'string') ids.add(value.dataSourceId);
    for (const item of Object.values(value)) scanValue(item);
  };
  Object.values(nodes).forEach((node) => {
    scanValue(node.props);
    scanValue(node.content);
    scanValue(node.data);
    Object.values(node.events ?? {}).forEach(scanValue);
    Object.values(node.bindings ?? {}).forEach((binding) => {
      if (binding.source === 'dataSource') ids.add(binding.path.split('.')[0] ?? binding.path);
      if (binding.source === 'field') ids.add(binding.path.split('.')[0] ?? binding.path);
    });
  });
  interactions.forEach((interaction) =>
    interaction.actions.forEach((action) => {
      if ('dataSourceId' in action) ids.add(action.dataSourceId);
    }),
  );
  return new Set([...ids].filter((id) => dataSources.some((source) => source.id === id)));
}

function referencedDataSources(nodes: Record<string, ComponentNode>, interactions: Interaction[], dataSources: DataSource[]): DataSource[] {
  const ids = templateDataSourceIds(nodes, interactions, dataSources);
  return dataSources.filter((source) => ids.has(source.id)).map((source) => structuredClone(source));
}

function triggerNodeId(componentId: string): string {
  return componentId.split(':')[0] ?? componentId;
}

function actionTargetNodeId(action: Action): string | undefined {
  return 'targetNodeId' in action ? action.targetNodeId : undefined;
}

function valueRefNodeId(ref: ValueRef): string | undefined {
  return ref.kind === 'form' ? ref.formId : undefined;
}

function interactionIsInternal(interaction: Interaction, nodeIds: Set<string>, dataSourceIds: Set<string>): boolean {
  if (!nodeIds.has(triggerNodeId(interaction.trigger.componentId))) return false;
  const actionTargetsInternal = interaction.actions.every((action) => {
    const targetNodeId = actionTargetNodeId(action);
    if (targetNodeId && !nodeIds.has(targetNodeId)) return false;
    if ('dataSourceId' in action && !dataSourceIds.has(action.dataSourceId)) return false;
    if ('targetPageId' in action) return false;
    if ('variableId' in action) return false;
    if ('value' in action && action.value.kind === 'form' && !nodeIds.has(action.value.formId)) return false;
    return true;
  });
  const conditionTargetsInternal = (interaction.conditions ?? []).every((condition) =>
    [valueRefNodeId(condition.left), condition.right ? valueRefNodeId(condition.right) : undefined].every((nodeId) => !nodeId || nodeIds.has(nodeId)),
  );
  return actionTargetsInternal && conditionTargetsInternal;
}

function templateInteractions(project: Project, nodes: Record<string, ComponentNode>, options: UserTemplateSaveOptions): Interaction[] {
  if (!options.includeInternalInteractions) return [];
  const nodeIds = new Set(Object.keys(nodes));
  const directInteractions = project.interactions.filter((interaction) => nodeIds.has(triggerNodeId(interaction.trigger.componentId)));
  if (options.includeExternalReferences) return directInteractions.map((item) => structuredClone(item));
  const dataSourceIds = options.includeData ? templateDataSourceIds(nodes, directInteractions, project.dataSources) : new Set<string>();
  return directInteractions.filter((interaction) => interactionIsInternal(interaction, nodeIds, dataSourceIds)).map((item) => structuredClone(item));
}

function selectTemplateNodes(project: Project, page: Page, rootNodeId: string, options: SaveTemplateOptions): { nodes: Record<string, ComponentNode>; rootNodeId: string; frames?: PageFrame[] } {
  if (options.type === 'page') return { nodes: collectSubtree(page, page.rootNodeId), rootNodeId: page.rootNodeId, ...(page.frames ? { frames: structuredClone(page.frames) } : {}) };
  if (options.type === 'pageFrame' || options.type === 'canvasBoard') {
    const frameId = options.frameId;
    const frame = frameId ? page.frames?.find((item) => item.id === frameId) : undefined;
    const nodes = frame ? collectFrameNodes(page, frame.id) : {};
    const wrapperId = createId('template_frame_root');
    nodes[wrapperId] = {
      id: wrapperId,
      type: 'PageContainer',
      name: frame?.name ?? 'Canvas Board',
      props: { title: frame?.name ?? 'Canvas Board' },
      children: Object.keys(nodes),
    };
    return { nodes, rootNodeId: wrapperId, ...(frame ? { frames: [structuredClone(frame)] } : {}) };
  }
  void project;
  return { nodes: collectSubtree(page, rootNodeId), rootNodeId };
}

export function createTemplateFromSelection(project: Project, pageId: string, rootNodeId: string, options: SaveTemplateOptions): UserTemplate {
  const page = project.pages.find((item) => item.id === pageId);
  if (!page || (!page.nodes[rootNodeId] && options.type !== 'pageFrame' && options.type !== 'canvasBoard')) throw new Error('Cannot create template from missing selection');
  const now = new Date().toISOString();
  const saveOptions = normalizeSaveOptions(options);
  const selected = selectTemplateNodes(project, page, rootNodeId, options);
  const nodes = sanitizeNodes(selected.nodes, saveOptions);
  const interactions = templateInteractions(project, nodes, saveOptions);
  return {
    id: createId('template'),
    name: options.name,
    type: options.type,
    category: options.category,
    content: {
      nodes,
      rootNodeId: selected.rootNodeId,
      ...(selected.frames ? { frames: selected.frames } : {}),
      interactions,
      ...(saveOptions.includeData ? { dataSources: referencedDataSources(nodes, interactions, project.dataSources) } : {}),
    },
    saveOptions,
    createdAt: now,
    updatedAt: now,
    version: 1,
    ...(options.description ? { description: options.description } : {}),
  };
}

function remapJson(value: JsonValue, idMap: Record<string, string>, dataIdMap: Record<string, string>, interactionIdMap: Record<string, string> = {}): JsonValue {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => remapJson(item, idMap, dataIdMap, interactionIdMap));
  const result: JsonRecord = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === 'dataSourceId' && typeof item === 'string') result[key] = dataIdMap[item] ?? item;
    else if (key === 'interactionId' && typeof item === 'string') result[key] = interactionIdMap[item] ?? item;
    else if ((key === 'targetNodeId' || key === 'formId') && typeof item === 'string') result[key] = idMap[item] ?? item;
    else result[key] = remapJson(item, idMap, dataIdMap, interactionIdMap);
  }
  return result;
}

function remapNodeReferences(node: ComponentNode, idMap: Record<string, string>, dataIdMap: Record<string, string>, interactionIdMap: Record<string, string>): ComponentNode {
  const next = structuredClone(node);
  next.props = remapJson(next.props, idMap, dataIdMap, interactionIdMap) as JsonRecord;
  if (next.content) next.content = remapJson(next.content, idMap, dataIdMap, interactionIdMap) as JsonRecord;
  if (next.data) next.data = remapJson(next.data, idMap, dataIdMap, interactionIdMap) as JsonRecord;
  if (next.events) next.events = remapJson(next.events, idMap, dataIdMap, interactionIdMap) as Record<string, JsonRecord>;
  if (next.bindings) {
    next.bindings = Object.fromEntries(
      Object.entries(next.bindings).map(([key, binding]) => {
        const first = binding.path.split('.')[0] ?? binding.path;
        return [key, dataIdMap[first] ? { ...binding, path: binding.path.replace(first, dataIdMap[first]) } : binding];
      }),
    );
  }
  return next;
}

function cloneTemplateNodes(template: UserTemplate, page?: Page, targetFrameId?: string): { nodes: Record<string, ComponentNode>; rootNodeId: string; rootIds: string[]; idMap: Record<string, string> } {
  const sourcePage: Page = { id: 'template_source', name: template.name, route: '/', rootNodeId: template.content.rootNodeId, nodes: template.content.nodes };
  const rootNode = template.content.nodes[template.content.rootNodeId];
  const rootIds = rootNode?.children?.length && (template.type === 'pageFrame' || template.type === 'canvasBoard') ? rootNode.children : [template.content.rootNodeId];
  const cloned = cloneNodesWithNewIds(sourcePage, rootIds, {
    idFactory: (oldId) => createId(`${oldId}_tpl`),
    ...(targetFrameId ? { targetFrameId, placeAtHighestLayer: Boolean(page) } : {}),
  });
  return { nodes: cloned.nodes, rootNodeId: cloned.rootIds[0] ?? '', rootIds: cloned.rootIds, idMap: cloned.idMap };
}

function cloneTemplateDataSources(template: UserTemplate): { dataSources: DataSource[]; dataIdMap: Record<string, string> } {
  const dataIdMap: Record<string, string> = {};
  const dataSources = (template.content.dataSources ?? []).map((source) => {
    const id = createId(`${source.id}_tpl`);
    dataIdMap[source.id] = id;
    return { ...structuredClone(source), id };
  });
  return { dataSources, dataIdMap };
}

function remapComponentId(componentId: string, idMap: Record<string, string>): string {
  const [base, ...suffix] = componentId.split(':');
  return [idMap[base ?? ''] ?? base ?? '', ...suffix].join(':');
}

function remapValueRef(ref: ValueRef, idMap: Record<string, string>): ValueRef {
  if (ref.kind !== 'form') return structuredClone(ref);
  return { ...ref, formId: idMap[ref.formId] ?? ref.formId };
}

function remapAction(action: Action, idMap: Record<string, string>, dataIdMap: Record<string, string>): Action {
  const next = structuredClone(action);
  if ('targetNodeId' in next) next.targetNodeId = idMap[next.targetNodeId] ?? next.targetNodeId;
  if ('dataSourceId' in next) next.dataSourceId = dataIdMap[next.dataSourceId] ?? next.dataSourceId;
  if ('value' in next) next.value = remapValueRef(next.value, idMap);
  return next;
}

function createInteractionIdMap(interactions: Interaction[]): Record<string, string> {
  return Object.fromEntries(interactions.map((interaction) => [interaction.id, createId('interaction')]));
}

function remapTemplateInteractions(interactions: Interaction[], idMap: Record<string, string>, dataIdMap: Record<string, string>, interactionIdMap: Record<string, string>): Interaction[] {
  return interactions.map((interaction) => ({
    ...structuredClone(interaction),
    id: interactionIdMap[interaction.id] ?? createId('interaction'),
    trigger: { ...interaction.trigger, componentId: remapComponentId(interaction.trigger.componentId, idMap) },
    ...(interaction.conditions
      ? {
          conditions: interaction.conditions.map((condition) => ({
            ...condition,
            left: remapValueRef(condition.left, idMap),
            ...(condition.right ? { right: remapValueRef(condition.right, idMap) } : {}),
          })),
        }
      : {}),
    actions: interaction.actions.map((action) => remapAction(action, idMap, dataIdMap)),
  }));
}

function applyDataRemapToNodes(nodes: Record<string, ComponentNode>, idMap: Record<string, string>, dataIdMap: Record<string, string>, interactionIdMap: Record<string, string>): Record<string, ComponentNode> {
  return Object.fromEntries(Object.entries(nodes).map(([id, node]) => [id, remapNodeReferences(node, idMap, dataIdMap, interactionIdMap)]));
}

export function insertTemplateIntoPage(project: Project, pageId: string, parentNodeId: string, template: UserTemplate, targetFrameId?: string): Project {
  const draft = structuredClone(project);
  const page = draft.pages.find((item) => item.id === pageId);
  const parent = page?.nodes[parentNodeId];
  if (!page || !parent?.children) return draft;
  if (template.type === 'page') return createPageFromTemplate(project, template);
  if (template.type === 'pageFrame' || template.type === 'canvasBoard') return insertFrameTemplateIntoPage(project, pageId, template);

  const frameId = targetFrameId ?? page.nodes[parentNodeId]?.canvas?.parentFrameId ?? page.frames?.[0]?.id;
  const data = cloneTemplateDataSources(template);
  const cloned = cloneTemplateNodes(template, page, frameId);
  const interactionIdMap = createInteractionIdMap(template.content.interactions);
  const nodes = applyDataRemapToNodes(cloned.nodes, cloned.idMap, data.dataIdMap, interactionIdMap);
  if (frameId) {
    let zIndex = getNextFrameZIndex(page, frameId);
    for (const node of Object.values(nodes)) {
      node.canvas = { ...ensureNodeCanvas(node).canvas!, parentFrameId: frameId, zIndex };
      zIndex += 1;
    }
  }
  page.nodes = { ...page.nodes, ...nodes };
  parent.children = [...parent.children, ...cloned.rootIds];
  draft.dataSources = [...draft.dataSources, ...data.dataSources];
  draft.interactions = [...draft.interactions, ...remapTemplateInteractions(template.content.interactions, cloned.idMap, data.dataIdMap, interactionIdMap)];
  draft.updatedAt = new Date().toISOString();
  return draft;
}

function insertFrameTemplateIntoPage(project: Project, pageId: string, template: UserTemplate): Project {
  const draft = structuredClone(project);
  const page = draft.pages.find((item) => item.id === pageId);
  const parent = page?.nodes[page.rootNodeId];
  if (!page || !parent?.children) return draft;
  const sourceFrame = template.content.frames?.[0];
  const frameId = createId('frame');
  const frame: PageFrame = sourceFrame
    ? { ...structuredClone(sourceFrame), id: frameId, name: template.name, zIndex: Math.max(0, ...(page.frames ?? []).map((item) => item.zIndex)) + 1 }
    : { id: frameId, name: template.name, x: 0, y: 0, width: 1440, height: 900, zIndex: Math.max(0, ...(page.frames ?? []).map((item) => item.zIndex)) + 1 };
  const data = cloneTemplateDataSources(template);
  const cloned = cloneTemplateNodes(template, page, frameId);
  const interactionIdMap = createInteractionIdMap(template.content.interactions);
  const nodes = applyDataRemapToNodes(cloned.nodes, cloned.idMap, data.dataIdMap, interactionIdMap);
  let zIndex = getNextFrameZIndex(page, frameId);
  for (const node of Object.values(nodes)) {
    const canvas = ensureNodeCanvas(node).canvas;
    if (!canvas) continue;
    node.canvas = { ...canvas, parentFrameId: frameId, zIndex };
    zIndex += 1;
  }
  page.frames = [...(page.frames ?? []), frame];
  page.nodes = { ...page.nodes, ...nodes };
  parent.children = [...parent.children, ...cloned.rootIds];
  draft.dataSources = [...draft.dataSources, ...data.dataSources];
  draft.interactions = [...draft.interactions, ...remapTemplateInteractions(template.content.interactions, cloned.idMap, data.dataIdMap, interactionIdMap)];
  draft.updatedAt = new Date().toISOString();
  return draft;
}

export function createPageFromTemplate(project: Project, template: UserTemplate): Project {
  if (template.type !== 'page') return project;
  const draft = structuredClone(project);
  const data = cloneTemplateDataSources(template);
  const cloned = cloneTemplateNodes(template);
  const interactionIdMap = createInteractionIdMap(template.content.interactions);
  const nodes = applyDataRemapToNodes(cloned.nodes, cloned.idMap, data.dataIdMap, interactionIdMap);
  const pageId = createId('page');
  const root = nodes[cloned.rootNodeId];
  if (root) {
    root.name = template.name;
    root.props = { ...root.props, title: template.name };
  }
  const frameIdMap: Record<string, string> = {};
  const frames = template.content.frames?.map((frame) => {
    const id = createId('frame');
    frameIdMap[frame.id] = id;
    return { ...structuredClone(frame), id };
  });
  for (const node of Object.values(nodes)) {
    const frameId = node.canvas?.parentFrameId;
    if (frameId && frameIdMap[frameId]) {
      const canvas = ensureNodeCanvas(node).canvas;
      if (canvas) node.canvas = { ...canvas, parentFrameId: frameIdMap[frameId] };
    }
  }
  draft.pages.push({
    id: pageId,
    name: template.name,
    route: `/${pageId}`,
    purpose: template.description ?? '由页面模板创建',
    ...(frames ? { frames } : {}),
    rootNodeId: cloned.rootNodeId,
    nodes,
  });
  draft.dataSources = [...draft.dataSources, ...data.dataSources];
  draft.interactions = [...draft.interactions, ...remapTemplateInteractions(template.content.interactions, cloned.idMap, data.dataIdMap, interactionIdMap)];
  draft.updatedAt = new Date().toISOString();
  return draft;
}
