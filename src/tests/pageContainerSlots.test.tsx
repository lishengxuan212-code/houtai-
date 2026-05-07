import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ComponentNode } from '../domain/types';
import { RenderNode } from '../registry/renderers';

describe('PageContainer slots', () => {
  it('hides description region when disabled', () => {
    const node: ComponentNode = {
      id: 'page_container_1',
      type: 'PageContainer',
      name: '订单管理',
      props: {
        title: '订单管理',
        description: '查询、查看和处理订单',
        regions: { showTitle: true, showDescription: false, showToolbar: true, showContent: true, showFooter: false },
      },
      children: [],
    };

    render(<RenderNode node={node} context={{ mode: 'preview' }} />);

    expect(screen.getByText('订单管理')).toBeInTheDocument();
    expect(screen.queryByText('查询、查看和处理订单')).not.toBeInTheDocument();
    expect(screen.getByText('工具栏区')).toBeInTheDocument();
  });
});
