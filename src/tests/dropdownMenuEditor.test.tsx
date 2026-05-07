import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentNode } from '../domain/types';
import { GeneratedInspector } from '../editor/inspector/GeneratedInspector';
import { getComponentDefinition } from '../registry/componentDefinitionRegistry';

describe('Dropdown menu editor', () => {
  it('edits menu item labels into content without JSON', () => {
    const node: ComponentNode = {
      id: 'dropdown_1',
      type: 'Dropdown',
      name: 'Dropdown',
      props: {
        text: 'Dropdown',
        menuItems: [
          { id: 'item1', key: 'item1', label: 'First item' },
          { id: 'item2', key: 'item2', label: 'Second item' },
        ],
      },
    };
    const updateProps = vi.fn();
    const updateContent = vi.fn();

    render(<GeneratedInspector node={node} definition={getComponentDefinition('Dropdown')!} updateProps={updateProps} updateContent={updateContent} />);
    fireEvent.change(screen.getByDisplayValue('First item'), { target: { value: 'Customer management' } });

    expect(updateProps).not.toHaveBeenCalled();
    expect(updateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        menuItems: [
          { id: 'item1', key: 'item1', label: 'Customer management' },
          { id: 'item2', key: 'item2', label: 'Second item' },
        ],
      }),
    );
  });
});
