import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RenderNode } from '../registry/renderers';
import type { ComponentNode } from '../domain/types';

describe('IconWidget renderer', () => {
  it('renders an icon component instead of the icon name text', () => {
    const node: ComponentNode = {
      id: 'icon_search',
      type: 'IconWidget',
      name: 'Search icon',
      props: { icon: 'SearchOutlined', color: '#1677ff', size: 32 },
    };

    render(<RenderNode node={node} context={{ mode: 'edit' }} />);

    expect(screen.queryByText('SearchOutlined')).not.toBeInTheDocument();
    expect(screen.getByTestId('icon-widget-icon_search')).toHaveStyle({ color: '#1677ff', fontSize: '32px' });
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});
