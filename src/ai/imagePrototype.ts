import { getNextFrameZIndex } from '../domain/canvas';
import { createId } from '../domain/ids';
import type { ComponentNode, JsonRecord, Operation, Page, Project } from '../domain/types';
import { createNode } from '../registry/createNode';

export type ImageTextItem = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
};

export type ImageRegion = {
  kind: 'header' | 'search' | 'button' | 'table' | 'card' | 'form' | 'content';
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
};

export type ImagePrototypeAnalysis = {
  fileName: string;
  width: number;
  height: number;
  text?: string;
  textItems?: ImageTextItem[];
  regions?: ImageRegion[];
};

export type ImagePrototypePlan = {
  title: string;
  summary: string;
  nodes: Array<{
    id?: string;
    type: string;
    name: string;
    props: JsonRecord;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  componentCandidates?: Array<{
    id: string;
    targetType: string;
    sourceNodeIds: string[];
    reason: string;
    confidence: number;
  }>;
};

export type PrototypeGenerationResult =
  | { ok: true; plan: ImagePrototypePlan; rawText: string }
  | { ok: false; reason: string; rawText?: string; details?: unknown };

const FRAME_WIDTH = 1200;
const FRAME_HEIGHT = 760;
const ACTION_WORDS = ['新增', '新建', '创建', '保存', '提交', '查询', '搜索', '重置', '导出', '导入', '删除', '编辑', '详情', 'Add', 'Save', 'Search', 'Reset', 'Export'];
const FIELD_WORDS = ['名称', '状态', '类型', '时间', '日期', '编号', '客户', '用户', '手机', '邮箱', '部门', '角色', 'Name', 'Status', 'Type', 'Date', 'User'];
const TABLE_WORDS = ['操作', '状态', '创建时间', '更新时间', '序号', '编号', '金额', '数量', 'Actions', 'Status', 'Created', 'Updated'];
const DASHBOARD_WORDS = ['看板', '概览', '统计', '总数', '趋势', '销售额', '用户数', 'Dashboard', 'Overview', 'Total'];

function normalizeText(value: string | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function includesAny(text: string, words: string[]) {
  const lower = text.toLowerCase();
  return words.some((word) => lower.includes(word.toLowerCase()));
}

function scaleX(value: number, imageWidth: number) {
  return Math.max(24, Math.round((value / Math.max(1, imageWidth)) * FRAME_WIDTH));
}

function scaleY(value: number, imageHeight: number) {
  return Math.max(24, Math.round((value / Math.max(1, imageHeight)) * FRAME_HEIGHT));
}

function scaleRegion(region: ImageRegion, analysis: ImagePrototypeAnalysis) {
  return {
    x: scaleX(region.x, analysis.width),
    y: scaleY(region.y, analysis.height),
    width: Math.max(120, scaleX(region.width, analysis.width)),
    height: Math.max(40, scaleY(region.height, analysis.height)),
  };
}

function textNear(items: ImageTextItem[], region: ImageRegion, padding = 24) {
  return items
    .filter((item) => item.x + item.width >= region.x - padding && item.x <= region.x + region.width + padding && item.y + item.height >= region.y - padding && item.y <= region.y + region.height + padding)
    .map((item) => item.text)
    .map(normalizeText)
    .filter(Boolean);
}

function bestPageTitle(analysis: ImagePrototypeAnalysis) {
  const items = [...(analysis.textItems ?? [])].sort((left, right) => left.y - right.y || left.x - right.x);
  const topText = items.find((item) => item.y < analysis.height * 0.22 && item.text.length >= 2);
  return normalizeText(topText?.text) || '图片生成后台页面';
}

function uniqueLabels(values: string[], fallback: string[], limit: number) {
  const labels = values
    .map((value) => normalizeText(value).replace(/[:：]$/, ''))
    .filter((value) => value.length >= 2 && value.length <= 16);
  const deduped = Array.from(new Set(labels));
  return [...deduped, ...fallback].slice(0, limit);
}

function inferColumns(analysis: ImagePrototypeAnalysis) {
  const items = analysis.textItems ?? [];
  const tableRegion = analysis.regions?.find((region) => region.kind === 'table');
  const candidates = tableRegion ? textNear(items, tableRegion).filter((text) => text.length <= 12) : items.filter((item) => item.y > analysis.height * 0.25).map((item) => item.text);
  const labels = uniqueLabels(candidates.filter((item) => includesAny(item, TABLE_WORDS) || item.length <= 8), ['名称', '状态', '创建时间', '操作'], 5);
  return labels.map((title, index) => ({ key: `col_${index + 1}`, title }));
}

function inferFields(analysis: ImagePrototypeAnalysis, limit = 4) {
  const items = analysis.textItems ?? [];
  const searchRegion = analysis.regions?.find((region) => region.kind === 'search' || region.kind === 'form');
  const candidates = searchRegion ? textNear(items, searchRegion) : items.map((item) => item.text);
  const labels = uniqueLabels(candidates.filter((item) => includesAny(item, FIELD_WORDS) || item.endsWith(':') || item.endsWith('：')), ['名称', '状态'], limit);
  return labels.map((label, index) => {
    const isSelect = label.includes('状态') || label.toLowerCase().includes('status');
    return {
      key: `field_${index + 1}`,
      label,
      type: isSelect ? 'select' : 'text',
      ...(isSelect ? { options: ['全部', '启用', '停用'] } : {}),
    };
  });
}

function inferActions(analysis: ImagePrototypeAnalysis) {
  const texts = (analysis.textItems ?? []).map((item) => item.text).filter((text) => includesAny(text, ACTION_WORDS));
  return uniqueLabels(texts, ['详情', '编辑'], 4);
}

function regionOf(analysis: ImagePrototypeAnalysis, kind: ImageRegion['kind']) {
  return analysis.regions?.filter((region) => region.kind === kind).sort((left, right) => right.score - left.score)[0];
}

function addTitle(nodes: ImagePrototypePlan['nodes'], analysis: ImagePrototypeAnalysis) {
  const header = regionOf(analysis, 'header');
  const box = header ? scaleRegion(header, analysis) : { x: 40, y: 32, width: 320, height: 48 };
  nodes.push({ type: 'PageTitle', name: '页面标题', props: { text: bestPageTitle(analysis) }, x: box.x, y: Math.max(24, box.y), width: Math.max(260, box.width), height: 48 });
}

function buildDashboardPlan(analysis: ImagePrototypeAnalysis): ImagePrototypePlan {
  const nodes: ImagePrototypePlan['nodes'] = [];
  const componentCandidates: NonNullable<ImagePrototypePlan['componentCandidates']> = [];
  addTitle(nodes, analysis);
  const cards = (analysis.regions ?? []).filter((region) => region.kind === 'card').slice(0, 4);
  const labels = uniqueLabels((analysis.textItems ?? []).map((item) => item.text).filter((text) => includesAny(text, DASHBOARD_WORDS) || /\d/.test(text)), ['核心指标', '新增用户', '转化率'], 4);
  const sourceCards = cards.length ? cards : [
    { kind: 'card' as const, x: 40, y: 120, width: 250, height: 110, score: 1 },
    { kind: 'card' as const, x: 320, y: 120, width: 250, height: 110, score: 1 },
    { kind: 'card' as const, x: 600, y: 120, width: 250, height: 110, score: 1 },
  ];
  sourceCards.forEach((card, index) => {
    const box = cards.length ? scaleRegion(card, analysis) : card;
    nodes.push({ type: 'AmountText', name: labels[index] ?? `指标 ${index + 1}`, props: { label: labels[index] ?? `指标 ${index + 1}`, value: (analysis.textItems ?? []).find((item) => /\d/.test(item.text))?.text ?? '--' }, x: box.x, y: box.y, width: box.width, height: box.height });
  });
  const table = regionOf(analysis, 'table');
  if (table) {
    const box = scaleRegion(table, analysis);
    nodes.push({ id: 'visual_table_skeleton', type: 'TableSkeleton', name: '数据明细表视觉区', props: { columns: Math.max(4, inferColumns(analysis).length), rows: 5, width: box.width, height: box.height }, x: box.x, y: box.y, width: box.width, height: box.height });
    componentCandidates.push({ id: 'candidate_dashboard_table', targetType: 'Table', sourceNodeIds: ['visual_table_skeleton'], reason: '检测到表格区域，可在视觉还原后替换为可配置数据表格。', confidence: 0.82 });
  }
  return { title: '按图片内容识别生成的数据看板', summary: `已识别 ${sourceCards.length} 个指标区域${table ? '和表格区域' : ''}，并回填图片中的文字。`, nodes, componentCandidates };
}

function buildFormPlan(analysis: ImagePrototypeAnalysis): ImagePrototypePlan {
  const nodes: ImagePrototypePlan['nodes'] = [];
  addTitle(nodes, analysis);
  const form = regionOf(analysis, 'form') ?? regionOf(analysis, 'content');
  const box = form ? scaleRegion(form, analysis) : { x: 40, y: 104, width: 640, height: 360 };
  const actions = inferActions(analysis);
  nodes.push({ type: 'Form', name: '业务表单', props: { submitText: actions.find((action) => includesAny(action, ['保存', '提交', 'Save'])) ?? '保存', fields: inferFields(analysis, 6) }, x: box.x, y: box.y, width: box.width, height: box.height });
  actions.slice(0, 2).forEach((action, index) => {
    nodes.push({ type: 'Button', name: `${action}按钮`, props: { text: action, variant: index === 0 ? 'primary' : 'default' }, x: box.x + index * 136, y: box.y + box.height + 24, width: 120, height: 40 });
  });
  return { title: '按图片内容识别生成的表单页面', summary: `已识别 ${inferFields(analysis, 6).length} 个表单字段，并使用图片中的按钮文字。`, nodes };
}

function buildListPlan(analysis: ImagePrototypeAnalysis): ImagePrototypePlan {
  const nodes: ImagePrototypePlan['nodes'] = [];
  const componentCandidates: NonNullable<ImagePrototypePlan['componentCandidates']> = [];
  addTitle(nodes, analysis);
  const search = regionOf(analysis, 'search');
  if (search) {
    const box = scaleRegion(search, analysis);
    const fields = inferFields(analysis).slice(0, 2);
    nodes.push({ id: 'visual_search_panel', type: 'WhitePanel', name: '查询区域背景', props: { label: '查询区域', fill: '#ffffff', border: '1px solid #e5e7eb', radius: 8, shadow: 'none', width: box.width, height: box.height }, x: box.x, y: box.y, width: box.width, height: box.height });
    fields.forEach((field, index) => {
      const type = field.type === 'select' ? 'Select' : 'Input';
      nodes.push({
        id: `visual_search_field_${index + 1}`,
        type,
        name: `${field.label}筛选项`,
        props: { label: field.label, placeholder: `请输入${field.label}`, fieldKey: field.key, ...(type === 'Select' ? { options: field.options ?? ['全部', '启用', '停用'] } : {}) },
        x: box.x + 24 + index * 220,
        y: box.y + 28,
        width: 220,
        height: 72,
      });
    });
    componentCandidates.push({ id: 'candidate_search_bar', targetType: 'SearchBar', sourceNodeIds: ['visual_search_panel', ...fields.map((_, index) => `visual_search_field_${index + 1}`)], reason: '查询区域由输入项组成，可替换为统一查询组件。', confidence: 0.78 });
  }
  const buttons = (analysis.regions ?? []).filter((region) => region.kind === 'button').slice(0, 3);
  const actions = inferActions(analysis);
  buttons.forEach((button, index) => {
    const box = scaleRegion(button, analysis);
    const text = actions[index] ?? (index === 0 ? '新增' : '操作');
    nodes.push({ type: 'Button', name: `${text}按钮`, props: { text, variant: index === 0 ? 'primary' : 'default' }, x: box.x, y: box.y, width: box.width, height: box.height });
  });
  if (!buttons.length) nodes.push({ type: 'Button', name: '新增按钮', props: { text: '新增', variant: 'primary' }, x: 40, y: search ? scaleRegion(search, analysis).y + scaleRegion(search, analysis).height + 24 : 120, width: 120, height: 40 });
  const table = regionOf(analysis, 'table') ?? regionOf(analysis, 'content');
  const box = table ? scaleRegion(table, analysis) : { x: 40, y: 220, width: 920, height: 360 };
  nodes.push({ id: 'visual_table_skeleton', type: 'TableSkeleton', name: '数据列表视觉区', props: { columns: Math.max(4, inferColumns(analysis).length), rows: 5, width: box.width, height: box.height }, x: box.x, y: box.y, width: box.width, height: box.height });
  componentCandidates.push({ id: 'candidate_data_table', targetType: 'Table', sourceNodeIds: ['visual_table_skeleton'], reason: '检测到表格主体，可在用户确认后替换为数据表格组件。', confidence: 0.86 });
  return { title: '按图片内容识别生成的列表页面', summary: `已识别${search ? '查询区域、' : ''}${buttons.length} 个按钮区域和表格区域，并回填图片中的列名/操作文字。`, nodes, componentCandidates };
}

function textWidth(value: unknown, fallback = '') {
  const text = typeof value === 'string' ? value : fallback;
  return Array.from(text).reduce((width, char) => width + (/[\u4e00-\u9fff]/.test(char) ? 15 : 8), 0);
}

function arrayLength(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function minimumNodeSize(item: ImagePrototypePlan['nodes'][number]) {
  switch (item.type) {
    case 'Button': {
      const text = item.props.text ?? item.name;
      return { width: Math.max(88, textWidth(text, item.name) + 34), height: 36 };
    }
    case 'PageTitle':
    case 'ModuleTitle':
    case 'H1':
    case 'H2':
    case 'H3':
      return { width: Math.max(180, textWidth(item.props.text, item.name) + 24), height: 44 };
    case 'BodyText':
    case 'HelperText':
    case 'LinkText':
    case 'ErrorText':
    case 'Annotation':
      return { width: Math.max(120, textWidth(item.props.text, item.name) + 20), height: 28 };
    case 'StatusLabel':
    case 'BadgePill':
      return { width: Math.max(72, textWidth(item.props.text ?? item.props.label, item.name) + 28), height: 28 };
    case 'Input':
    case 'Select':
      return { width: 220, height: 72 };
    case 'SearchBar':
      return { width: 640, height: 128 };
    case 'Table':
    case 'TableSkeleton': {
      const columnCount = Math.max(arrayLength(item.props.columns), arrayLength(item.props.fields), 4);
      return { width: Math.min(1080, Math.max(520, columnCount * 92 + 36)), height: 180 };
    }
    case 'Form':
      return { width: 420, height: 220 };
    case 'Tabs':
      return { width: 320, height: 44 };
    case 'Modal':
      return { width: 420, height: 240 };
    case 'Drawer':
      return { width: 360, height: 320 };
    default:
      return { width: 80, height: 32 };
  }
}

function readableCanvasBox(item: ImagePrototypePlan['nodes'][number]) {
  const minimum = minimumNodeSize(item);
  return {
    x: item.x,
    y: item.y,
    width: Math.max(item.width, minimum.width),
    height: Math.max(item.height, minimum.height),
  };
}

function sourceBounds(nodes: ComponentNode[]) {
  const canvases = nodes.map((node) => node.canvas).filter((canvas): canvas is NonNullable<ComponentNode['canvas']> => Boolean(canvas));
  if (canvases.length === 0) return undefined;
  const left = Math.min(...canvases.map((canvas) => canvas.x));
  const top = Math.min(...canvases.map((canvas) => canvas.y));
  const right = Math.max(...canvases.map((canvas) => canvas.x + canvas.width));
  const bottom = Math.max(...canvases.map((canvas) => canvas.y + canvas.height));
  const parentFrameId = canvases.find((canvas) => canvas.parentFrameId)?.parentFrameId;
  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    zIndex: Math.max(...canvases.map((canvas) => canvas.zIndex)),
    ...(parentFrameId ? { parentFrameId } : {}),
  };
}

function searchFieldsFromNodes(nodes: ComponentNode[]) {
  return nodes
    .filter((node) => node.type === 'Input' || node.type === 'Select')
    .map((node, index) => ({
      key: typeof node.props.fieldKey === 'string' ? node.props.fieldKey : `field_${index + 1}`,
      label: typeof node.props.label === 'string' ? node.props.label : node.name,
      type: node.type === 'Select' ? 'select' : 'text',
      ...(Array.isArray(node.props.options) ? { options: node.props.options } : {}),
    }));
}

function tableColumnsFromSkeleton(nodes: ComponentNode[]) {
  const skeleton = nodes.find((node) => node.type === 'TableSkeleton');
  const count = typeof skeleton?.props.columns === 'number' ? Math.max(1, Math.round(skeleton.props.columns)) : 4;
  return Array.from({ length: count }, (_, index) => ({ key: `col_${index + 1}`, title: `字段${index + 1}` }));
}

export function inferImagePrototypePlan(analysis: ImagePrototypeAnalysis): ImagePrototypePlan {
  const text = normalizeText(analysis.text);
  const regions = analysis.regions ?? [];
  const cardCount = regions.filter((region) => region.kind === 'card').length;
  const hasTable = regions.some((region) => region.kind === 'table') || includesAny(text, TABLE_WORDS);
  const hasForm = regions.some((region) => region.kind === 'form') || includesAny(text, ['表单', '保存', '提交', '必填', 'Form']);
  const hasDashboard = cardCount >= 3 || includesAny(text, DASHBOARD_WORDS);

  if (hasDashboard && !hasForm) return buildDashboardPlan(analysis);
  if (hasForm && !hasTable) return buildFormPlan(analysis);
  return buildListPlan(analysis);
}

function materializeNode(item: ImagePrototypePlan['nodes'][number], frameId: string, zIndex: number): ComponentNode {
  const props = { ...item.props };
  if (typeof props.text === 'string' && props.content === undefined && ['H1', 'H2', 'H3', 'BodyText', 'HelperText', 'LinkText', 'ErrorText', 'Annotation', 'StickyNote', 'ModuleTitle', 'PageTitle', 'StatusLabel', 'AmountText', 'NumericText', 'TimeText'].includes(item.type)) {
    props.content = props.text;
  }
  const node = createNode(item.type, props);
  const box = readableCanvasBox(item);
  node.id = item.id ?? createId(`image_${item.type.toLowerCase()}`);
  node.name = item.name;
  node.canvas = { x: box.x, y: box.y, width: box.width, height: box.height, zIndex, parentFrameId: frameId };
  node.semantic = { moduleName: item.name, moduleType: item.type === 'PageTitle' ? 'pageHeader' : 'module' };
  return node;
}

export function createImageComponentCandidateOperation(project: Project, pageId: string, plan: ImagePrototypePlan, candidateId: string): Operation | undefined {
  const page = project.pages.find((item) => item.id === pageId);
  const candidate = plan.componentCandidates?.find((item) => item.id === candidateId);
  if (!page || !candidate) return undefined;
  const sourceNodes = candidate.sourceNodeIds.map((nodeId) => page.nodes[nodeId]).filter((node): node is ComponentNode => Boolean(node));
  if (sourceNodes.length === 0) return undefined;
  const bounds = sourceBounds(sourceNodes);
  if (!bounds) return undefined;

  const props =
    candidate.targetType === 'SearchBar'
      ? { fields: searchFieldsFromNodes(sourceNodes), submitText: '查询' }
      : candidate.targetType === 'Table'
        ? { columns: tableColumnsFromSkeleton(sourceNodes), actions: ['详情'] }
        : {};
  const replacement = createNode(candidate.targetType, props);
  replacement.id = createId(`candidate_${candidate.targetType.toLowerCase().replace(/[^a-z0-9]+/gi, '_')}`);
  replacement.name = candidate.targetType === 'SearchBar' ? '查询条件' : candidate.targetType === 'Table' ? '数据列表' : replacement.name;
  replacement.canvas = bounds;
  replacement.semantic = {
    moduleName: replacement.name,
    moduleType: candidate.targetType === 'SearchBar' ? 'search' : candidate.targetType === 'Table' ? 'table' : 'component',
    description: candidate.reason,
  };

  return {
    type: 'replaceNodesWithComponent',
    pageId,
    sourceNodeIds: candidate.sourceNodeIds,
    node: replacement,
  };
}

export function applyImagePrototypePlan(project: Project, pageId: string, frameId: string | undefined, plan: ImagePrototypePlan): Project {
  const draft = structuredClone(project);
  const page = draft.pages.find((item) => item.id === pageId);
  const existingFrame = page?.frames?.find((frame) => frame.id === frameId) ?? page?.frames?.[0];
  const targetFrameId = existingFrame?.id ?? createId('frame');
  const root = page ? page.nodes[page.rootNodeId] : undefined;
  if (!page || !root?.children) return draft;
  if (!page.frames?.some((frame) => frame.id === targetFrameId)) {
    page.frames = [
      ...(page.frames ?? []),
      { id: targetFrameId, name: '图片生成画板', x: 0, y: 0, width: FRAME_WIDTH, height: FRAME_HEIGHT, zIndex: Math.max(0, ...(page.frames ?? []).map((frame) => frame.zIndex)) + 1 },
    ];
  }

  let zIndex = getNextFrameZIndex(page as Page, targetFrameId);
  const nodes = plan.nodes.map((item) => materializeNode(item, targetFrameId, zIndex++));
  page.nodes = { ...page.nodes, ...Object.fromEntries(nodes.map((node) => [node.id, node])) };
  root.children = [...root.children, ...nodes.map((node) => node.id)];
  draft.updatedAt = new Date().toISOString();
  return draft;
}
