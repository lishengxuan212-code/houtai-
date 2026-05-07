import { describe, expect, it } from 'vitest';
import type { Project } from '../domain/types';
import { exportPlainPrd } from '../export/plainPrd';

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
});
