import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentNode } from '../domain/types';
import { InlineTextEditor } from '../editor/inlineEdit';
import { TableRenderer } from '../registry/renderers/TableRenderer';

const baseNode: ComponentNode = {
  id: 'table_activity',
  type: 'Table',
  name: '活动表格',
  props: {
    dataSourceId: 'ds_orders',
    columns: ['活动ID', '活动名称', '活动类型', '品牌', '开始时间', '结束时间', '状态', '操作', '发布状态', '获奖信息'],
    actions: ['详情'],
    rowActions: ['编辑', '复制链接', '...', '下载'],
  },
};

describe('TableRenderer', () => {
  it('renders string columns and row actions without object text in edit mode', () => {
    const { container } = render(<TableRenderer node={baseNode} context={{ mode: 'edit', getData: () => [] }} />);

    expect(screen.getAllByText('活动ID').length).toBeGreaterThan(0);
    expect(screen.getAllByText('活动名称').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/活动ID示例/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('详情').length).toBeGreaterThan(0);
    expect(screen.getAllByText('编辑').length).toBeGreaterThan(0);
    expect(screen.getAllByText('复制链接').length).toBeGreaterThan(0);
    expect(screen.getAllByText('下载').length).toBeGreaterThan(0);
    expect(container.textContent).not.toContain('[object Object]');
  });

  it('keeps wide tables horizontally scrollable with readable column widths', () => {
    const { container } = render(<TableRenderer node={baseNode} context={{ mode: 'preview', getData: () => [], dispatch: vi.fn() }} />);

    expect(container.querySelector('.ant-table-wrapper')).toHaveStyle({ minWidth: '1400px' });
    expect(container.querySelector('.ant-table-cell')).toHaveStyle({ minWidth: '140px' });
  });

  it('renders string columns and row actions without object text in preview mode', () => {
    const { container } = render(<TableRenderer node={baseNode} context={{ mode: 'preview', getData: () => [], dispatch: vi.fn() }} />);

    expect(screen.getAllByText('活动ID').length).toBeGreaterThan(0);
    expect(screen.getAllByText('活动名称').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/活动ID示例/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: '详情' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: '编辑' }).length).toBeGreaterThan(0);
    expect(container.textContent).not.toContain('[object Object]');
  });

  it('renders rows supplied as props.data from generated table JSON', () => {
    const node: ComponentNode = {
      id: 'table_vip',
      type: 'Table',
      name: 'VIP表格',
      props: {
        dataSourceId: 'ds_orders',
        columns: ['VIP类型', '变更时长', '时长类型', '变更类型', '开始时间', '结束时长', '任务阶段', '备注', '有效期'],
        actions: ['详情'],
        data: [
          {
            VIP类型: 'SVIP',
            变更时长: '+15 分钟',
            时长类型: '',
            变更类型: '广告',
            开始时间: '2026-4-28 15:45:00',
            结束时长: '35s',
            任务阶段: '1',
            备注: '',
            有效期: '2026-4-28 16:00:35',
          },
        ],
      },
    };

    render(<TableRenderer node={node} context={{ mode: 'edit', getData: () => [] }} />);

    expect(screen.getByText('SVIP')).toBeInTheDocument();
    expect(screen.getByText('+15 分钟')).toBeInTheDocument();
    expect(screen.getByText('广告')).toBeInTheDocument();
    expect(screen.getByText('2026-4-28 16:00:35')).toBeInTheDocument();
  });

  it('keeps row values visible when a string column is renamed into a titled column', () => {
    const node: ComponentNode = {
      id: 'table_renamed_column',
      type: 'Table',
      name: '活动表格',
      props: {
        columns: [{ key: '活动名称', title: '活动标题' }],
        rows: [{ id: 'row_1', 活动名称: '春节活动' }],
      },
    };

    render(<TableRenderer node={node} context={{ mode: 'preview', getData: () => [], dispatch: vi.fn() }} />);

    expect(screen.getAllByText('活动标题').length).toBeGreaterThan(0);
    expect(screen.getByText('春节活动')).toBeInTheDocument();
  });

  it('commits double-click table cell text edits through inline editing', () => {
    const onCommit = vi.fn();
    const node: ComponentNode = {
      id: 'table_inline_edit',
      type: 'Table',
      name: '活动表格',
      props: {
        columns: ['活动名称'],
        rows: [{ id: 'row_1', 活动名称: '春节活动' }],
      },
    };

    render(
      <TableRenderer
        node={node}
        context={{
          mode: 'edit',
          getData: () => [],
          inlineEdit: {
            text: ({ value }) => value,
            arrayItemText: ({ value }) => value,
            tableCellText: ({ value }) => <InlineTextEditor value={value} onCommit={onCommit} />,
          },
        }}
      />,
    );

    fireEvent.doubleClick(screen.getByText('春节活动'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '元宵活动' } });
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

    expect(onCommit).toHaveBeenCalledWith('元宵活动');
  });

  it('renders grouped rowActions in their matching columns', () => {
    const node: ComponentNode = {
      id: 'table_activity_grouped',
      type: 'Table',
      name: '活动表格',
      props: {
        dataSourceId: 'ds_orders',
        columns: ['活动ID', '活动名称', '活动类型', '品牌', '开始时间', '结束时间', '状态', '操作', '发布状态', '获奖信息'],
        actions: ['详情'],
        rowActions: {
          操作列: ['编辑', '复制链接', '...'],
          发布状态列: ['已发布', '取消发布'],
          获奖信息列: ['下载'],
        },
      },
    };

    const { container } = render(<TableRenderer node={node} context={{ mode: 'edit', getData: () => [] }} />);

    expect(screen.getAllByText('操作').length).toBeGreaterThan(0);
    expect(screen.getAllByText('发布状态').length).toBeGreaterThan(0);
    expect(screen.getAllByText('获奖信息').length).toBeGreaterThan(0);
    expect(screen.getAllByText('详情').length).toBeGreaterThan(0);
    expect(screen.getAllByText('编辑').length).toBeGreaterThan(0);
    expect(screen.getAllByText('复制链接').length).toBeGreaterThan(0);
    expect(screen.getAllByText('已发布').length).toBeGreaterThan(0);
    expect(screen.getAllByText('取消发布').length).toBeGreaterThan(0);
    expect(screen.getAllByText('下载').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.ant-table-thead th')).toHaveLength(10);
  });

  it('renders grouped rowActions as separate preview buttons without dropping columns', () => {
    const node: ComponentNode = {
      id: 'table_activity_grouped_preview',
      type: 'Table',
      name: '活动表格',
      props: {
        dataSourceId: 'ds_orders',
        columns: ['活动ID', '活动名称', '活动类型', '品牌', '开始时间', '结束时间', '状态', '操作', '发布状态', '获奖信息'],
        actions: ['详情'],
        rowActions: {
          操作列: ['编辑', '复制链接', '...'],
          发布状态列: ['已发布', '取消发布'],
          获奖信息列: ['下载'],
        },
      },
    };

    const { container } = render(<TableRenderer node={node} context={{ mode: 'preview', getData: () => [], dispatch: vi.fn() }} />);

    expect(screen.getAllByText('操作').length).toBeGreaterThan(0);
    expect(screen.getAllByText('发布状态').length).toBeGreaterThan(0);
    expect(screen.getAllByText('获奖信息').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: '详情' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: '编辑' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: '已发布' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: '下载' }).length).toBeGreaterThan(0);
    expect(container.textContent).not.toContain('[object Object]');
  });
});
