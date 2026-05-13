import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ComponentNode } from '../domain/types';
import { DrawerRenderer } from '../registry/renderers/DrawerRenderer';
import { ModalRenderer } from '../registry/renderers/ModalRenderer';

const modalNode: ComponentNode = {
  id: 'confirm_modal',
  type: 'Modal',
  name: 'Confirm modal',
  props: { title: 'Submit confirmation', open: true },
  content: {
    body: 'Confirm submit?',
    footerButtons: [
      { key: 'cancel', label: 'Cancel', value: 'cancel' },
      { key: 'confirm', label: 'Confirm', value: 'confirm' },
    ],
  },
};

describe('Modal and Drawer renderers', () => {
  it('renders edited modal body and footer buttons', () => {
    render(<ModalRenderer node={modalNode} context={{ mode: 'edit' }} />);

    expect(screen.getByText('Confirm submit?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('renders edited drawer body and footer buttons', () => {
    render(<DrawerRenderer node={{ ...modalNode, type: 'Drawer' }} context={{ mode: 'edit' }} />);

    expect(screen.getByText('Confirm submit?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });
});
