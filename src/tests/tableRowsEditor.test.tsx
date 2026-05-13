import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentNode } from '../domain/types';
import { GeneratedInspector } from '../editor/inspector/GeneratedInspector';
import { generateRowsFromColumns } from '../editor/inspector/editors/tableRowsUtils';
import { createNode } from '../registry/createNode';
import { getComponentDefinition } from '../registry/componentDefinitionRegistry';

describe('table rows editor', () => {
  it('edits Table row cell values into data without JSON', () => {
    const node: ComponentNode = {
      id: 'table_1',
      type: 'Table',
      name: 'Table',
      props: {
        columns: [{ key: 'orderNo', title: 'Order No' }],
        rows: [{ id: 'row_1', orderNo: 'O20240101' }],
      },
    };
    const updateProps = vi.fn();
    const updateData = vi.fn();

    render(<GeneratedInspector node={node} definition={getComponentDefinition('Table')!} updateProps={updateProps} updateData={updateData} />);
    fireEvent.change(screen.getByDisplayValue('O20240101'), { target: { value: 'O20249999' } });

    expect(updateProps).not.toHaveBeenCalled();
    expect(updateData).toHaveBeenCalledWith({ rows: [{ id: 'row_1', orderNo: 'O20249999' }] });
  });

  it('uses existing props rows as editable data fallback for generated tables', () => {
    const node: ComponentNode = {
      id: 'table_1',
      type: 'Table',
      name: 'Table',
      props: {
        columns: [{ key: 'orderNo', title: '订单号' }],
        rows: [{ id: 'row_1', orderNo: 'A001' }],
      },
    };
    const updateData = vi.fn();

    render(<GeneratedInspector node={node} definition={getComponentDefinition('Table')!} updateProps={vi.fn()} updateData={updateData} />);
    fireEvent.change(screen.getByDisplayValue('A001'), { target: { value: 'A002' } });

    expect(updateData).toHaveBeenCalledWith({ rows: [{ id: 'row_1', orderNo: 'A002' }] });
  });

  it('generates example rows from columns', () => {
    expect(generateRowsFromColumns([{ key: 'orderNo', title: 'Order No' }, { key: 'status', title: 'Status' }], 1)).toEqual([
      { id: 'row_1', orderNo: 'Order No示例1', status: 'Status示例1' },
    ]);
  });

  it('normalizes string columns into editable generated rows', () => {
    expect(generateRowsFromColumns(['活动ID', '活动名称'], 1)).toEqual([{ id: 'row_1', 活动ID: '活动ID示例1', 活动名称: '活动名称示例1' }]);
  });

  it('creates generated tables with editable example rows when columns are string names', () => {
    const node = createNode('Table', {
      columns: ['活动ID', '活动名称'],
      actions: ['详情'],
      rowActions: ['编辑'],
    });

    expect(node.data?.rows).toEqual([
      { id: 'row_1', 活动ID: '活动ID示例1', 活动名称: '活动名称示例1' },
      { id: 'row_2', 活动ID: '活动ID示例2', 活动名称: '活动名称示例2' },
      { id: 'row_3', 活动ID: '活动ID示例3', 活动名称: '活动名称示例3' },
    ]);
  });

  it('creates generated tables with editable rows from props.data', () => {
    const node = createNode('Table', {
      columns: ['VIP类型', '变更时长'],
      data: [{ VIP类型: 'SVIP', 变更时长: '+15 分钟' }],
    });

    expect(node.data?.rows).toEqual([{ VIP类型: 'SVIP', 变更时长: '+15 分钟' }]);
  });
  it('creates ProTable rows from generated props data', () => {
    const node = createNode('pro.ProTable', {
      columns: [{ key: 'orderNo', title: 'Order No' }],
      data: [{ orderNo: 'A001' }],
    });

    expect(node.data?.rows).toEqual([{ orderNo: 'A001' }]);
  });

  it('creates ProForm content fields from generated props fields', () => {
    const node = createNode('pro.ProForm', {
      fields: [{ key: 'activityName', label: 'Activity Name', type: 'text', required: true }],
    });

    expect(node.content?.fields).toEqual([{ key: 'activityName', label: 'Activity Name', type: 'text', required: true }]);
  });

  it('creates modal content from generated body and footer buttons', () => {
    const node = createNode('Modal', {
      content: 'Confirm submit?',
      footerButtons: [{ key: 'confirm', label: 'Confirm', value: 'confirm' }],
    });

    expect(node.content).toMatchObject({
      body: 'Confirm submit?',
      footerButtons: [{ key: 'confirm', label: 'Confirm', value: 'confirm' }],
    });
  });
});
