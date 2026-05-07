import { describe, expect, it } from 'vitest';
import { buildDependencyGraph } from '../domain/dependencyGraph';
import { applyOperation } from '../domain/operations';
import { initialProject } from '../store/initialProject';

describe('dependencyGraph', () => {
  it('finds field references', () => {
    const graph = buildDependencyGraph(initialProject);
    expect(graph.fieldRefs).toContainEqual({ sourceId: 'node_orders_table', dataSourceId: 'ds_orders', fieldKey: 'missingField' });
  });

  it('finds broken targetNodeId references after deleting a node', () => {
    const project = {
      ...initialProject,
      pages: initialProject.pages.map((page) =>
        page.id === 'page_orders'
          ? { ...page, nodes: Object.fromEntries(Object.entries(page.nodes).filter(([id]) => id !== 'node_add_order_modal')) }
          : page,
      ),
    };
    const graph = buildDependencyGraph(project);
    expect(graph.issues.some((issue) => issue.type === 'missingNode' && issue.targetId === 'node_add_order_modal')).toBe(true);
  });

  it('finds missing targetPageId', () => {
    const graph = buildDependencyGraph(initialProject);
    expect(graph.issues.some((issue) => issue.type === 'missingPage' && issue.targetId === 'page_missing_export')).toBe(true);
  });

  it('does not treat table action trigger ids as missing nodes', () => {
    const graph = buildDependencyGraph(initialProject);
    expect(graph.issues.some((issue) => issue.type === 'missingNode' && issue.targetId === 'node_orders_table')).toBe(false);
  });

  it('detects affected interaction when a trigger node is removed', () => {
    const project = applyOperation(initialProject, { type: 'deleteNode', pageId: 'page_orders', nodeId: 'button_add_order' });
    expect(project.interactions.some((interaction) => interaction.trigger.componentId === 'button_add_order')).toBe(false);
  });

  it('removes interactions that reference deleted descendants', () => {
    const project = applyOperation(initialProject, { type: 'deleteNode', pageId: 'page_orders', nodeId: 'node_add_order_modal' });
    expect(project.interactions.some((interaction) => interaction.trigger.componentId === 'node_add_order_form')).toBe(false);
    expect(project.interactions.some((interaction) => interaction.actions.some((action) => action.type === 'openModal' && action.targetNodeId === 'node_add_order_modal'))).toBe(false);
  });
});
