import type { Action, Binding, Condition, Project, ValueRef } from './types';

export type DependencyIssue = {
  id: string;
  type: 'missingNode' | 'missingPage' | 'missingDataSource' | 'missingVariable' | 'missingFieldReference';
  sourceId: string;
  targetId: string;
  message: string;
};

export type DependencyGraph = {
  nodeIds: Set<string>;
  pageIds: Set<string>;
  dataSourceIds: Set<string>;
  variableIds: Set<string>;
  fieldRefs: { sourceId: string; dataSourceId: string; fieldKey: string }[];
  issues: DependencyIssue[];
};

function addValueRefIssue(ref: ValueRef, sourceId: string, graph: DependencyGraph) {
  if (ref.kind === 'variable' && !graph.variableIds.has(ref.variableId)) {
    graph.issues.push({
      id: `missing_variable_${sourceId}_${ref.variableId}`,
      type: 'missingVariable',
      sourceId,
      targetId: ref.variableId,
      message: `Interaction ${sourceId} references missing variable ${ref.variableId}.`,
    });
  }
}

function scanCondition(condition: Condition, sourceId: string, graph: DependencyGraph) {
  addValueRefIssue(condition.left, sourceId, graph);
  if (condition.right) addValueRefIssue(condition.right, sourceId, graph);
}

function scanAction(action: Action, sourceId: string, graph: DependencyGraph) {
  if ((action.type === 'openModal' || action.type === 'closeModal' || action.type === 'resetForm') && !graph.nodeIds.has(action.targetNodeId)) {
    graph.issues.push({
      id: `missing_node_${sourceId}_${action.targetNodeId}`,
      type: 'missingNode',
      sourceId,
      targetId: action.targetNodeId,
      message: `Interaction ${sourceId} references missing node ${action.targetNodeId}.`,
    });
  }
  if (action.type === 'navigate' && !graph.pageIds.has(action.targetPageId)) {
    graph.issues.push({
      id: `missing_page_${sourceId}_${action.targetPageId}`,
      type: 'missingPage',
      sourceId,
      targetId: action.targetPageId,
      message: `Interaction ${sourceId} references missing page ${action.targetPageId}.`,
    });
  }
  if ((action.type === 'refreshData' || action.type === 'submitMock') && !graph.dataSourceIds.has(action.dataSourceId)) {
    graph.issues.push({
      id: `missing_data_source_${sourceId}_${action.dataSourceId}`,
      type: 'missingDataSource',
      sourceId,
      targetId: action.dataSourceId,
      message: `Interaction ${sourceId} references missing data source ${action.dataSourceId}.`,
    });
  }
  if (action.type === 'setVariable') {
    if (!graph.variableIds.has(action.variableId)) {
      graph.issues.push({
        id: `missing_variable_${sourceId}_${action.variableId}`,
        type: 'missingVariable',
        sourceId,
        targetId: action.variableId,
        message: `Interaction ${sourceId} writes missing variable ${action.variableId}.`,
      });
    }
    addValueRefIssue(action.value, sourceId, graph);
  }
}

function scanBinding(binding: Binding, sourceId: string, graph: DependencyGraph) {
  if (binding.source === 'variable' && !graph.variableIds.has(binding.path)) {
    graph.issues.push({
      id: `missing_variable_${sourceId}_${binding.path}`,
      type: 'missingVariable',
      sourceId,
      targetId: binding.path,
      message: `Node ${sourceId} references missing variable ${binding.path}.`,
    });
  }
  if (binding.source === 'field') {
    const [dataSourceId, fieldKey] = binding.path.split('.');
    if (!dataSourceId || !fieldKey) return;
    graph.fieldRefs.push({ sourceId, dataSourceId, fieldKey });
  }
}

function baseComponentId(componentId: string): string {
  return componentId.split(':')[0] ?? componentId;
}

export function buildDependencyGraph(project: Project): DependencyGraph {
  const graph: DependencyGraph = {
    nodeIds: new Set(),
    pageIds: new Set(project.pages.map((page) => page.id)),
    dataSourceIds: new Set(project.dataSources.map((source) => source.id)),
    variableIds: new Set(project.variables.map((variable) => variable.id)),
    fieldRefs: [],
    issues: [],
  };

  for (const page of project.pages) {
    for (const node of Object.values(page.nodes)) {
      graph.nodeIds.add(node.id);
    }
  }

  for (const page of project.pages) {
    if (!graph.nodeIds.has(page.rootNodeId)) {
      graph.issues.push({
        id: `missing_root_${page.id}_${page.rootNodeId}`,
        type: 'missingNode',
        sourceId: page.id,
        targetId: page.rootNodeId,
        message: `Page ${page.name} references missing root node ${page.rootNodeId}.`,
      });
    }
    for (const node of Object.values(page.nodes)) {
      for (const childId of node.children ?? []) {
        if (!graph.nodeIds.has(childId)) {
          graph.issues.push({
            id: `missing_child_${node.id}_${childId}`,
            type: 'missingNode',
            sourceId: node.id,
            targetId: childId,
            message: `Node ${node.name} references missing child node ${childId}.`,
          });
        }
      }
      Object.values(node.bindings ?? {}).forEach((binding) => scanBinding(binding, node.id, graph));
    }
  }

  for (const interaction of project.interactions) {
    const triggerBaseId = baseComponentId(interaction.trigger.componentId);
    if (!graph.nodeIds.has(triggerBaseId)) {
      graph.issues.push({
        id: `missing_trigger_${interaction.id}_${triggerBaseId}`,
        type: 'missingNode',
        sourceId: interaction.id,
        targetId: triggerBaseId,
        message: `Interaction ${interaction.name} has missing trigger node ${triggerBaseId}.`,
      });
    }
    interaction.conditions?.forEach((condition) => scanCondition(condition, interaction.id, graph));
    interaction.actions.forEach((action) => scanAction(action, interaction.id, graph));
  }

  for (const ref of graph.fieldRefs) {
    const source = project.dataSources.find((item) => item.id === ref.dataSourceId);
    if (!source?.fields.some((field) => field.key === ref.fieldKey)) {
      graph.issues.push({
        id: `missing_field_${ref.sourceId}_${ref.dataSourceId}_${ref.fieldKey}`,
        type: 'missingFieldReference',
        sourceId: ref.sourceId,
        targetId: `${ref.dataSourceId}.${ref.fieldKey}`,
        message: `Node ${ref.sourceId} references missing field ${ref.dataSourceId}.${ref.fieldKey}.`,
      });
    }
  }

  return graph;
}
