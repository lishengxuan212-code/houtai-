import { buildDependencyGraph } from '../domain/dependencyGraph';
import { walkPageNodes } from '../domain/selectors';
import type { AiSuggestion, Interaction, Project } from '../domain/types';

function hasInteraction(project: Project, componentId: string, event?: string): boolean {
  return project.interactions.some((interaction) => interaction.enabled && interaction.trigger.componentId === componentId && (!event || interaction.trigger.event === event));
}

function nodeLabel(project: Project, nodeId: string): string {
  for (const page of project.pages) {
    const node = page.nodes[nodeId];
    if (node) return node.name;
  }
  return nodeId;
}

function unboundButtons(project: Project): AiSuggestion[] {
  const suggestions: AiSuggestion[] = [];
  for (const page of project.pages) {
    for (const node of walkPageNodes(page)) {
      if (node.type !== 'Button') continue;
      if (hasInteraction(project, node.id, 'click')) continue;
      suggestions.push({
        id: `suggestion_unbound_button_${node.id}`,
        severity: 'warning',
        category: 'interaction',
        title: '按钮未绑定交互',
        description: `“${String(node.props.text ?? node.name)}”按钮当前没有 click 交互，预览模式中点击后不会发生动作。`,
        affectedNodeIds: [node.id],
        canApplyAutomatically: false,
      });
    }
  }
  return suggestions;
}

function formsWithoutSubmit(project: Project): AiSuggestion[] {
  const suggestions: AiSuggestion[] = [];
  for (const page of project.pages) {
    for (const node of walkPageNodes(page)) {
      if (node.type === 'Form' && !hasInteraction(project, node.id, 'submit')) {
        suggestions.push({
          id: `suggestion_form_without_submit_${node.id}`,
          severity: 'error',
          category: 'flow',
          title: '表单缺少提交动作',
          description: `“${node.name}”没有 submit 交互，用户提交后不会保存 mock 数据或显示结果。`,
          affectedNodeIds: [node.id],
          canApplyAutomatically: false,
        });
      }
    }
  }
  return suggestions;
}

function deleteWithoutConfirm(project: Project): AiSuggestion[] {
  return project.interactions
    .filter((interaction) => {
      const triggerText = nodeLabel(project, interaction.trigger.componentId);
      const riskyName = `${interaction.name} ${triggerText}`.includes('删除');
      const deletes = interaction.actions.some((action) => action.type === 'submitMock' && action.operation === 'delete');
      const hasConfirm = interaction.actions.some((action) => action.type === 'openModal' || (action.type === 'showMessage' && action.message.includes('确认')));
      return (riskyName || deletes) && !hasConfirm;
    })
    .map((interaction) => ({
      id: `suggestion_delete_without_confirm_${interaction.id}`,
      severity: 'error',
      category: 'best_practice',
      title: '删除操作缺少二次确认',
      description: '检测到删除操作直接执行 mock 删除或没有确认流程，建议增加确认弹窗或确认动作。',
      affectedInteractionIds: [interaction.id],
      affectedNodeIds: [interaction.trigger.componentId],
      canApplyAutomatically: false,
    }));
}

function modalsWithoutOpen(project: Project): AiSuggestion[] {
  const opened = new Set<string>();
  project.interactions.forEach((interaction) =>
    interaction.actions.forEach((action) => {
      if (action.type === 'openModal') opened.add(action.targetNodeId);
    }),
  );
  const suggestions: AiSuggestion[] = [];
  for (const page of project.pages) {
    for (const node of walkPageNodes(page)) {
      if ((node.type === 'Modal' || node.type === 'Drawer') && !opened.has(node.id)) {
        suggestions.push({
          id: `suggestion_modal_without_open_${node.id}`,
          severity: 'warning',
          category: 'flow',
          title: '弹窗或抽屉缺少打开入口',
          description: `“${node.name}”没有任何 openModal 入口，预览态无法被用户打开。`,
          affectedNodeIds: [node.id],
          canApplyAutomatically: false,
        });
      }
    }
  }
  return suggestions;
}

function brokenReferences(project: Project): AiSuggestion[] {
  return buildDependencyGraph(project).issues.map((issue) => {
    const suggestion: AiSuggestion = {
      id: `suggestion_${issue.id}`,
      severity: 'error',
      category: issue.type === 'missingFieldReference' ? 'schema' : 'interaction',
      title: '引用断链',
      description: issue.message,
      canApplyAutomatically: false,
    };
    if (issue.type === 'missingNode' || issue.type === 'missingFieldReference') suggestion.affectedNodeIds = [issue.sourceId];
    if (issue.sourceId.startsWith('interaction_')) suggestion.affectedInteractionIds = [issue.sourceId];
    return suggestion;
  });
}

function tableActionsWithoutHandlers(project: Project): AiSuggestion[] {
  const suggestions: AiSuggestion[] = [];
  for (const page of project.pages) {
    for (const node of walkPageNodes(page)) {
      if (node.type !== 'Table') continue;
      const actions = Array.isArray(node.props.actions) ? node.props.actions : [];
      for (const action of actions) {
        const componentId = `${node.id}:${String(action)}`;
        if (!hasInteraction(project, componentId, 'click')) {
          suggestions.push({
            id: `suggestion_table_action_unbound_${componentId}`,
            severity: 'warning',
            category: 'interaction',
            title: '表格操作未绑定交互',
            description: `表格“${node.name}”的操作“${String(action)}”没有 click 交互。`,
            affectedNodeIds: [node.id],
            canApplyAutomatically: false,
          });
        }
      }
    }
  }
  return suggestions;
}

function formFieldsMissingLabelOrKey(project: Project): AiSuggestion[] {
  const suggestions: AiSuggestion[] = [];
  for (const page of project.pages) {
    for (const node of walkPageNodes(page)) {
      if (node.type !== 'Form') continue;
      const fields = Array.isArray(node.props.fields) ? node.props.fields : [];
      fields.forEach((field, index) => {
        if (!field || typeof field !== 'object') return;
        const item = field as Record<string, unknown>;
        if (!item.key || !item.label) {
          suggestions.push({
            id: `suggestion_form_field_missing_${node.id}_${index}`,
            severity: 'error',
            category: 'schema',
            title: '表单字段缺少 label 或 key',
            description: `“${node.name}”第 ${index + 1} 个字段缺少 label 或 key，会影响绑定、校验和 PRD 导出。`,
            affectedNodeIds: [node.id],
            canApplyAutomatically: false,
          });
        }
      });
    }
  }
  return suggestions;
}

function disabledInteractions(project: Project): AiSuggestion[] {
  return project.interactions
    .filter((interaction: Interaction) => !interaction.enabled)
    .map((interaction) => ({
      id: `suggestion_disabled_interaction_${interaction.id}`,
      severity: 'info',
      category: 'interaction',
      title: '交互已禁用',
      description: `“${interaction.name}”处于禁用状态，预览模式不会执行。`,
      affectedInteractionIds: [interaction.id],
      canApplyAutomatically: false,
    }));
}

export function runAiRules(project: Project): AiSuggestion[] {
  return [
    ...unboundButtons(project),
    ...formsWithoutSubmit(project),
    ...deleteWithoutConfirm(project),
    ...modalsWithoutOpen(project),
    ...brokenReferences(project),
    ...tableActionsWithoutHandlers(project),
    ...formFieldsMissingLabelOrKey(project),
    ...disabledInteractions(project),
  ].sort((a, b) => {
    const order = { error: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
}

export function runAiRulesForPage(project: Project, pageId: string): AiSuggestion[] {
  const page = project.pages.find((item) => item.id === pageId);
  if (!page) return [];
  const nodeIds = new Set(Object.keys(page.nodes));
  const scopedProject: Project = {
    ...project,
    pages: [page],
    interactions: project.interactions.filter((interaction) => {
      const triggerNodeId = interaction.trigger.componentId.split(':')[0] ?? interaction.trigger.componentId;
      return nodeIds.has(triggerNodeId);
    }),
  };
  return runAiRules(scopedProject).filter((suggestion) => {
    const affectedNodes = suggestion.affectedNodeIds ?? [];
    if (affectedNodes.length === 0) return true;
    return affectedNodes.some((nodeId) => nodeIds.has(nodeId.split(':')[0] ?? nodeId));
  });
}
