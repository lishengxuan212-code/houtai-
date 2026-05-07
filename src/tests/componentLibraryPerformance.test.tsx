import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ComponentLibraryPanel } from '../editor/components/ComponentLibraryPanel';

describe('ComponentLibraryPanel performance behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces search input before changing rendered results', () => {
    render(<ComponentLibraryPanel />);

    const search = screen.getByPlaceholderText(/搜索|鎼滅储/);
    fireEvent.change(search, { target: { value: 'Table' } });

    expect(screen.queryByText('表格')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(180);
    });

    expect(screen.getByText('表格')).toBeInTheDocument();
    expect(screen.queryAllByText('按钮')).toHaveLength(0);
  });

  it('uses lightweight static previews in component cards', () => {
    render(<ComponentLibraryPanel />);

    expect(document.querySelector('.component-preview-table')).toBeTruthy();
    expect(document.querySelector('.component-card-preview .ant-table')).toBeFalsy();
  });
});
