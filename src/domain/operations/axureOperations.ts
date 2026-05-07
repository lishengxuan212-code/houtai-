import type { ComponentNode, Page } from '../types';
import { createId } from '../ids';

export function setNodeLocked(node: ComponentNode, locked: boolean): ComponentNode {
  return { ...structuredClone(node), meta: { ...node.meta, locked } };
}

export function setNodeHidden(node: ComponentNode, hiddenInEditor: boolean): ComponentNode {
  return { ...structuredClone(node), meta: { ...node.meta, hiddenInEditor } };
}

export function cloneNodeSubtree(page: Page, nodeId: string): { rootNode: ComponentNode; nodes: Record<string, ComponentNode>; idMap: Map<string, string> } {
  const idMap = new Map<string, string>();
  const collect = (id: string) => {
    const node = page.nodes[id];
    if (!node) return;
    idMap.set(id, createId(node.type.toLowerCase()));
    node.children?.forEach(collect);
  };
  collect(nodeId);

  const nodes: Record<string, ComponentNode> = {};
  for (const [oldId, nextId] of idMap) {
    const node = page.nodes[oldId];
    if (!node) continue;
    nodes[nextId] = {
      ...structuredClone(node),
      id: nextId,
      name: `${node.name} 副本`,
      ...(node.children ? { children: node.children.map((childId) => idMap.get(childId)).filter((id): id is string => Boolean(id)) } : {}),
    };
  }
  const rootNode = nodes[idMap.get(nodeId)!];
  if (!rootNode) throw new Error('Cannot clone missing node');
  return { rootNode, nodes, idMap };
}
