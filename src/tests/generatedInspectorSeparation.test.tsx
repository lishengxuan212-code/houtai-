import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GeneratedInspector } from '../editor/inspector/GeneratedInspector';
import { getComponentDefinition } from '../registry/componentDefinitionRegistry';
import type { ComponentNode, JsonRecord } from '../domain/types';

describe('GeneratedInspector separated editing scopes', () => {
  it('writes content schema edits to node content instead of props', () => {
    const definition = getComponentDefinition('Dropdown');
    const node: ComponentNode = {
      id: 'dropdown_1',
      type: 'Dropdown',
      name: 'Actions',
      props: { text: 'Actions' },
      content: { menuItems: [{ id: 'view', key: 'view', label: 'View' }] },
    };
    const updateProps = vi.fn();
    const updateContent = vi.fn();

    render(
      <GeneratedInspector
        node={node}
        definition={definition!}
        updateProps={updateProps}
        updateContent={updateContent}
        updateData={vi.fn()}
        updateEvents={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByDisplayValue('View'), { target: { value: 'View details' } });

    expect(updateProps).not.toHaveBeenCalled();
    expect(updateContent).toHaveBeenCalledWith({ menuItems: [{ id: 'view', key: 'view', label: 'View details' }] });
  });

  it('writes data schema edits to node data instead of props', () => {
    const definition = getComponentDefinition('Table');
    const node: ComponentNode = {
      id: 'table_1',
      type: 'Table',
      name: 'Orders',
      props: { columns: [{ key: 'orderNo', title: 'Order No' }] },
      data: { rows: [{ id: 'row_1', orderNo: 'A001' }] },
    };
    const updateProps = vi.fn();
    const updateData = vi.fn();

    render(
      <GeneratedInspector
        node={node}
        definition={definition!}
        updateProps={updateProps}
        updateContent={vi.fn()}
        updateData={updateData}
        updateEvents={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByDisplayValue('A001'), { target: { value: 'A002' } });

    expect(updateProps).not.toHaveBeenCalled();
    expect(updateData).toHaveBeenCalledWith({ rows: [{ id: 'row_1', orderNo: 'A002' }] } satisfies JsonRecord);
  });
});
