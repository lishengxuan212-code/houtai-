import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiPanel } from '../editor/AiPanel';
import { ExportPanel } from '../editor/ExportPanel';
import { TopToolbar } from '../editor/workbench/TopToolbar';
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

  it('keeps PRD AI review and image-text generation out of the right export panel', () => {
    render(<ExportPanel />);

    expect(screen.queryByText('AI 审核')).not.toBeInTheDocument();
    expect(screen.queryByText('图文模块生成')).not.toBeInTheDocument();
    expect(screen.queryByText('PRD AI 审核配置')).not.toBeInTheDocument();
  });

  it('adds PRD AI review and image-text preview inside the top export dialog', async () => {
    render(<TopToolbar />);

    fireEvent.click(screen.getByText('导出 PRD'));
    expect(await screen.findByText('PRD AI 审核配置')).toBeInTheDocument();
    expect(screen.getByText('使用 AI 生成默认配置')).toBeInTheDocument();
    expect(screen.getByText('保存为 PRD AI 审核默认配置')).toBeInTheDocument();
    expect(screen.queryByText('图文模块生成')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('AI 审核'));

    expect(await screen.findByText('AI 审核预览')).toBeInTheDocument();
    expect(screen.getAllByText(/显示层/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByText('确认润色并输出'));
    expect(screen.getAllByDisplayValue(/显示层/).length).toBeGreaterThan(0);
    expect(useProjectStore.getState().project.prdMarkdown).toContain('显示层');
  });

  it('saves manual PRD edits from the top export dialog into the project', async () => {
    render(<TopToolbar />);

    fireEvent.click(screen.getByText('导出 PRD'));
    const textArea = await screen.findByDisplayValue(/# 电商订单后台 PRD/);
    fireEvent.change(textArea, { target: { value: '# 手工修改后的 PRD\n\n## 订单管理' } });

    expect(useProjectStore.getState().project.prdMarkdown).toBe('# 手工修改后的 PRD\n\n## 订单管理');
  });

  it('uses configured PRD AI review model from the top export dialog', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '# AI 润色后的 PRD\n\n## 订单管理\n\n### 显示层\n- 已润色' } }] }),
    });
    vi.stubGlobal('fetch', fetch);
    render(<TopToolbar />);

    fireEvent.click(screen.getByText('导出 PRD'));
    fireEvent.change(await screen.findByLabelText('PRD AI 审核 API 地址'), { target: { value: 'https://example.test/chat' } });
    fireEvent.change(screen.getByLabelText('PRD AI 审核 API Key'), { target: { value: 'review-key' } });
    fireEvent.change(screen.getByLabelText('PRD AI 审核模型'), { target: { value: 'review-model' } });
    fireEvent.click(screen.getByText('AI 审核'));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('AI 审核预览')).toBeInTheDocument();
    expect(screen.getByDisplayValue(/AI 润色后的 PRD/)).toBeInTheDocument();
  });
});
