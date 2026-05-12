import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ComponentLibraryPanel } from '../editor/components/ComponentLibraryPanel';

describe('ComponentLibraryPanel performance behavior', () => {
  it('debounces search input before changing rendered detail results', async () => {
    render(<ComponentLibraryPanel />);

    const search = screen.getByPlaceholderText(/搜索|search/i);
    const details = screen.getByTestId('component-library-detail-list');
    fireEvent.change(search, { target: { value: 'Table' } });

    expect(within(details).queryAllByText('按钮').length).toBeGreaterThan(0);

    await waitFor(() => expect(within(details).queryAllByText('按钮')).toHaveLength(0));
    expect(within(details).getAllByText('表格').length).toBeGreaterThan(0);
  });

  it('uses lightweight static previews in component cards', () => {
    render(<ComponentLibraryPanel />);

    fireEvent.click(screen.getByRole('button', { name: '菜单和表格' }));

    expect(document.querySelector('.component-preview-table')).toBeTruthy();
    expect(document.querySelector('.component-card-preview .ant-table')).toBeFalsy();
  });
});
