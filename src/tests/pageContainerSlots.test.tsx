import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ComponentNode } from '../domain/types';
import { RenderNode } from '../registry/renderers';

describe('PageContainer slots', () => {
  it('renders title and description without configurable region switches', () => {
    const node: ComponentNode = {
      id: 'page_container_1',
      type: 'PageContainer',
      name: '订单管理',
      props: {
        title: '订单管理',
        description: '查询、查看和处理订单',
        regions: { showTitle: false, showDescription: false, showToolbar: true, showContent: false, showFooter: true },
      },
      children: [],
    };

    render(<RenderNode node={node} context={{ mode: 'preview' }} />);

    expect(screen.getByText('订单管理')).toBeInTheDocument();
    expect(screen.getByText('查询、查看和处理订单')).toBeInTheDocument();
    expect(screen.queryByText('工具栏区')).not.toBeInTheDocument();
    expect(screen.queryByText('底部操作区')).not.toBeInTheDocument();
  });
});
