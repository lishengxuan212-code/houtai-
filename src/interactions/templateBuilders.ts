import { createId } from '../domain/ids';
import type { Action, ComponentEvent, Interaction, Project } from '../domain/types';

export type InteractionTemplateId =
  | 'buttonOpenModal'
  | 'closeModal'
  | 'navigatePage'
  | 'formSubmit'
  | 'searchRefreshTable'
  | 'deleteWithConfirm'
  | 'showMessage';

export type InteractionTemplateInput = {
  templateId: InteractionTemplateId;
  triggerComponentId: string;
  targetNodeId?: string;
  targetPageId?: string;
  dataSourceId?: string;
  message?: string;
  messageLevel?: 'success' | 'info' | 'warning' | 'error';
};

export type InteractionTemplateResult = {
  interactions: Interaction[];
  errors: string[];
};

function allNodes(project: Project) {
  return project.pages.flatMap((page) => Object.values(page.nodes));
}

function nodeExists(project: Project, nodeId: string | undefined): boolean {
  return Boolean(nodeId && allNodes(project).some((node) => node.id === nodeId));
}

function pageExists(project: Project, pageId: string | undefined): boolean {
  return Boolean(pageId && project.pages.some((page) => page.id === pageId));
}

function dataSourceExists(project: Project, dataSourceId: string | undefined): boolean {
  return Boolean(dataSourceId && project.dataSources.some((source) => source.id === dataSourceId));
}

function interaction(name: string, componentId: string, event: ComponentEvent, actions: Action[]): Interaction {
  return {
    id: createId('interaction'),
    name,
    trigger: { componentId, event },
    actions,
    enabled: true,
  };
}

export function buildInteractionTemplate(project: Project, input: InteractionTemplateInput): InteractionTemplateResult {
  const errors: string[] = [];
  if (!nodeExists(project, input.triggerComponentId.split(':')[0])) errors.push('触发组件不存在');

  switch (input.templateId) {
    case 'buttonOpenModal': {
      if (!nodeExists(project, input.targetNodeId)) errors.push('目标组件不存在');
      if (errors.length > 0) return { interactions: [], errors };
      return {
        errors,
        interactions: [interaction('按钮打开弹窗', input.triggerComponentId, 'click', [{ type: 'openModal', targetNodeId: input.targetNodeId! }])],
      };
    }
    case 'closeModal': {
      if (!nodeExists(project, input.targetNodeId)) errors.push('目标组件不存在');
      if (errors.length > 0) return { interactions: [], errors };
      return {
        errors,
        interactions: [interaction('关闭弹窗', input.triggerComponentId, 'click', [{ type: 'closeModal', targetNodeId: input.targetNodeId! }])],
      };
    }
    case 'navigatePage': {
      if (!pageExists(project, input.targetPageId)) errors.push('目标页面不存在');
      if (errors.length > 0) return { interactions: [], errors };
      return {
        errors,
        interactions: [interaction('跳转页面', input.triggerComponentId, 'click', [{ type: 'navigate', targetPageId: input.targetPageId! }])],
      };
    }
    case 'formSubmit': {
      if (!dataSourceExists(project, input.dataSourceId)) errors.push('数据源不存在');
      if (input.targetNodeId && !nodeExists(project, input.targetNodeId)) errors.push('目标组件不存在');
      if (errors.length > 0) return { interactions: [], errors };
      const actions: Action[] = [{ type: 'submitMock', dataSourceId: input.dataSourceId!, payloadFrom: 'form', operation: 'create' }];
      if (input.targetNodeId) actions.push({ type: 'closeModal', targetNodeId: input.targetNodeId });
      actions.push({ type: 'refreshData', dataSourceId: input.dataSourceId! });
      actions.push({ type: 'showMessage', level: input.messageLevel ?? 'success', message: input.message ?? '提交成功' });
      return { errors, interactions: [interaction('表单提交', input.triggerComponentId, 'submit', actions)] };
    }
    case 'searchRefreshTable': {
      if (!dataSourceExists(project, input.dataSourceId)) errors.push('数据源不存在');
      if (errors.length > 0) return { interactions: [], errors };
      return {
        errors,
        interactions: [
          interaction('搜索刷新表格', input.triggerComponentId, 'search', [
            { type: 'setVariable', variableId: 'var_search_params', value: { kind: 'event', path: 'values' } },
            { type: 'refreshData', dataSourceId: input.dataSourceId! },
          ]),
        ],
      };
    }
    case 'showMessage':
      return {
        errors,
        interactions: [
          interaction('显示提示', input.triggerComponentId, 'click', [
            { type: 'showMessage', level: input.messageLevel ?? 'success', message: input.message ?? '操作成功' },
          ]),
        ],
      };
    case 'deleteWithConfirm': {
      if (!dataSourceExists(project, input.dataSourceId)) errors.push('数据源不存在');
      if (!nodeExists(project, input.targetNodeId)) errors.push('目标组件不存在');
      if (errors.length > 0) return { interactions: [], errors };
      return {
        errors,
        interactions: [
          interaction('删除前确认', input.triggerComponentId, 'click', [{ type: 'openModal', targetNodeId: input.targetNodeId! }]),
          interaction('确认删除', input.targetNodeId!, 'click', [
            { type: 'submitMock', dataSourceId: input.dataSourceId!, payloadFrom: 'currentRow', operation: 'delete' },
            { type: 'closeModal', targetNodeId: input.targetNodeId! },
            { type: 'refreshData', dataSourceId: input.dataSourceId! },
            { type: 'showMessage', level: 'success', message: input.message ?? '删除成功' },
          ]),
        ],
      };
    }
  }
}
