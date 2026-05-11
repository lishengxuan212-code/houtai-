import { runAiRules } from '../ai/rules';
import { walkPageNodes } from '../domain/selectors';
import type { Action, ComponentNode, Project } from '../domain/types';
import { exportPlainPrd } from './plainPrd';

function actionText(action: Action): string {
  switch (action.type) {
    case 'openModal':
      return `打开节点 ${action.targetNodeId}`;
    case 'closeModal':
      return `关闭节点 ${action.targetNodeId}`;
    case 'showNode':
      return `显示组件 ${action.targetNodeId}`;
    case 'hideNode':
      return `隐藏组件 ${action.targetNodeId}`;
    case 'toggleNodeVisibility':
      return `切换组件显示状态 ${action.targetNodeId}`;
    case 'enableNode':
      return `启用组件 ${action.targetNodeId}`;
    case 'disableNode':
      return `禁用组件 ${action.targetNodeId}`;
    case 'toggleNodeDisabled':
      return `切换组件启用状态 ${action.targetNodeId}`;
    case 'navigate':
      return `跳转页面 ${action.targetPageId}`;
    case 'setVariable':
      return `设置变量 ${action.variableId}`;
    case 'refreshData':
      return `刷新数据源 ${action.dataSourceId}`;
    case 'showMessage':
      return `显示${action.level}提示：${action.message}`;
    case 'resetForm':
      return `重置表单 ${action.targetNodeId}`;
    case 'submitMock':
      return `提交 mock 数据到 ${action.dataSourceId}`;
  }
  return '执行交互动作';
}

function nodeLine(node: ComponentNode, depth: number): string {
  return `${'  '.repeat(depth)}- ${node.type}：${node.name}`;
}

function renderTree(project: Project): string {
  const lines: string[] = [];
  for (const page of project.pages) {
    lines.push(`### ${page.name}`);
    const visit = (nodeId: string, depth: number) => {
      const node = page.nodes[nodeId];
      if (!node) return;
      lines.push(nodeLine(node, depth));
      node.children?.forEach((childId) => visit(childId, depth + 1));
    };
    visit(page.rootNodeId, 0);
    lines.push('');
  }
  return lines.join('\n');
}

function renderFields(project: Project, type: 'Table' | 'Form'): string {
  const lines: string[] = [];
  for (const page of project.pages) {
    for (const node of walkPageNodes(page)) {
      if (node.type !== type) continue;
      lines.push(`### ${page.name} / ${node.name}`);
      lines.push('| 字段 | 说明 |');
      lines.push('|---|---|');
      const fields = type === 'Table' ? node.props.columns : node.props.fields;
      if (Array.isArray(fields)) {
        for (const field of fields) {
          if (field && typeof field === 'object') {
            const item = field as Record<string, unknown>;
            lines.push(`| ${String(item.key ?? '')} | ${String(item.title ?? item.label ?? '')} |`);
          }
        }
      }
      lines.push('');
    }
  }
  return lines.join('\n');
}

export function exportMarkdownPrd(project: Project): string {
  return exportPlainPrd(project);
}

export function exportTechnicalMarkdownPrd(project: Project): string {
  const suggestions = runAiRules(project);
  return `# ${project.name} PRD

## 1. 项目概述

项目名称：${project.name}  
后台类型：${project.businessType ?? 'custom'}  
项目描述：${project.description ?? ''}

## 2. 页面清单

| 页面 | 路由 | 用途 |
|---|---|---|
${project.pages.map((page) => `| ${page.name} | ${page.route} | ${page.purpose ?? ''} |`).join('\n')}

## 3. 页面结构

${renderTree(project)}

## 4. 交互说明

${project.interactions
  .map(
    (interaction) => `### ${interaction.name}

触发组件：${interaction.trigger.componentId}  
触发事件：${interaction.trigger.event}  
执行动作：
${interaction.actions.map((action, index) => `${index + 1}. ${actionText(action)}`).join('\n')}
`,
  )
  .join('\n')}

## 5. 数据字段

### 表格字段

${renderFields(project, 'Table')}

### 表单字段

${renderFields(project, 'Form')}

## 6. AI 风险提示

${suggestions.map((suggestion) => `- [${suggestion.severity}] ${suggestion.title}：${suggestion.description}`).join('\n')}

## 7. 数据源清单

| 数据源 | 类型 | 字段 |
|---|---|---|
${project.dataSources.map((source) => `| ${source.name} | ${source.type} | ${source.fields.map((field) => `${field.key}(${field.label})`).join(', ')} |`).join('\n')}
`;
}
