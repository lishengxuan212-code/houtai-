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
