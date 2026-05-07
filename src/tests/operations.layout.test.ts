import { describe, expect, it } from 'vitest';
import { applyOperation } from '../domain/operations';
import { initialProject } from '../store/initialProject';

describe('layout operations', () => {
  it('stores container layout on a node without changing props', () => {
    const before = initialProject.pages[0]!.nodes.node_orders_toolbar!;
    const project = applyOperation(initialProject, {
      type: 'updateContainerLayout',
      pageId: 'page_orders',
      nodeId: 'node_orders_toolbar',
      layout: { mode: 'grid', columns: 3, gap: 10 },
    });
    const after = project.pages[0]!.nodes.node_orders_toolbar!;
    expect(after.containerLayout).toEqual({ mode: 'grid', columns: 3, gap: 10, align: 'top', justify: 'stretch' });
    expect(after.props).toEqual(before.props);
  });

  it('reorders children within the same parent by target node', () => {
    const project = applyOperation(initialProject, {
      type: 'reorderNode',
      pageId: 'page_orders',
      parentNodeId: 'node_orders_root',
      nodeId: 'node_orders_table',
      targetNodeId: 'node_orders_search',
    });

    expect(project.pages[0]!.nodes.node_orders_root!.children?.slice(0, 2)).toEqual(['node_orders_table', 'node_orders_search']);
  });

  it('moves a node under a new parent and removes it from the old parent', () => {
    const project = applyOperation(initialProject, {
      type: 'moveNodeToParent',
      pageId: 'page_orders',
      nodeId: 'button_export_orders',
      newParentNodeId: 'node_add_order_modal',
    });

    expect(project.pages[0]!.nodes.node_orders_toolbar!.children).not.toContain('button_export_orders');
    expect(project.pages[0]!.nodes.node_add_order_modal!.children).toContain('button_export_orders');
  });
});
