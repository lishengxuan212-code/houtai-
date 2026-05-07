import type { ComponentNode, DataSource, Interaction, Page, Project } from '../domain/types';
import { createId } from '../domain/ids';
import { createComponentPreset } from '../registry/componentPresetRegistry';
import type { ComponentPreset } from '../registry/types/componentPreset';
import { listUserTemplates, saveUserTemplate } from './templateStorage';
import type { SaveTemplateOptions, UserTemplate } from './userTemplateTypes';

export { listUserTemplates, saveUserTemplate };

export function componentPresetToTemplate(preset: ComponentPreset): UserTemplate {
  const nodeId = createId('preset_node');
  return {
    id: createId('template'),
    name: preset.name,
    type: 'component',
    category: preset.category ?? '组件预设',
    content: {
      rootNodeId: nodeId,
      nodes: {
        [nodeId]: {
          id: nodeId,
          type: preset.componentType ?? preset.baseComponentType,
          name: preset.name,
          props: structuredClone(preset.props),
        },
      },
      interactions: structuredClone(preset.interactions ?? []),
    },
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
    interactions: template.content.interactions,
    now,
    ...(template.description ? { description: template.description } : {}),
  });
}

function collectSubtree(page: Page, rootNodeId: string, nodes: Record<string, ComponentNode> = {}): Record<string, ComponentNode> {
  const node = page.nodes[rootNodeId];
  if (!node) return nodes;
  nodes[node.id] = structuredClone(node);
  node.children?.forEach((childId) => collectSubtree(page, childId, nodes));
  return nodes;
}

function referencedDataSources(nodes: Record<string, ComponentNode>, dataSources: DataSource[]): DataSource[] {
  const ids = new Set(Object.values(nodes).map((node) => (typeof node.props.dataSourceId === 'string' ? node.props.dataSourceId : undefined)).filter(Boolean));
  return dataSources.filter((source) => ids.has(source.id)).map((source) => structuredClone(source));
}

function interactionBelongsToSubtree(interaction: Interaction, nodeIds: Set<string>): boolean {
  const triggerNodeId = interaction.trigger.componentId.split(':')[0] ?? interaction.trigger.componentId;
  if (!nodeIds.has(triggerNodeId)) return false;
  return interaction.actions.every((action) => {
    if (action.type === 'openModal' || action.type === 'closeModal' || action.type === 'resetForm') return nodeIds.has(action.targetNodeId);
    return true;
  });
}

export function createTemplateFromSelection(project: Project, pageId: string, rootNodeId: string, options: SaveTemplateOptions): UserTemplate {
  const page = project.pages.find((item) => item.id === pageId);
  if (!page || !page.nodes[rootNodeId]) throw new Error('Cannot create template from missing selection');
  const now = new Date().toISOString();
  const nodes = collectSubtree(page, rootNodeId);
  const nodeIds = new Set(Object.keys(nodes));
  return {
    id: createId('template'),
    name: options.name,
    type: options.type,
    category: options.category,
    content: {
      nodes,
      rootNodeId,
      interactions: options.includeInteractions ? project.interactions.filter((interaction) => interactionBelongsToSubtree(interaction, nodeIds)).map((item) => structuredClone(item)) : [],
      ...(options.includeDataSources ? { dataSources: referencedDataSources(nodes, project.dataSources) } : {}),
    },
    createdAt: now,
    updatedAt: now,
    version: 1,
    ...(options.description ? { description: options.description } : {}),
  };
}

function cloneTemplateNodes(template: UserTemplate): { nodes: Record<string, ComponentNode>; rootNodeId: string; idMap: Map<string, string> } {
  const idMap = new Map<string, string>();
  for (const id of Object.keys(template.content.nodes)) idMap.set(id, createId(template.type));
  const nodes: Record<string, ComponentNode> = {};
  for (const [oldId, node] of Object.entries(template.content.nodes)) {
    const nextId = idMap.get(oldId)!;
    const clonedNode: ComponentNode = {
      ...structuredClone(node),
      id: nextId,
    };
    const children = node.children?.map((childId) => idMap.get(childId)).filter((id): id is string => Boolean(id));
    if (children) clonedNode.children = children;
    nodes[nextId] = clonedNode;
  }
  return { nodes, rootNodeId: idMap.get(template.content.rootNodeId)!, idMap };
}

export function insertTemplateIntoPage(project: Project, pageId: string, parentNodeId: string, template: UserTemplate): Project {
  const draft = structuredClone(project);
  const page = draft.pages.find((item) => item.id === pageId);
  const parent = page?.nodes[parentNodeId];
  if (!page || !parent) return draft;
  const cloned = cloneTemplateNodes(template);
  page.nodes = { ...page.nodes, ...cloned.nodes };
  parent.children = [...(parent.children ?? []), cloned.rootNodeId];
  if (template.content.dataSources?.length) {
    const existing = new Set(draft.dataSources.map((source) => source.id));
    draft.dataSources = [...draft.dataSources, ...template.content.dataSources.filter((source) => !existing.has(source.id)).map((source) => structuredClone(source))];
  }
  const remappedInteractions = remapTemplateInteractions(template.content.interactions, cloned.idMap);
  draft.interactions = [...draft.interactions, ...remappedInteractions];
  draft.updatedAt = new Date().toISOString();
  return draft;
}

function remapTemplateInteractions(interactions: Interaction[], idMap: Map<string, string>): Interaction[] {
  return interactions.map((interaction) => {
    const [triggerId, ...suffix] = interaction.trigger.componentId.split(':');
    const nextTriggerId = idMap.get(triggerId ?? '') ?? triggerId ?? '';
    return {
      ...structuredClone(interaction),
      id: createId('interaction'),
      trigger: {
        ...interaction.trigger,
        componentId: [nextTriggerId, ...suffix].join(':'),
      },
      actions: interaction.actions.map((action) => {
        if ((action.type === 'openModal' || action.type === 'closeModal' || action.type === 'resetForm') && idMap.has(action.targetNodeId)) {
          return { ...action, targetNodeId: idMap.get(action.targetNodeId)! };
        }
        return structuredClone(action);
      }),
    };
  });
}

export function createPageFromTemplate(project: Project, template: UserTemplate): Project {
  if (template.type !== 'page') return project;
  const draft = structuredClone(project);
  const cloned = cloneTemplateNodes(template);
  const pageId = createId('page');
  const root = cloned.nodes[cloned.rootNodeId];
  if (root) {
    root.name = template.name;
    root.props = { ...root.props, title: template.name };
  }
  draft.pages.push({
    id: pageId,
    name: template.name,
    route: `/${pageId}`,
    purpose: template.description ?? '由页面模板创建',
    rootNodeId: cloned.rootNodeId,
    nodes: cloned.nodes,
  });
  draft.interactions = [...draft.interactions, ...remapTemplateInteractions(template.content.interactions, cloned.idMap)];
  if (template.content.dataSources?.length) {
    const existing = new Set(draft.dataSources.map((source) => source.id));
    draft.dataSources = [...draft.dataSources, ...template.content.dataSources.filter((source) => !existing.has(source.id)).map((source) => structuredClone(source))];
  }
  draft.updatedAt = new Date().toISOString();
  return draft;
}
