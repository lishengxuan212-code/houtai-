import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { applyImagePrototypePlan } from '../ai/imagePrototype';
import { AssemblyCanvas } from '../editor/AssemblyCanvas';
import type { Project } from '../domain/types';
import { useProjectStore } from '../store/projectStore';

const project: Project = {
  id: 'project_ai_render',
  name: 'AI Render',
  version: 1,
  createdAt: '2026-05-11T00:00:00.000Z',
  updatedAt: '2026-05-11T00:00:00.000Z',
  variables: [],
  dataSources: [],
  interactions: [],
  pages: [
    {
      id: 'page_ai',
      name: 'AI page',
      route: '/ai',
      rootNodeId: 'root',
      frames: [{ id: 'frame_ai', name: 'AI frame', x: 0, y: 0, width: 1200, height: 760, zIndex: 1 }],
      nodes: {
        root: { id: 'root', type: 'PageContainer', name: 'Root', props: {}, children: [] },
      },
    },
  ],
};

describe('AI generated canvas render', () => {
  it('renders generated JSON as visible canvas components after project commit', async () => {
    const next = applyImagePrototypePlan(project, 'page_ai', 'frame_ai', {
      title: 'AI 页面',
      summary: '生成组件应显示在画布上。',
      nodes: [
        { id: 'image_pagetitle', type: 'PageTitle', name: '页面标题', props: { text: '活动配置中心' }, x: 40, y: 32, width: 260, height: 44 },
        { type: 'Button', name: '查询按钮', props: { text: '查询', variant: 'primary' }, x: 40, y: 96, width: 96, height: 36 },
        { type: 'Accordion', name: '规则说明', props: { summary: '活动规则', details: '满足条件后发放奖励', defaultExpanded: true }, x: 40, y: 152, width: 420, height: 120 },
      ],
    });

    useProjectStore.getState().replaceProject(next, 'page_ai', 'image_pagetitle');
    render(<AssemblyCanvas />);

    expect(useProjectStore.getState().currentFrameId).toBe('frame_ai');
    expect(useProjectStore.getState().selectedNodeId).toBe('image_pagetitle');
    expect(await screen.findByText('活动配置中心')).toBeInTheDocument();
    expect(screen.getByText('查询')).toBeInTheDocument();
    expect(screen.getByText('活动规则')).toBeInTheDocument();
    expect(screen.getByText('满足条件后发放奖励')).toBeInTheDocument();
  });
});
