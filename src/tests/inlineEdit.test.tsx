import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RenderNode } from '../registry/renderers';
import type { ComponentNode } from '../domain/types';

describe('inline edit registry coverage', () => {
  it('allows ProTable column labels to use inline editing without changing keys', () => {
    const node: ComponentNode = {
      id: 'pro_table_1',
      type: 'pro.ProTable',
      name: '高级表格',
      props: { headerTitle: '订单列表', columns: [{ key: 'orderNo', title: '订单号' }], data: [] },
    };
    const arrayItemText = vi.fn(({ value }) => <span>{value}</span>);

    render(<RenderNode node={node} context={{ mode: 'edit', inlineEdit: { text: ({ value }) => value, arrayItemText } }} />);

    expect(screen.getByText('订单号')).toBeInTheDocument();
    expect(arrayItemText).toHaveBeenCalledWith(expect.objectContaining({ arrayProp: 'columns', itemKey: 'orderNo', labelKey: 'title', value: '订单号' }));
  });
});
