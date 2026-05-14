import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentNode } from '../domain/types';
import { getComponentDefinition } from '../registry/componentDefinitionRegistry';
import { GeneratedInspector } from '../editor/inspector/GeneratedInspector';

describe('GeneratedInspector', () => {
  it('renders Button props from prop schema and updates props by path', () => {
    const node: ComponentNode = { id: 'button_1', type: 'Button', name: 'Button', props: { text: 'Button', variant: 'primary', danger: false } };
    const updateProps = vi.fn();

    render(<GeneratedInspector node={node} definition={getComponentDefinition('Button')!} updateProps={updateProps} />);

    fireEvent.change(screen.getByDisplayValue('Button'), { target: { value: 'Confirm' } });

    expect(updateProps).toHaveBeenCalledWith({ text: 'Confirm', variant: 'primary', danger: false });
    expect(screen.getByText(/调试|璋冭瘯/)).toBeInTheDocument();
  });

  it('reuses table column editor for ProTable columns', () => {
    const node: ComponentNode = {
      id: 'pro_table_1',
      type: 'pro.ProTable',
      name: 'ProTable',
      props: { headerTitle: 'Data list', search: true, columns: [{ key: 'name', title: 'Name' }] },
    };
    const updateProps = vi.fn();

    render(<GeneratedInspector node={node} definition={getComponentDefinition('pro.ProTable')!} updateProps={updateProps} />);

    fireEvent.change(screen.getByDisplayValue('Name'), { target: { value: 'Customer name' } });

    expect(updateProps).toHaveBeenCalledWith(expect.objectContaining({ columns: [{ key: 'name', title: 'Customer name' }] }));
  });

  it('keeps form control labels and keys editable in the compact right inspector', () => {
    const node: ComponentNode = {
      id: 'select_1',
      type: 'Select',
      name: 'Select',
      props: {
        label: '*Status',
        fieldKey: 'badKey',
        options: ['All', 'Pending', 'Done'],
      },
    };
    const updateProps = vi.fn();
    const updateContent = vi.fn();

    render(
      <GeneratedInspector
        node={node}
        definition={getComponentDefinition('Select')!}
        updateProps={updateProps}
        updateContent={updateContent}
        hideTopBarProps
      />,
    );

    fireEvent.change(screen.getByDisplayValue('*Status'), { target: { value: '*Publish status' } });
    fireEvent.change(screen.getByDisplayValue('badKey'), { target: { value: 'publishStatus' } });
    fireEvent.change(screen.getAllByLabelText('Item label')[0]!, { target: { value: 'All status' } });

    expect(updateProps).toHaveBeenCalledWith(expect.objectContaining({ label: '*Publish status', fieldKey: 'badKey' }));
    expect(updateProps).toHaveBeenCalledWith(expect.objectContaining({ label: '*Status', fieldKey: 'publishStatus' }));
    expect(updateContent).toHaveBeenCalledWith({
      options: [
        { id: 'item1', key: 'All', label: 'All status', value: 'All' },
        { id: 'item2', key: 'Pending', label: 'Pending', value: 'Pending' },
        { id: 'item3', key: 'Done', label: 'Done', value: 'Done' },
      ],
    });
  });

  it('adds common JSON field editors for MUI select-like components', () => {
    const node: ComponentNode = {
      id: 'mui_select_1',
      type: 'MuiSelect',
      name: 'MuiSelect',
      props: {
        label: '*Status',
        fieldKey: 'badKey',
        options: ['All', 'Pending', 'Done'],
      },
    };
    const updateProps = vi.fn();

    render(<GeneratedInspector node={node} definition={getComponentDefinition('MuiSelect')!} updateProps={updateProps} hideTopBarProps />);

    fireEvent.change(screen.getByDisplayValue('badKey'), { target: { value: 'status' } });

    expect(screen.getByDisplayValue('*Status')).toBeInTheDocument();
    expect(updateProps).toHaveBeenCalledWith(expect.objectContaining({ fieldKey: 'status' }));
  });

  it.each([
    ['Cascader', 'content.options'],
    ['Checkbox', 'content.options'],
    ['Radio', 'content.options'],
    ['TreeSelect', 'content.treeData'],
    ['Breadcrumb', 'content.items'],
  ])('edits structured content for %s through the inspector', (type, path) => {
    const node: ComponentNode = {
      id: `${type}_1`,
      type,
      name: type,
      props: { label: type, fieldKey: 'field' },
      content: path === 'content.treeData' ? { treeData: [{ id: 'a', key: 'a', label: 'A', value: 'a' }] } : path === 'content.items' ? { items: [{ id: 'a', key: 'a', label: 'A' }] } : { options: [{ id: 'a', key: 'a', label: 'A', value: 'a' }] },
    };
    const updateContent = vi.fn();

    render(<GeneratedInspector node={node} definition={getComponentDefinition(type)!} updateProps={vi.fn()} updateContent={updateContent} hideTopBarProps />);

    fireEvent.change(screen.getAllByDisplayValue('A')[0]!, { target: { value: 'Edited' } });

    const key = path.split('.')[1]!;
    expect(updateContent).toHaveBeenCalledWith(expect.objectContaining({ [key]: [expect.objectContaining({ label: 'Edited' })] }));
  });
});
