import type { Operation, Page, Project } from './types';
import {
  alignNodesByCanvas,
  assignNodeToFrame,
  cloneNodesWithNewIds,
  createPageFrame,
  distributeNodesByCanvas,
  ensureNodeCanvas,
  reorderLayerStackByZIndex,
  setNodeCanvasHidden,
  setNodeCanvasLocked,
} from './canvas';
import { normalizeContainerLayout } from './layout';
import { findParentNode, getPage } from './selectors';

function deleteNodeRecursive(page: Page, nodeId: string) {
  const node = page.nodes[nodeId];
  node?.children?.forEach((childId) => deleteNodeRecursive(page, childId));
  delete page.nodes[nodeId];
}

function collectSubtreeIds(page: Page, nodeId: string, ids = new Set<string>()): Set<string> {
  ids.add(nodeId);
  page.nodes[nodeId]?.children?.forEach((childId) => collectSubtreeIds(page, childId, ids));
  return ids;
}

function findSharedParent(page: Page, nodeIds: string[]) {
  const parents = nodeIds.map((nodeId) => findParentNode(page, nodeId));
  const first = parents[0];
  if (!first?.children) return undefined;
  return parents.every((parent) => parent?.id === first.id) ? first : undefined;
}

function isDescendant(page: Page, ancestorId: string, nodeId: string): boolean {
  const ancestor = page.nodes[ancestorId];
  if (!ancestor?.children) return false;
  if (ancestor.children.includes(nodeId)) return true;
  return ancestor.children.some((childId) => isDescendant(page, childId, nodeId));
}

function actionReferencesDeleted(action: Project['interactions'][number]['actions'][number], deletedIds: Set<string>): boolean {
  if (
    (
      action.type === 'openModal' ||
      action.type === 'closeModal' ||
      action.type === 'openDrawer' ||
      action.type === 'closeDrawer' ||
      action.type === 'showNode' ||
      action.type === 'hideNode' ||
      action.type === 'toggleNodeVisibility' ||
      action.type === 'enableNode' ||
      action.type === 'disableNode' ||
      action.type === 'toggleNodeDisabled' ||
      action.type === 'setNodeProp' ||
      action.type === 'setFormValue' ||
      action.type === 'resetForm' ||
      action.type === 'selectTab' ||
      action.type === 'scrollToNode'
    ) &&
    deletedIds.has(action.targetNodeId)
  ) {
    return true;
  }
  return false;
}

export function applyOperation(project: Project, operation: Operation): Project {
  const draft = structuredClone(project);
  draft.updatedAt = new Date().toISOString();

  switch (operation.type) {
    case 'addNode': {
      const page = getPage(draft, operation.pageId);
      const parent = page?.nodes[operation.parentNodeId];
      if (!page || !parent) return draft;
      page.nodes[operation.node.id] = operation.node;
      parent.children = [...(parent.children ?? []), operation.node.id];
      return draft;
    }
    case 'updateNodeName': {
      const node = getPage(draft, operation.pageId)?.nodes[operation.nodeId];
      if (!node) return draft;
      node.name = operation.name;
      return draft;
    }
    case 'updateNodeProps': {
      const node = getPage(draft, operation.pageId)?.nodes[operation.nodeId];
      if (!node) return draft;
      node.props = { ...node.props, ...operation.props };
      return draft;
    }
    case 'updateNodeContent': {
      const node = getPage(draft, operation.pageId)?.nodes[operation.nodeId];
      if (!node) return draft;
      node.content = { ...node.content, ...operation.content };
      return draft;
    }
    case 'updateNodeData': {
      const node = getPage(draft, operation.pageId)?.nodes[operation.nodeId];
      if (!node) return draft;
      node.data = { ...node.data, ...operation.data };
      return draft;
    }
    case 'updateNodeEvents': {
      const node = getPage(draft, operation.pageId)?.nodes[operation.nodeId];
      if (!node) return draft;
      node.events = { ...node.events, ...operation.events };
      return draft;
    }
    case 'updateNodeSemantic': {
      const node = getPage(draft, operation.pageId)?.nodes[operation.nodeId];
      if (!node) return draft;
      node.semantic = { ...node.semantic, ...operation.semantic };
      return draft;
    }
    case 'updateNodeRuntime': {
      const node = getPage(draft, operation.pageId)?.nodes[operation.nodeId];
      if (!node) return draft;
      node.runtime = { ...node.runtime, ...operation.runtime };
      return draft;
    }
    case 'replaceNodesWithComponent': {
      const page = getPage(draft, operation.pageId);
      if (!page || operation.sourceNodeIds.length === 0 || operation.sourceNodeIds.includes(page.rootNodeId)) return draft;
      const sourceIds = operation.sourceNodeIds.filter((nodeId) => page.nodes[nodeId]);
      const sourceSet = new Set(sourceIds);
      if (sourceSet.size === 0 || sourceSet.has(operation.node.id) || page.nodes[operation.node.id]) return draft;
      const parent = findSharedParent(page, sourceIds);
      if (!parent?.children) return draft;
      const firstIndex = parent.children.findIndex((childId) => sourceSet.has(childId));
      if (firstIndex < 0) return draft;
      const deletedIds = new Set<string>();
      sourceIds.forEach((nodeId) => collectSubtreeIds(page, nodeId, deletedIds));
      page.nodes[operation.node.id] = structuredClone(operation.node);
      parent.children = parent.children.flatMap((childId) => {
        if (!sourceSet.has(childId)) return [childId];
        return childId === parent.children?.[firstIndex] ? [operation.node.id] : [];
      });
      deletedIds.forEach((nodeId) => delete page.nodes[nodeId]);
      draft.interactions = draft.interactions.filter(
        (interaction) =>
          !deletedIds.has(interaction.trigger.componentId.split(':')[0] ?? interaction.trigger.componentId) &&
          !interaction.actions.some((action) => actionReferencesDeleted(action, deletedIds)),
      );
      return draft;
    }
    case 'cloneNodes': {
      const page = getPage(draft, operation.pageId);
      const parent = page?.nodes[operation.parentNodeId];
      if (!page || !parent?.children) return draft;
      const cloneOptions = {
        ...(operation.offset ? { offset: operation.offset } : {}),
        ...(operation.targetFrameId ? { targetFrameId: operation.targetFrameId } : {}),
        ...(operation.placeAtHighestLayer !== undefined ? { placeAtHighestLayer: operation.placeAtHighestLayer } : {}),
      };
      const result = cloneNodesWithNewIds(page, operation.nodeIds, cloneOptions);
      page.nodes = { ...page.nodes, ...result.nodes };
      parent.children = [...parent.children, ...result.rootIds];
      return draft;
    }
    case 'updateNodeLayerOrder': {
      const page = getPage(draft, operation.pageId);
      if (!page) return draft;
      for (const patch of reorderLayerStackByZIndex(page, operation.orderedNodeIds, operation.frameId)) {
        const node = page.nodes[patch.nodeId];
        if (!node) continue;
        const canvas = ensureNodeCanvas(node).canvas;
        if (!canvas) continue;
        node.canvas = { ...canvas, zIndex: patch.zIndex, parentFrameId: operation.frameId };
      }
      return draft;
    }
    case 'groupNodes': {
      const page = getPage(draft, operation.pageId);
      const parent = page?.nodes[operation.parentNodeId];
      if (!page || !parent?.children || operation.childNodeIds.length === 0) return draft;
      const childSet = new Set(operation.childNodeIds.filter((nodeId) => page.nodes[nodeId] && nodeId !== page.rootNodeId));
      if (childSet.size === 0) return draft;
      page.nodes[operation.groupNode.id] = operation.groupNode;
      parent.children = parent.children.flatMap((childId) => (childSet.has(childId) ? [] : [childId]));
      parent.children.push(operation.groupNode.id);
      operation.groupNode.children = [...childSet];
      return draft;
    }
    case 'ungroupNode': {
      const page = getPage(draft, operation.pageId);
      const group = page?.nodes[operation.groupNodeId];
      if (!page || !group?.children) return draft;
      const parent = findParentNode(page, operation.groupNodeId);
      if (!parent?.children) return draft;
      parent.children = parent.children.flatMap((childId) => (childId === operation.groupNodeId ? [...(group.children ?? [])] : [childId]));
      delete page.nodes[operation.groupNodeId];
      return draft;
    }
    case 'alignNodes': {
      const page = getPage(draft, operation.pageId);
      if (!page) return draft;
      const nodes = operation.nodeIds.map((nodeId) => page.nodes[nodeId]).filter((node): node is NonNullable<typeof node> => Boolean(node));
      alignNodesByCanvas(nodes, operation.alignment).forEach((node) => {
        page.nodes[node.id] = node;
      });
      return draft;
    }
    case 'distributeNodes': {
      const page = getPage(draft, operation.pageId);
      if (!page) return draft;
      const nodes = operation.nodeIds.map((nodeId) => page.nodes[nodeId]).filter((node): node is NonNullable<typeof node> => Boolean(node));
      distributeNodesByCanvas(nodes, operation.direction).forEach((node) => {
        page.nodes[node.id] = node;
      });
      return draft;
    }
    case 'updateNodeCanvas': {
      const page = getPage(draft, operation.pageId);
      const node = page?.nodes[operation.nodeId];
      if (!page || !node) return draft;
      const current = ensureNodeCanvas(node).canvas;
      if (!current) return draft;
      const deltaX = operation.canvas.x !== undefined ? operation.canvas.x - current.x : 0;
      const deltaY = operation.canvas.y !== undefined ? operation.canvas.y - current.y : 0;
      const locked = operation.canvas.locked ?? current.locked;
      const hidden = operation.canvas.hidden ?? current.hidden;
      const rotation = operation.canvas.rotation ?? current.rotation;
      const parentFrameId = operation.canvas.parentFrameId ?? current.parentFrameId;
      const groupId = Object.prototype.hasOwnProperty.call(operation.canvas, 'groupId') ? operation.canvas.groupId : current.groupId;
      node.canvas = {
        x: operation.canvas.x ?? current.x,
        y: operation.canvas.y ?? current.y,
        width: operation.canvas.width ?? current.width,
        height: operation.canvas.height ?? current.height,
        zIndex: operation.canvas.zIndex ?? current.zIndex,
        ...(locked !== undefined ? { locked } : {}),
        ...(hidden !== undefined ? { hidden } : {}),
        ...(rotation !== undefined ? { rotation } : {}),
        ...(parentFrameId !== undefined ? { parentFrameId } : {}),
        ...(groupId ? { groupId } : {}),
      };
      if ((deltaX !== 0 || deltaY !== 0) && node.children?.length) {
        const descendantIds = new Set<string>();
        node.children.forEach((childId) => collectSubtreeIds(page, childId, descendantIds));
        descendantIds.forEach((childId) => {
          const child = page.nodes[childId];
          if (!child?.canvas) return;
          child.canvas = { ...child.canvas, x: child.canvas.x + deltaX, y: child.canvas.y + deltaY };
        });
      }
      return draft;
    }
    case 'assignNodeToFrame': {
      const page = getPage(draft, operation.pageId);
      const node = page?.nodes[operation.nodeId];
      if (!page || !node || !page.frames?.some((frame) => frame.id === operation.frameId)) return draft;
      page.nodes[operation.nodeId] = assignNodeToFrame(node, operation.frameId);
      return draft;
    }
    case 'setNodeCanvasLocked': {
      const page = getPage(draft, operation.pageId);
      const node = page?.nodes[operation.nodeId];
      if (!page || !node) return draft;
      page.nodes[operation.nodeId] = setNodeCanvasLocked(node, operation.locked);
      return draft;
    }
    case 'setNodeCanvasHidden': {
      const page = getPage(draft, operation.pageId);
      const node = page?.nodes[operation.nodeId];
      if (!page || !node) return draft;
      page.nodes[operation.nodeId] = setNodeCanvasHidden(node, operation.hidden);
      return draft;
    }
    case 'updateNodeLayout': {
      const node = getPage(draft, operation.pageId)?.nodes[operation.nodeId];
      if (!node) return draft;
      node.layout = { ...node.layout, ...operation.layout };
      return draft;
    }
    case 'updateContainerLayout': {
      const node = getPage(draft, operation.pageId)?.nodes[operation.nodeId];
      if (!node) return draft;
      node.containerLayout = normalizeContainerLayout(operation.layout);
      return draft;
    }
    case 'deleteNode': {
      const page = getPage(draft, operation.pageId);
      if (!page || page.rootNodeId === operation.nodeId) return draft;
      const deletedIds = collectSubtreeIds(page, operation.nodeId);
      const parent = findParentNode(page, operation.nodeId);
      if (parent?.children) parent.children = parent.children.filter((id) => id !== operation.nodeId);
      deleteNodeRecursive(page, operation.nodeId);
      draft.interactions = draft.interactions.filter(
        (interaction) =>
          !deletedIds.has(interaction.trigger.componentId.split(':')[0] ?? interaction.trigger.componentId) &&
          !interaction.actions.some((action) => actionReferencesDeleted(action, deletedIds)),
      );
      return draft;
    }
    case 'moveNode': {
      const parent = getPage(draft, operation.pageId)?.nodes[operation.parentNodeId];
      const children = parent?.children;
      if (!children) return draft;
      const index = children.indexOf(operation.nodeId);
      const next = operation.direction === 'up' ? index - 1 : index + 1;
      if (index < 0 || next < 0 || next >= children.length) return draft;
      [children[index], children[next]] = [children[next]!, children[index]!];
      return draft;
    }
    case 'reorderNode': {
      const parent = getPage(draft, operation.pageId)?.nodes[operation.parentNodeId];
      const children = parent?.children;
      if (!children || operation.nodeId === operation.targetNodeId) return draft;
      const from = children.indexOf(operation.nodeId);
      const to = children.indexOf(operation.targetNodeId);
      if (from < 0 || to < 0) return draft;
      const [removed] = children.splice(from, 1);
      if (!removed) return draft;
      const targetIndex = children.indexOf(operation.targetNodeId);
      const insertAt = operation.position === 'after' ? targetIndex + 1 : targetIndex;
      children.splice(Math.max(0, insertAt), 0, removed);
      return draft;
    }
    case 'reorderNodeToIndex': {
      const parent = getPage(draft, operation.pageId)?.nodes[operation.parentNodeId];
      const children = parent?.children;
      if (!children) return draft;
      const from = children.indexOf(operation.nodeId);
      if (from < 0) return draft;
      const [removed] = children.splice(from, 1);
      if (!removed) return draft;
      const targetIndex = Math.min(Math.max(operation.targetIndex, 0), children.length);
      children.splice(targetIndex, 0, removed);
      return draft;
    }
    case 'moveNodeToParent': {
      const page = getPage(draft, operation.pageId);
      if (!page || page.rootNodeId === operation.nodeId || operation.nodeId === operation.newParentNodeId) return draft;
      const node = page.nodes[operation.nodeId];
      const nextParent = page.nodes[operation.newParentNodeId];
      if (!node || !nextParent?.children || isDescendant(page, operation.nodeId, operation.newParentNodeId)) return draft;
      const oldParent = findParentNode(page, operation.nodeId);
      if (!oldParent?.children || oldParent.id === nextParent.id) return draft;
      oldParent.children = oldParent.children.filter((childId) => childId !== operation.nodeId);
      nextParent.children = [...nextParent.children, operation.nodeId];
      return draft;
    }
    case 'addInteraction':
      draft.interactions.push(operation.interaction);
      return draft;
    case 'updateInteraction': {
      const interaction = draft.interactions.find((item) => item.id === operation.interactionId);
      if (interaction) Object.assign(interaction, operation.patch);
      return draft;
    }
    case 'deleteInteraction':
      draft.interactions = draft.interactions.filter((item) => item.id !== operation.interactionId);
      return draft;
    case 'updateDataSourceFields': {
      const source = draft.dataSources.find((item) => item.id === operation.dataSourceId);
      if (!source) return draft;
      source.fields = operation.fields;
      return draft;
    }
    case 'updateDataSourceRecords': {
      const source = draft.dataSources.find((item) => item.id === operation.dataSourceId);
      if (!source) return draft;
      source.records = operation.records;
      return draft;
    }
    case 'renameDataSourceFieldKey': {
      const source = draft.dataSources.find((item) => item.id === operation.dataSourceId);
      if (!source || source.fields.some((field) => field.key === operation.toKey)) return draft;
      source.fields = source.fields.map((field) => (field.key === operation.fromKey ? { ...field, key: operation.toKey } : field));
      source.records = source.records.map((record) => {
        if (!Object.prototype.hasOwnProperty.call(record, operation.fromKey) || Object.prototype.hasOwnProperty.call(record, operation.toKey)) return record;
        const value = record[operation.fromKey];
        if (value === undefined) return record;
        const next = { ...record, [operation.toKey]: value };
        delete next[operation.fromKey];
        return next;
      });
      for (const page of draft.pages) {
        for (const node of Object.values(page.nodes)) {
          if (node.type !== 'Table' || node.props.dataSourceId !== operation.dataSourceId || !Array.isArray(node.props.columns)) continue;
          node.props.columns = node.props.columns.map((column) => {
            if (!column || typeof column !== 'object' || !('key' in column) || column.key !== operation.fromKey) return column;
            return { ...column, key: operation.toKey };
          });
        }
      }
      return draft;
    }
    case 'addPageFrame': {
      const page = getPage(draft, operation.pageId);
      if (!page) return draft;
      const frame = createPageFrame(operation.frame);
      page.frames = [...(page.frames ?? []).filter((item) => item.id !== frame.id), frame];
      return draft;
    }
    case 'updatePageFrame': {
      const page = getPage(draft, operation.pageId);
      if (!page?.frames) return draft;
      page.frames = page.frames.map((frame) => (frame.id === operation.frameId ? { ...frame, ...operation.patch, id: frame.id } : frame));
      return draft;
    }
    case 'addPage':
      draft.pages.push(operation.page);
      return draft;
    case 'updatePage': {
      const page = getPage(draft, operation.pageId);
      if (page) Object.assign(page, operation.patch);
      return draft;
    }
  }
}

export function applyOperations(project: Project, operations: Operation[]): Project {
  return operations.reduce((current, operation) => applyOperation(current, operation), project);
}
