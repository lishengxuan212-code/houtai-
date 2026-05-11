import { describe, expect, it } from 'vitest';
import type { Project } from '../domain/types';
import { exportPlainPrd } from '../export/plainPrd';
import { createTemplateFromSelection, insertTemplateIntoPage } from '../templates/templateOperations';

function canvasSemanticProject(): Project {
  return {
    id: 'project_canvas_prd',
    name: '客户运营后台',
    description: '用于客户查询、维护和跟进。',
    pages: [
      {
        id: 'page_customer',
        name: '客户管理',
        route: '/customers',
        purpose: '查询客户、维护客户状态和查看详情。',
        rootNodeId: 'root',
        frames: [{ id: 'frame_main', name: '客户列表页', x: 100, y: 200, width: 1440, height: 900, zIndex: 1 }],
        nodes: {
          root: { id: 'root', type: 'PageContainer', name: '客户管理页面', props: {}, children: ['tip', 'search', 'bulk', 'status', 'tabs', 'steps', 'table', 'form', 'modal', 'draft'] },
          tip: {
            id: 'tip',
            type: 'BodyText',
            name: '页面提示',
            props: { content: '仅展示近一年有交易的客户' },
            canvas: { x: 132, y: 232, width: 300, height: 32, zIndex: 1, parentFrameId: 'frame_main' },
          },
          search: {
            id: 'search',
            type: 'SearchBar',
            name: '筛选条件',
            props: {
              fields: [
                { key: 'keyword', label: '客户名称', type: 'text', required: true },
                { key: 'level', label: '客户等级', type: 'select', options: ['全部', '重点客户', '普通客户'] },
              ],
            },
            semantic: { moduleName: '客户筛选', moduleType: '搜索区', description: '用于按客户名称和等级筛选列表。' },
            canvas: { x: 132, y: 284, width: 800, height: 88, zIndex: 2, parentFrameId: 'frame_main' },
          },
          bulk: {
            id: 'bulk',
            type: 'Dropdown',
            name: '批量操作',
            props: { text: '批量操作', menuItems: [{ key: 'assign', label: '分配客户' }, { key: 'tag', label: '批量打标' }] },
            canvas: { x: 132, y: 392, width: 120, height: 32, zIndex: 3, parentFrameId: 'frame_main' },
          },
          status: {
            id: 'status',
            type: 'Select',
            name: '状态筛选',
            props: { options: [{ label: '全部状态', value: 'all' }, { label: '待跟进', value: 'pending' }] },
            canvas: { x: 272, y: 392, width: 160, height: 32, zIndex: 4, parentFrameId: 'frame_main' },
          },
          tabs: {
            id: 'tabs',
            type: 'Tabs',
            name: '客户分类',
            props: { items: [{ key: 'all', label: '全部客户' }, { key: 'vip', label: '重点客户' }] },
            canvas: { x: 132, y: 444, width: 500, height: 48, zIndex: 5, parentFrameId: 'frame_main' },
          },
          steps: {
            id: 'steps',
            type: 'Steps',
            name: '跟进阶段',
            props: { items: [{ key: 'new', label: '新建线索' }, { key: 'visit', label: '拜访跟进' }] },
            canvas: { x: 132, y: 500, width: 600, height: 48, zIndex: 6, parentFrameId: 'frame_main' },
          },
          table: {
            id: 'table',
            type: 'pro.ProTable',
            name: '客户列表',
            props: {
              headerTitle: '客户列表',
              emptyText: '暂无客户',
              columns: [
                { key: 'customerName', title: '客户名称', valueType: 'text', search: true },
                { key: 'owner', title: '负责人', valueType: 'text' },
              ],
              data: [{ id: 'row_1', customerName: '上海样例客户', owner: '李雷' }],
              actions: ['详情', '删除'],
            },
            canvas: { x: 132, y: 572, width: 1100, height: 360, zIndex: 7, parentFrameId: 'frame_main' },
          },
          form: {
            id: 'form',
            type: 'pro.ProForm',
            name: '客户维护表单',
            props: {
              title: '客户维护',
              submitText: '保存客户',
              resetText: '清空',
              successMessage: '客户已保存',
              fields: [
                { key: 'customerName', label: '客户名称', type: 'text', required: true, defaultValue: '上海样例客户' },
                { key: 'level', label: '客户等级', type: 'select', options: ['重点客户', '普通客户'] },
              ],
            },
            canvas: { x: 132, y: 948, width: 700, height: 260, zIndex: 8, parentFrameId: 'frame_main' },
          },
          modal: {
            id: 'modal',
            type: 'Modal',
            name: '删除确认弹窗',
            props: { title: '删除客户', content: '确认删除当前客户？', footerButtons: [{ label: '取消' }, { label: '确认删除' }] },
            canvas: { x: 880, y: 948, width: 420, height: 240, zIndex: 9, parentFrameId: 'frame_main' },
          },
          draft: {
            id: 'draft',
            type: 'Button',
            name: '草稿按钮',
            props: { text: '不应导出' },
            canvas: { x: 10, y: 10, width: 90, height: 32, zIndex: 1 },
          },
        },
      },
    ],
    dataSources: [],
    variables: [],
    interactions: [],
    version: 1,
    createdAt: '2026-05-07T00:00:00.000Z',
    updatedAt: '2026-05-07T00:00:00.000Z',
  };
}

describe('canvas semantic plain PRD export', () => {
  it('groups content by page frame and prefers semantic module metadata', () => {
    const prd = exportPlainPrd(canvasSemanticProject());

    expect(prd).toContain('### 3.1 客户管理');
    expect(prd).toContain('#### 可见页面：客户列表页');
    expect(prd).toContain('模块一：客户筛选');
    expect(prd).toContain('类型：搜索区');
    expect(prd).toContain('用于按客户名称和等级筛选列表。');
  });

  it('exports widget content and rich business component details from props', () => {
    const prd = exportPlainPrd(canvasSemanticProject());

    expect(prd).toContain('仅展示近一年有交易的客户');
    expect(prd).toContain('分配客户');
    expect(prd).toContain('批量打标');
    expect(prd).toContain('待跟进');
    expect(prd).toContain('全部客户');
    expect(prd).toContain('拜访跟进');
    expect(prd).toContain('客户名称');
    expect(prd).toContain('详情');
    expect(prd).toContain('上海样例客户');
    expect(prd).toContain('必填');
    expect(prd).toContain('默认值：上海样例客户');
    expect(prd).toContain('保存客户');
    expect(prd).toContain('删除客户');
    expect(prd).toContain('确认删除当前客户？');
    expect(prd).toContain('确认删除');
  });

  it('classifies ungrouped modules without exposing coordinates or out-of-frame drafts', () => {
    const prd = exportPlainPrd(canvasSemanticProject());

    expect(prd).toContain('模块二：批量操作');
    expect(prd).toContain('类型：操作区');
    expect(prd).toContain('模块六：客户列表');
    expect(prd).toContain('类型：列表区');
    expect(prd).toContain('模块七：客户维护表单');
    expect(prd).toContain('类型：表单区');
    expect(prd).not.toContain('不应导出');
    expect(prd).not.toMatch(/\b(x|y|width|height|zIndex)\b/i);
    expect(prd).not.toMatch(/\b100\b|\b200\b|\b1440\b|\b900\b/);
  });

  it('uses group semantic name as module name and keeps grouped children inside that module', () => {
    const project = canvasSemanticProject();
    const page = project.pages[0]!;
    page.nodes.root!.children = [...(page.nodes.root!.children ?? []), 'approval_group'];
    page.nodes.approval_group = {
      id: 'approval_group',
      type: 'Section',
      name: '默认分组名称',
      props: { title: '审批处理' },
      semantic: { moduleName: '客户审批处理', moduleType: '业务模块', description: '用于集中处理客户审批动作。' },
      children: ['approval_table', 'approval_button'],
      canvas: { x: 132, y: 620, width: 900, height: 260, zIndex: 20, parentFrameId: 'frame_main' },
    };
    page.nodes.approval_table = {
      id: 'approval_table',
      type: 'Table',
      name: '审批列表',
      props: { columns: [{ key: 'customerName', title: '客户名称' }], actions: ['查看'] },
      canvas: { x: 152, y: 680, width: 620, height: 160, zIndex: 21, parentFrameId: 'frame_main' },
    };
    page.nodes.approval_button = {
      id: 'approval_button',
      type: 'Button',
      name: '通过按钮',
      props: { text: '通过审批' },
      canvas: { x: 792, y: 680, width: 120, height: 32, zIndex: 22, parentFrameId: 'frame_main' },
    };

    const prd = exportPlainPrd(project);

    expect(prd).toContain('客户审批处理');
    expect(prd).toContain('类型：业务模块');
    expect(prd).toContain('用于集中处理客户审批动作。');
    expect(prd).toContain('客户名称');
    expect(prd).toContain('通过审批');
    expect(prd).not.toContain('模块十：审批列表');
    expect(prd).not.toMatch(/\b(zIndex|x|y|width|height)\b/i);
  });

  it('describes template-created group modules and state changes in business language', () => {
    const project = canvasSemanticProject();
    const page = project.pages[0]!;
    page.nodes.root!.children = ['template_group'];
    page.nodes = {
      root: page.nodes.root!,
      template_group: {
        id: 'template_group',
        type: 'Section',
        name: '模板原始分组',
        props: { title: '模板原始分组' },
        semantic: { moduleName: '退款审核模块', moduleType: '业务模块', description: '用于审核客户退款申请。' },
        children: ['template_table', 'template_button'],
        canvas: { x: 120, y: 260, width: 800, height: 260, zIndex: 2, parentFrameId: 'frame_main' },
      },
      template_table: {
        id: 'template_table',
        type: 'Table',
        name: '退款审核列表',
        props: { columns: [{ key: 'refundNo', title: '退款单号' }], actions: ['审核'] },
        canvas: { x: 150, y: 320, width: 560, height: 160, zIndex: 3, parentFrameId: 'frame_main' },
      },
      template_button: {
        id: 'template_button',
        type: 'Button',
        name: '审核按钮',
        props: { text: '通过审核' },
        canvas: { x: 740, y: 320, width: 120, height: 32, zIndex: 4, parentFrameId: 'frame_main' },
      },
    };
    project.interactions = [
      {
        id: 'interaction_state_change',
        name: '审核后更新页面状态',
        trigger: { componentId: 'template_button', event: 'click' },
        actions: [
          { type: 'hideNode', targetNodeId: 'template_table' },
          { type: 'disableNode', targetNodeId: 'template_button' },
          { type: 'showMessage', level: 'success', message: '审核已提交' },
        ],
        enabled: true,
      },
    ];

    const template = createTemplateFromSelection(project, page.id, 'template_group', {
      name: '退款审核模板',
      type: 'group',
      category: '退款',
      includeProps: true,
      includeContent: true,
      includeData: true,
      includeInternalInteractions: true,
      includeExternalReferences: false,
    });
    const next = insertTemplateIntoPage(project, page.id, page.rootNodeId, template, 'frame_main');
    const prd = exportPlainPrd(next);

    expect(prd.match(/退款审核模块/g)?.length).toBe(2);
    expect(prd).toContain('退款单号');
    expect(prd).toContain('通过审核');
    expect(prd).toContain('隐藏“退款审核列表”。');
    expect(prd).toContain('暂时禁止用户操作“审核按钮”。');
    expect(prd).toContain('显示“审核已提交”提示。');
    expect(prd).not.toMatch(/\b(zIndex|x|y|width|height)\b/i);
  });

  it('does not export children of hidden groups', () => {
    const project = canvasSemanticProject();
    const page = project.pages[0]!;
    page.nodes.root!.children = ['hidden_group'];
    page.nodes = {
      root: page.nodes.root!,
      hidden_group: {
        id: 'hidden_group',
        type: 'Section',
        name: '隐藏分组',
        props: { title: '隐藏分组' },
        children: ['hidden_button'],
        canvas: { x: 120, y: 260, width: 400, height: 160, zIndex: 2, parentFrameId: 'frame_main', hidden: true },
      },
      hidden_button: {
        id: 'hidden_button',
        type: 'Button',
        name: '隐藏按钮',
        props: { text: '不应出现在 PRD' },
        canvas: { x: 140, y: 300, width: 160, height: 40, zIndex: 3, parentFrameId: 'frame_main' },
      },
    };

    const prd = exportPlainPrd(project);

    expect(prd).not.toContain('隐藏分组');
    expect(prd).not.toContain('不应出现在 PRD');
  });
});
