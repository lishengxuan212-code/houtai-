import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TableColumnBuilder } from './TableColumnBuilder';

describe('TableColumnBuilder', () => {
  it('renders string columns as editable column names without field-key controls', () => {
    const onChange = vi.fn();

    render(<TableColumnBuilder columns={['活动ID', '活动名称', '活动类型', '品牌']} onChange={onChange} />);

    expect(screen.getByDisplayValue('活动ID')).toBeInTheDocument();
    expect(screen.getByDisplayValue('活动名称')).toBeInTheDocument();
    expect(screen.getByDisplayValue('活动类型')).toBeInTheDocument();
    expect(screen.queryByText('字段 key')).not.toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue('活动名称'), { target: { value: '活动标题' } });

    expect(onChange).toHaveBeenCalledWith(['活动ID', { key: '活动名称', title: '活动标题' }, '活动类型', '品牌']);
  });

  it('edits object columns by title while preserving their existing keys', () => {
    const onChange = vi.fn();

    render(<TableColumnBuilder columns={[{ key: 'activityId', title: '活动ID' }]} onChange={onChange} />);

    fireEvent.change(screen.getByDisplayValue('活动ID'), { target: { value: '活动编号' } });

    expect(onChange).toHaveBeenCalledWith([{ key: 'activityId', title: '活动编号' }]);
    expect(screen.queryByText('字段 key')).not.toBeInTheDocument();
  });

  it('keeps the active column input mounted while typing', () => {
    const { rerender } = render(<TableColumnBuilder columns={['活动名称']} onChange={vi.fn()} />);
    const input = screen.getByDisplayValue('活动名称');

    fireEvent.change(input, { target: { value: '活动标题' } });
    rerender(<TableColumnBuilder columns={[{ key: '活动名称', title: '活动标题' }]} onChange={vi.fn()} />);

    expect(screen.getByDisplayValue('活动标题')).toBe(input);
  });
});
