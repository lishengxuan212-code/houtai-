import type { ComponentNode, Page, Project } from './types';

export function getPage(project: Project, pageId: string): Page | undefined {
  return project.pages.find((page) => page.id === pageId);
}

export function getNode(project: Project, nodeId: string): ComponentNode | undefined {
  for (const page of project.pages) {
    const node = page.nodes[nodeId];
    if (node) return node;
  }
  return undefined;
}

export function getNodePage(project: Project, nodeId: string): Page | undefined {
  return project.pages.find((page) => Boolean(page.nodes[nodeId]));
}

export function findParentNode(page: Page, nodeId: string): ComponentNode | undefined {
  return Object.values(page.nodes).find((node) => node.children?.includes(nodeId));
}

export function walkPageNodes(page: Page): ComponentNode[] {
  const result: ComponentNode[] = [];
  const visit = (nodeId: string) => {
    const node = page.nodes[nodeId];
    if (!node) return;
    result.push(node);
    node.children?.forEach(visit);
  };
  visit(page.rootNodeId);
  return result;
}
