import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generatePrototypePlanWithTextModel } from '../ai/doubaoPrototypeApi';
import { applyImagePrototypePlan } from '../ai/imagePrototype';
import type { ImagePrototypeAnalysis } from '../ai/imagePrototype';
import type { AiModelConfig } from '../ai/modelSettings';
import type { ComponentNode } from '../domain/types';
import { TableRenderer } from '../registry/renderers/TableRenderer';
import { initialProject } from '../store/initialProject';

const config: AiModelConfig = {
  role: 'visionStructure',
  label: '视觉理解 / 结构生成',
  responsibility: '识别后台截图内容，输出页面类型、组件、坐标、属性、表格列、表单字段和按钮文案。',
  apiUrl: 'https://example.test/chat',
  apiKey: 'test-key',
  model: 'qwen3.6-flash',
};

const analysis: ImagePrototypeAnalysis = {
  fileName: 'activity-list.png',
  width: 1200,
  height: 760,
  text: '',
  textItems: [],
  regions: [],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AI table JSON restore flow', () => {
  it('restores columns, grouped actions, and sample rows from model JSON through project application', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: {
                title: '活动列表',
                nodes: [
                  {
                    type: 'Table',
                    name: '活动表格',
                    dataSourceId: 'ds_orders',
                    columns: ['活动ID', '活动名称', '活动类型', '品牌', '开始时间', '结束时间', '状态', '操作', '发布状态', '获奖信息'],
                    actions: ['详情'],
                    rowActions: {
                      操作列: ['编辑', '复制链接', '...'],
                      发布状态列: ['已发布', '取消发布'],
                      获奖信息列: ['下载'],
                    },
                  },
                ],
              },
            },
          },
        ],
      }),
    } as Response);

    const plan = await generatePrototypePlanWithTextModel(config, analysis);
    expect(plan).toBeDefined();

    const page = initialProject.pages[0]!;
    const nextProject = applyImagePrototypePlan(initialProject, page.id, page.frames?.[0]?.id, plan!);
    const nextPage = nextProject.pages.find((item) => item.id === page.id)!;
    const tableNode = Object.values(nextPage.nodes).find((node) => node.name === '活动表格') as ComponentNode | undefined;

    expect(tableNode?.props).toMatchObject({
      dataSourceId: 'ds_orders',
      columns: ['活动ID', '活动名称', '活动类型', '品牌', '开始时间', '结束时间', '状态', '操作', '发布状态', '获奖信息'],
      actions: ['详情'],
      rowActions: {
        操作列: ['编辑', '复制链接', '...'],
        发布状态列: ['已发布', '取消发布'],
        获奖信息列: ['下载'],
      },
    });
    expect(tableNode?.data?.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          活动ID: expect.stringContaining('活动ID示例'),
          活动名称: expect.stringContaining('活动名称示例'),
          获奖信息: expect.stringContaining('获奖信息示例'),
        }),
      ]),
    );

    render(<TableRenderer node={tableNode!} context={{ mode: 'edit', getData: () => [] }} />);

    expect(screen.getAllByText('活动ID').length).toBeGreaterThan(0);
    expect(screen.getAllByText('发布状态').length).toBeGreaterThan(0);
    expect(screen.getAllByText('获奖信息').length).toBeGreaterThan(0);
    expect(screen.getAllByText('详情').length).toBeGreaterThan(0);
    expect(screen.getAllByText('复制链接').length).toBeGreaterThan(0);
    expect(screen.getAllByText('已发布').length).toBeGreaterThan(0);
    expect(screen.getAllByText('下载').length).toBeGreaterThan(0);
  });
});
