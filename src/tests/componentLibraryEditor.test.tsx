import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ComponentLibraryPanel } from '../editor/components/ComponentLibraryPanel';
import { ComponentCard } from '../editor/components/ComponentCard';
import { ComponentSystemPanel } from '../editor/components/ComponentSystemPanel';
import { antdLibraryManifest } from '../registry/antdManifest';
import { createNode } from '../registry/createNode';
import { createComponentPreset } from '../registry/componentPresetRegistry';
import { clearComponentLibraryState, getComponentDefaultOverrides, restoreComponentDefaultProps, saveComponentDefaultProps, saveComponentNameOverride, saveComponentPreset } from '../store/componentLibraryStore';

describe('component library editor state', () => {
  it('keeps the library as icon-only cards without the old detail property editor', () => {
    render(<ComponentLibraryPanel />);

    expect(document.querySelector('.library-detail-panel')).toBeFalsy();
    expect(screen.queryByText('保存为默认配置')).not.toBeInTheDocument();
  });

  it('shows task-oriented vertical categories with detailed components', () => {
    render(<ComponentLibraryPanel />);

    expect(screen.getByTestId('component-library-category-list')).toBeInTheDocument();
    expect(screen.getByTestId('component-library-detail-list')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '基本元件' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '表单元件' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '菜单和表格' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'MUI' })).toBeInTheDocument();
    expect(screen.getAllByText(/矩形|按钮|H1/).length).toBeGreaterThan(0);
  });

  it('finds Accordion from search even when the active category is different', async () => {
    render(<ComponentLibraryPanel />);

    fireEvent.change(screen.getByPlaceholderText('搜索组件中文或英文'), { target: { value: 'Accordion' } });

    await waitFor(() => {
      expect(screen.getAllByText('手风琴').length).toBeGreaterThan(0);
    });
  });

  it('shows Accordion in the container category', async () => {
    render(<ComponentLibraryPanel />);

    fireEvent.click(screen.getByRole('button', { name: '容器和面板' }));

    await waitFor(() => {
      expect(screen.getAllByText('手风琴').length).toBeGreaterThan(0);
    });
  });

  it('shows MUI v7 components in the MUI category', async () => {
    render(<ComponentLibraryPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'MUI' }));

    await waitFor(() => {
      expect(screen.getAllByText('文本框').length).toBeGreaterThan(0);
      expect(screen.getAllByText('手风琴').length).toBeGreaterThan(0);
    });
  });

  it('adds and drags components from the whole Axure-style tile', () => {
    const button = antdLibraryManifest.find((item) => item.key === 'Button')!;
    const onAdd = vi.fn();
    render(<ComponentCard component={button} onAdd={onAdd} />);

    fireEvent.click(screen.getByRole('button', { name: '添加按钮' }));
    expect(onAdd).toHaveBeenCalledWith('Button');

    const setData = vi.fn();
    fireEvent.dragStart(screen.getByRole('button', { name: '添加按钮' }), {
      dataTransfer: {
        setData,
        effectAllowed: '',
      },
    });

    expect(setData).toHaveBeenCalledWith('application/x-admin-component', 'Button');
  });

  it('renames component display names through the component system panel', async () => {
    clearComponentLibraryState();
    const { unmount } = render(<ComponentSystemPanel />);

    fireEvent.change(screen.getByPlaceholderText('搜索组件名称 / 英文 / 类型'), { target: { value: 'WhitePanel' } });
    const input = await screen.findByLabelText('白色面板名称');
    fireEvent.change(input, { target: { value: '业务面板' } });
    fireEvent.click(screen.getAllByRole('button', { name: '保存名称' })[0]!);
    unmount();

    render(<ComponentLibraryPanel />);
    expect(await screen.findByText('业务面板')).toBeInTheDocument();
    expect(createNode('WhitePanel').name).toBe('业务面板');
  });

  it('searches components by the renamed display name', async () => {
    clearComponentLibraryState();
    saveComponentNameOverride('MuiAutocomplete', '下拉输入框');
    render(<ComponentLibraryPanel />);

    fireEvent.change(screen.getByPlaceholderText('搜索组件中文或英文'), { target: { value: '下拉输入框' } });

    await waitFor(() => {
      expect(screen.getAllByText('下拉输入框').length).toBeGreaterThan(0);
    });
  });

  it('saves default props for future nodes without changing existing node props', () => {
    clearComponentLibraryState();
    const existing = createNode('Button');

    saveComponentDefaultProps('Button', { text: '确认' }, '2026-05-07T00:00:00.000Z');
    const next = createNode('Button');

    expect(existing.props.text).not.toBe('确认');
    expect(next.props.text).toBe('确认');
    expect(getComponentDefaultOverrides().Button?.text).toBe('确认');
  });

  it('restores system defaults and persists component presets separately', () => {
    clearComponentLibraryState();
    saveComponentDefaultProps('Button', { text: '确认' }, '2026-05-07T00:00:00.000Z');
    restoreComponentDefaultProps('Button');
    const preset = createComponentPreset({
      name: '主要确认按钮',
      baseComponentType: 'Button',
      category: '通用',
      props: { text: '确认', variant: 'primary', danger: false },
      now: '2026-05-07T00:00:00.000Z',
    });

    saveComponentPreset(preset);

    expect(createNode('Button').props.text).not.toBe('确认');
    expect(getComponentDefaultOverrides().Button).toBeUndefined();
  });
});
