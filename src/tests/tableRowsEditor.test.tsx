import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentNode } from '../domain/types';
import { GeneratedInspector } from '../editor/inspector/GeneratedInspector';
import { generateRowsFromColumns } from '../editor/inspector/editors/tableRowsUtils';
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
    expect(updateData).toHaveBeenCalledWith(expect.objectContaining({ rows: [{ id: 'row_1', orderNo: 'O20249999' }] }));
  });

  it('generates example rows from columns', () => {
    expect(generateRowsFromColumns([{ key: 'orderNo', title: 'Order No' }, { key: 'status', title: 'Status' }], 1)).toEqual([
      { id: 'row_1', orderNo: 'Order No1', status: 'Status1' },
    ]);
  });
});
