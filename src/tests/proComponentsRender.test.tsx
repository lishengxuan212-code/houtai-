import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RenderNode } from '../registry/renderers';
import type { ComponentNode } from '../domain/types';

const context = { mode: 'preview' as const };

describe('ProComponents render adapters', () => {
  it('renders ProTable with configured title and columns', () => {
    const node: ComponentNode = {
      id: 'pro_table_1',
      type: 'pro.ProTable',
      name: '高级表格',
      props: { headerTitle: '订单列表', columns: [{ key: 'orderNo', title: '订单号' }], data: [{ orderNo: 'A001' }], pagination: true },
    };

    render(<RenderNode node={node} context={context} />);

    expect(screen.getByText('订单列表')).toBeInTheDocument();
    expect(screen.getByText('订单号')).toBeInTheDocument();
    expect(screen.getByText('A001')).toBeInTheDocument();
  });

  it('renders ProForm fields visually', () => {
    const node: ComponentNode = {
      id: 'pro_form_1',
      type: 'pro.ProForm',
      name: '高级表单',
      props: { title: '退款审批', fields: [{ key: 'reason', label: '退款原因', type: 'text', required: true }], submitText: '提交审批', resetText: '重置' },
    };

    render(<RenderNode node={node} context={context} />);

    expect(screen.getByText('退款审批')).toBeInTheDocument();
    expect(screen.getByText('退款原因')).toBeInTheDocument();
    expect(screen.getByText('提交审批')).toBeInTheDocument();
  });
});
