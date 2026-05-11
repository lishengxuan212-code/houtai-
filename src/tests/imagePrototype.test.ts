import { describe, expect, it } from 'vitest';
import { applyImagePrototypePlan, inferImagePrototypePlan } from '../ai/imagePrototype';
import { initialProject } from '../store/initialProject';

describe('image prototype generation', () => {
  it('infers a backoffice list page from OCR text and detected visual regions', () => {
    const plan = inferImagePrototypePlan({
      fileName: 'upload.png',
      width: 1440,
      height: 900,
      text: '客户管理 查询 重置 新增 客户名称 状态 创建时间 操作 编辑 删除',
      textItems: [
        { text: '客户管理', x: 48, y: 32, width: 120, height: 32 },
        { text: '客户名称', x: 72, y: 128, width: 80, height: 24 },
        { text: '状态', x: 300, y: 128, width: 48, height: 24 },
        { text: '新增', x: 72, y: 238, width: 48, height: 24 },
        { text: '创建时间', x: 520, y: 320, width: 96, height: 24 },
        { text: '操作', x: 780, y: 320, width: 48, height: 24 },
      ],
      regions: [
        { kind: 'header', x: 0, y: 0, width: 1440, height: 88, score: 0.8 },
        { kind: 'search', x: 48, y: 110, width: 980, height: 110, score: 0.9 },
        { kind: 'button', x: 48, y: 250, width: 120, height: 40, score: 0.8 },
        { kind: 'table', x: 48, y: 310, width: 980, height: 360, score: 0.95 },
      ],
    });

    expect(plan.title).toContain('列表');
    expect(plan.nodes.map((node) => node.type)).toEqual(['PageTitle', 'WhitePanel', 'Input', 'Select', 'Button', 'TableSkeleton']);
    expect(plan.nodes[0]?.props.text).toBe('客户管理');
    expect(plan.nodes.find((node) => node.type === 'Button')?.props.text).toBe('新增');
    expect(plan.nodes.find((node) => node.type === 'TableSkeleton')?.props.columns).toBeGreaterThanOrEqual(4);
    expect(plan.componentCandidates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ targetType: 'SearchBar', sourceNodeIds: expect.arrayContaining(['visual_search_panel']) }),
        expect.objectContaining({ targetType: 'Table', sourceNodeIds: expect.arrayContaining(['visual_table_skeleton']) }),
      ]),
    );
  });

  it('applies inferred nodes to the current frame with canvas positions', () => {
    const page = initialProject.pages[0]!;
    const frameId = page.frames?.[0]?.id;
    const plan = inferImagePrototypePlan({
      fileName: 'upload.png',
      width: 1440,
      height: 900,
      text: '数据看板 总销售额 新增用户 转化率',
      regions: [
        { kind: 'header', x: 0, y: 0, width: 1440, height: 88, score: 0.8 },
        { kind: 'card', x: 48, y: 130, width: 260, height: 110, score: 0.8 },
        { kind: 'card', x: 340, y: 130, width: 260, height: 110, score: 0.8 },
        { kind: 'card', x: 632, y: 130, width: 260, height: 110, score: 0.8 },
        { kind: 'table', x: 48, y: 300, width: 980, height: 320, score: 0.8 },
      ],
    });
    const next = applyImagePrototypePlan(initialProject, page.id, frameId, plan);
    const inserted = Object.values(next.pages[0]!.nodes).filter((node) => !initialProject.pages[0]!.nodes[node.id]);

    expect(inserted.length).toBe(plan.nodes.length);
    const insertedFrameId = inserted[0]?.canvas?.parentFrameId;
    expect(insertedFrameId).toBeTruthy();
    expect(inserted.every((node) => node.canvas?.parentFrameId === insertedFrameId)).toBe(true);
    expect(inserted.some((node) => node.type === 'TableSkeleton')).toBe(true);
  });

  it('expands tiny generated components to readable canvas sizes', () => {
    const page = initialProject.pages[0]!;
    const next = applyImagePrototypePlan(initialProject, page.id, page.frames?.[0]?.id, {
      title: '尺寸兜底',
      summary: '模型返回了过小的按钮和表格区域。',
      nodes: [
        {
          type: 'Button',
          name: '实物奖品信息',
          props: { text: '实物奖品信息', variant: 'primary' },
          x: 40,
          y: 80,
          width: 72,
          height: 18,
        },
        {
          type: 'Table',
          name: '活动表格',
          props: {
            columns: ['活动ID', '活动名称', '活动类型', '品牌', '开始时间', '结束时间', '状态', '操作', '发布状态', '获奖信息'],
            actions: ['详情'],
          },
          x: 40,
          y: 140,
          width: 160,
          height: 60,
        },
      ],
    });
    const inserted = Object.values(next.pages[0]!.nodes).filter((node) => !initialProject.pages[0]!.nodes[node.id]);
    const button = inserted.find((node) => node.type === 'Button');
    const table = inserted.find((node) => node.type === 'Table');

    expect(button?.canvas?.width).toBeGreaterThanOrEqual(120);
    expect(button?.canvas?.height).toBeGreaterThanOrEqual(36);
    expect(table?.canvas?.width).toBeGreaterThanOrEqual(920);
    expect(table?.canvas?.height).toBeGreaterThanOrEqual(180);
  });
});
