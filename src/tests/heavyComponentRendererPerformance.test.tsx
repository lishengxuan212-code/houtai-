import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RenderNode } from '../registry/renderers';
import type { ComponentNode } from '../domain/types';
import type { RendererContext } from '../registry/renderers/rendererTypes';

const editContext: RendererContext = {
  mode: 'edit',
  inlineEdit: {
    text: ({ value }) => value,
    arrayItemText: ({ value }) => value,
  },
};

const previewContext: RendererContext = {
  mode: 'preview',
  dispatch: vi.fn(),
};

function tableNode(type = 'Table'): ComponentNode {
  return {
    id: `node_${type}`,
    type,
    name: type,
    props: {
      columns: [
        { key: 'name', title: 'Name', search: true },
        { key: 'status', title: 'Status' },
      ],
      actions: ['Edit'],
      search: true,
      pagination: true,
      headerTitle: type,
    },
    data: {
      rows: [
        { id: '1', name: 'Order A', status: 'Open' },
        { id: '2', name: 'Order B', status: 'Closed' },
      ],
    },
  };
}

function formNode(type = 'Form'): ComponentNode {
  return {
    id: `node_${type}`,
    type,
    name: type,
    props: {
      submitText: 'Submit',
      fields: [
        { key: 'name', label: 'Name', type: 'text', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['Open'] },
      ],
    },
  };
}

describe('heavy component renderers', () => {
  it('uses the Ant Design table renderer in edit mode', () => {
    render(<RenderNode node={tableNode()} context={editContext} />);

    expect(document.querySelector('.ant-table')).toBeTruthy();
    expect(screen.getByText('Order A')).toBeInTheDocument();
  });

  it('uses runtime Table rendering in preview mode', () => {
    render(<RenderNode node={tableNode()} context={previewContext} />);

    expect(document.querySelector('.ant-table')).toBeTruthy();
  });

  it('uses preview-equivalent renderers for ProTable, EditableProTable, and ProForm in edit mode', () => {
    render(
      <>
        <RenderNode node={tableNode('pro.ProTable')} context={editContext} />
        <RenderNode node={tableNode('pro.EditableProTable')} context={editContext} />
        <RenderNode node={formNode('pro.ProForm')} context={editContext} />
      </>,
    );

    expect(document.querySelectorAll('.ant-table')).toHaveLength(2);
    expect(document.querySelector('.ant-form')).toBeTruthy();
    expect(screen.getAllByText('Order A')).toHaveLength(2);
  });

  it('uses the Ant Design form renderer in edit mode', () => {
    render(<RenderNode node={formNode()} context={editContext} />);

    expect(document.querySelector('.ant-form')).toBeTruthy();
    expect(screen.getByText('Name')).toBeInTheDocument();
  });
});
