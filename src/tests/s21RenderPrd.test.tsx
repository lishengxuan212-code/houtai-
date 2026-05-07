import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ComponentNode, Project } from '../domain/types';
import { RenderNode } from '../registry/renderers';
import { exportPlainPrd } from '../export/plainPrd';

describe('S2.1 render and PRD sync', () => {
  it('renders Dropdown menu items from Project JSON props', () => {
    const node: ComponentNode = {
      id: 'dropdown_1',
      type: 'Dropdown',
      name: '更多操作',
      props: { text: '更多', menuItems: [{ id: 'customer', key: 'customer', label: '客户管理' }] },
    };

    render(<RenderNode node={node} context={{ mode: 'preview' }} />);

    expect(screen.getByText('更多')).toBeInTheDocument();
  });

  it('renders Table rows from row data props', () => {
    const node: ComponentNode = {
      id: 'table_1',
      type: 'Table',
      name: '订单表格',
      props: { columns: [{ key: 'orderNo', title: '订单号' }], rows: [{ id: 'row_1', orderNo: 'O20249999' }] },
    };

    render(<RenderNode node={node} context={{ mode: 'preview' }} />);

    expect(screen.getByText('O20249999')).toBeInTheDocument();
  });

  it('describes Dropdown menu items and table row operations in plain PRD', () => {
    const project: Project = {
      id: 'project_1',
      name: '订单系统',
      pages: [
        {
          id: 'page_1',
          name: '订单页',
          route: '/orders',
          rootNodeId: 'root',
          nodes: {
            root: { id: 'root', type: 'PageContainer', name: '订单页', props: {}, children: ['dropdown_1', 'table_1'] },
            dropdown_1: {
              id: 'dropdown_1',
              type: 'Dropdown',
              name: '更多操作',
              props: { text: '更多', menuItems: [{ id: 'customer', key: 'customer', label: '客户管理' }] },
            },
            table_1: {
              id: 'table_1',
              type: 'Table',
              name: '订单表格',
              props: { columns: [{ key: 'orderNo', title: '订单号' }], actions: ['详情'], rows: [{ id: 'row_1', orderNo: 'O20249999' }] },
            },
          },
        },
      ],
      dataSources: [],
      variables: [],
      interactions: [],
      version: 1,
      createdAt: '2026-05-07T00:00:00.000Z',
      updatedAt: '2026-05-07T00:00:00.000Z',
    };

    const prd = exportPlainPrd(project);

    expect(prd).toContain('客户管理');
    expect(prd).toContain('订单号');
    expect(prd).toContain('详情');
  });
});
