import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentNode } from '../domain/types';
import { getComponentDefinition } from '../registry/componentDefinitionRegistry';
import { GeneratedInspector } from '../editor/inspector/GeneratedInspector';

describe('GeneratedInspector', () => {
  it('renders Button props from prop schema and updates props by path', () => {
    const node: ComponentNode = { id: 'button_1', type: 'Button', name: 'Button', props: { text: '按钮', variant: 'primary', danger: false } };
    const updateProps = vi.fn();

    render(<GeneratedInspector node={node} definition={getComponentDefinition('Button')!} updateProps={updateProps} />);

    fireEvent.change(screen.getByDisplayValue('按钮'), { target: { value: '确认' } });

    expect(updateProps).toHaveBeenCalledWith({ text: '确认', variant: 'primary', danger: false });
    expect(screen.queryByText('Advanced / Debug')).toBeInTheDocument();
  });

  it('reuses table column editor for ProTable columns', () => {
    const node: ComponentNode = {
      id: 'pro_table_1',
      type: 'pro.ProTable',
      name: 'ProTable',
      props: { headerTitle: '数据列表', search: true, columns: [{ key: 'name', title: '名称' }] },
    };
    const updateProps = vi.fn();

    render(<GeneratedInspector node={node} definition={getComponentDefinition('pro.ProTable')!} updateProps={updateProps} />);

    fireEvent.change(screen.getByDisplayValue('名称'), { target: { value: '客户名称' } });

    expect(updateProps).toHaveBeenCalledWith(expect.objectContaining({ columns: [{ key: 'name', title: '客户名称' }] }));
  });
});
