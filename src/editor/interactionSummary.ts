import type { Action, ComponentNode, Interaction, Project } from '../domain/types';

function baseNodeId(componentId: string): string {
  return componentId.split(':')[0] ?? componentId;
}

function actionName(componentId: string): string {
  return componentId.includes(':') ? componentId.split(':').slice(1).join(':') : '';
}

function tableActionIds(node: ComponentNode): string[] {
  if (node.type !== 'Table' || !Array.isArray(node.props.actions)) return [];
  return node.props.actions.filter((item): item is string => typeof item === 'string').map((item) => `${node.id}:${item}`);
}

function findNode(project: Project, nodeId: string): ComponentNode | undefined {
  for (const page of project.pages) {
    const node = page.nodes[nodeId];
    if (node) return node;
  }
  return undefined;
}

function collectNodeScope(project: Project, node: ComponentNode, scope: Set<string>) {
  scope.add(node.id);
  tableActionIds(node).forEach((id) => scope.add(id));

  for (const page of project.pages) {
    if (!page.nodes[node.id]) continue;
    node.children?.forEach((childId) => {
      const child = page.nodes[childId];
      if (child) collectNodeScope(project, child, scope);
    });
  }
}

export function nodeName(project: Project, componentId: string): string {
  const node = findNode(project, baseNodeId(componentId));
  const action = actionName(componentId);
  if (!node) return action || componentId;
  return action ? `${node.name}中的「${action}」` : node.name;
}

export function resultText(project: Project, action: Action): string {
  switch (action.type) {
    case 'openModal':
      return `打开「${nodeName(project, action.targetNodeId)}」`;
    case 'closeModal':
      return `关闭「${nodeName(project, action.targetNodeId)}」`;
    case 'navigate':
      return `跳转到「${project.pages.find((page) => page.id === action.targetPageId)?.name ?? action.targetPageId}」`;
    case 'refreshData':
      return `刷新「${project.dataSources.find((source) => source.id === action.dataSourceId)?.name ?? action.dataSourceId}」`;
    case 'showMessage':
      return `显示提示「${action.message}」`;
    case 'resetForm':
      return `清空「${nodeName(project, action.targetNodeId)}」`;
    case 'submitMock':
      return `保存到「${project.dataSources.find((source) => source.id === action.dataSourceId)?.name ?? action.dataSourceId}」`;
    case 'setVariable':
      return '记住当前选择';
  }
}

export function triggerText(event: string): string {
  switch (event) {
    case 'click':
      return '点击时';
    case 'submit':
      return '提交时';
    case 'change':
      return '变化时';
    case 'rowClick':
      return '点击行时';
    case 'search':
      return '搜索时';
    default:
      return '触发时';
  }
}

export function interactionsForSelection(project: Project, selectedComponentId: string | undefined): Interaction[] {
  if (!selectedComponentId) return [];

  if (selectedComponentId.includes(':')) {
    return project.interactions.filter((interaction) => interaction.trigger.componentId === selectedComponentId);
  }

  const selectedNode = findNode(project, selectedComponentId);
  if (!selectedNode) return [];

  const scope = new Set<string>();
  collectNodeScope(project, selectedNode, scope);
  return project.interactions.filter((interaction) => scope.has(interaction.trigger.componentId));
}
