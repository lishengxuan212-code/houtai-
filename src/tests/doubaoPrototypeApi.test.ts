import { afterEach, describe, expect, it, vi } from 'vitest';
import { generatePrototypePlanWithTextModel } from '../ai/doubaoPrototypeApi';
import type { ImagePrototypeAnalysis } from '../ai/imagePrototype';
import type { AiModelConfig } from '../ai/modelSettings';

const config: AiModelConfig = {
  role: 'visionStructure',
  label: '视觉理解 / 结构生成',
  responsibility: '识别后台截图内容，输出页面类型、组件、坐标、属性、表格列、表单字段和按钮文案。',
  apiUrl: 'https://example.test/chat',
  apiKey: 'test-key',
  model: 'qwen3.6-flash',
};

const analysis: ImagePrototypeAnalysis = {
  fileName: 'activity.png',
  width: 1200,
  height: 760,
  text: '',
  textItems: [],
  regions: [],
};

function mockChatResponse(content: unknown) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ choices: [{ message: { content } }] }),
  } as Response);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('doubaoPrototypeApi plan normalization', () => {
  it('normalizes page JSON trees into renderable component nodes', async () => {
    mockChatResponse({
      type: 'page',
      title: '活动管理',
      children: [
        {
          type: 'frame',
          id: 'filter_frame',
          name: '筛选区',
          layout: { x: 40, y: 96, width: 960, height: 96 },
          style: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, shadow: '0 8px 24px rgba(15,23,42,0.08)' },
          children: [
            { type: 'text', content: '活动管理', layout: { x: 0, y: -64, width: 240, height: 40 }, style: { fontSize: 28, fontWeight: 700, color: '#111827' } },
            { type: 'input', label: '活动名称', placeholder: '请输入活动名称', fieldKey: 'activityName', layout: { x: 24, y: 28, width: 180, height: 36 } },
            { type: 'select', label: '状态', fieldKey: 'status', options: ['全部', '启用', '停用'], layout: { x: 224, y: 28, width: 180, height: 36 } },
            { type: 'button', content: '查询', variant: 'primary', layout: { x: 424, y: 28, width: 96, height: 36 } },
          ],
        },
        {
          type: 'table',
          name: '活动列表',
          columns: ['活动ID', '活动名称', '状态', '操作'],
          actions: ['详情', '编辑'],
          layout: { x: 40, y: 220, width: 960, height: 320 },
        },
      ],
    });

    const plan = await generatePrototypePlanWithTextModel(config, analysis);

    expect(plan?.nodes.map((node) => node.type)).toEqual(['WhitePanel', 'PageTitle', 'Input', 'Select', 'Button', 'Table']);
    expect(plan?.nodes[1]).toMatchObject({ type: 'PageTitle', props: { content: '活动管理', fontSize: 28, fontWeight: 700, color: '#111827' }, x: 40, y: 32 });
    expect(plan?.nodes[2]).toMatchObject({ type: 'Input', props: { label: '活动名称', placeholder: '请输入活动名称', fieldKey: 'activityName' }, x: 64, y: 124 });
    expect(plan?.nodes[3]).toMatchObject({ type: 'Select', props: { label: '状态', fieldKey: 'status', options: ['全部', '启用', '停用'] } });
    expect(plan?.nodes[4]).toMatchObject({ type: 'Button', props: { text: '查询', variant: 'primary' } });
    expect(plan?.nodes[5]).toMatchObject({ type: 'Table', props: { columns: ['活动ID', '活动名称', '状态', '操作'], actions: ['详情', '编辑'] } });
  });

  it('keeps table props when the model puts columns and grouped rowActions on the node', async () => {
    mockChatResponse({
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
    });

    const plan = await generatePrototypePlanWithTextModel(config, analysis);

    expect(plan?.nodes[0]).toMatchObject({
      type: 'Table',
      name: '活动表格',
      x: 40,
      y: 220,
      width: 1040,
      height: 360,
      props: {
        dataSourceId: 'ds_orders',
        columns: ['活动ID', '活动名称', '活动类型', '品牌', '开始时间', '结束时间', '状态', '操作', '发布状态', '获奖信息'],
        actions: ['详情'],
        rowActions: {
          操作列: ['编辑', '复制链接', '...'],
          发布状态列: ['已发布', '取消发布'],
          获奖信息列: ['下载'],
        },
      },
    });
  });

  it('accepts a direct table JSON payload when the model omits nodes', async () => {
    mockChatResponse({
      dataSourceId: 'ds_orders',
      fields: ['活动ID', '活动名称', '品牌'],
      actions: ['详情'],
    });

    const plan = await generatePrototypePlanWithTextModel(config, analysis);

    expect(plan?.nodes).toHaveLength(1);
    expect(plan?.nodes[0]).toMatchObject({
      type: 'Table',
      name: '数据列表',
      props: {
        dataSourceId: 'ds_orders',
        fields: ['活动ID', '活动名称', '品牌'],
        columns: ['活动ID', '活动名称', '品牌'],
        actions: ['详情'],
      },
    });
  });
});
