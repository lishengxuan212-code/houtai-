import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiPanel } from '../editor/AiPanel';
import { ExportPanel } from '../editor/ExportPanel';
import { initialProject } from '../store/initialProject';
import { useProjectStore } from '../store/projectStore';
import * as markdownPrd from '../export/markdownPrd';

describe('async analysis performance boundaries', () => {
  beforeEach(() => {
    useProjectStore.getState().replaceProject(structuredClone(initialProject), initialProject.pages[0]?.id, initialProject.pages[0]?.rootNodeId);
    vi.restoreAllMocks();
  });

  it('keeps AI generation focused on image generation and settings', () => {
    const { container } = render(<AiPanel />);

    expect(screen.queryByText('检查当前项目')).not.toBeInTheDocument();
    expect(screen.getByText('图片生成后台')).toBeInTheDocument();

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickFileInput = vi.spyOn(fileInput, 'click');
    fireEvent.click(screen.getByLabelText('选择后台图片'));
    expect(clickFileInput).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByLabelText('模型配置'));
    expect(screen.getAllByText('视觉理解 / 结构生成')).toHaveLength(2);
  });

  it('does not generate PRD while rendering the export panel', () => {
    const exportMarkdownPrd = vi.spyOn(markdownPrd, 'exportMarkdownPrd');

    render(<ExportPanel />);

    expect(exportMarkdownPrd).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('生成 PRD'));

    expect(exportMarkdownPrd).toHaveBeenCalledTimes(1);
  });
});
