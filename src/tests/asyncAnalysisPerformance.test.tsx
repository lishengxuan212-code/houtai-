import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiPanel } from '../editor/AiPanel';
import { ExportPanel } from '../editor/ExportPanel';
import { initialProject } from '../store/initialProject';
import { useProjectStore } from '../store/projectStore';
import * as aiRules from '../ai/rules';
import * as markdownPrd from '../export/markdownPrd';

describe('async analysis performance boundaries', () => {
  beforeEach(() => {
    useProjectStore.getState().replaceProject(structuredClone(initialProject), initialProject.pages[0]?.id, initialProject.pages[0]?.rootNodeId);
    vi.restoreAllMocks();
  });

  it('does not run AI checks while rendering the AI panel', () => {
    const runAiRules = vi.spyOn(aiRules, 'runAiRules');

    render(<AiPanel />);

    expect(runAiRules).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('检查当前项目'));

    expect(runAiRules).toHaveBeenCalledTimes(1);
  });

  it('does not generate PRD while rendering the export panel', () => {
    const exportMarkdownPrd = vi.spyOn(markdownPrd, 'exportMarkdownPrd');

    render(<ExportPanel />);

    expect(exportMarkdownPrd).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('生成 PRD'));

    expect(exportMarkdownPrd).toHaveBeenCalledTimes(1);
  });
});
