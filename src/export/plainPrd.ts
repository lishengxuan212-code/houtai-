import { walkPageNodes } from '../domain/selectors';
import type { Action, ComponentNode, Interaction, JsonRecord, JsonValue, Page, PageFrame, Project } from '../domain/types';
import { componentLabel } from '../registry/componentLabels';
import { bullet, sectionTitle } from './plainPrdFormatter';
import { sanitizePlainPrd } from './plainPrdVocabulary';

type DetailBlock = {
  title: string;
  items: string[];
};

type ModuleInfo = {
  name: string;
  type: string;
  description: string;
};

const tableTypes = new Set(['Table', 'pro.ProTable', 'pro.EditableProTable']);
const formTypes = new Set(['Form', 'pro.ProForm']);
const detailTypes = new Set(['Card', 'Descriptions', 'pro.ProCard', 'pro.ProDescriptions']);
const modalTypes = new Set(['Modal', 'Drawer']);
const textWidgetTypes = new Set([
  'H1',
  'H2',
  'H3',
  'BodyText',
  'HelperText',
  'LinkText',
  'ErrorText',
  'Annotation',
  'StickyNote',
  'ModuleTitle',
  'PageTitle',
  'StatusLabel',
  'AmountText',
  'NumericText',
  'TimeText',
]);

function readableNodeName(node: ComponentNode): string {
  return node.semantic?.moduleName?.trim() || node.name || componentLabel(node.type);
}

function asRecord(value: JsonValue | undefined): JsonRecord | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : undefined;
}

function asArray(value: JsonValue | undefined): JsonValue[] {
  return Array.isArray(value) ? value : [];
}

function text(value: JsonValue | undefined): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function labelsFromList(value: JsonValue | undefined): string[] {
  return asArray(value)
    .map((item) => {
      if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') return String(item);
      const record = asRecord(item);
      return text(record?.label) || text(record?.title) || text(record?.name) || text(record?.text) || text(record?.content) || text(record?.value);
    })
    .filter(Boolean);
}

function columnLabels(node: ComponentNode): string[] {
  return labelsFromList(node.props.columns);
}

function rowValues(node: ComponentNode): string[] {
  const rows = asArray(node.data?.rows).length ? asArray(node.data?.rows) : (asArray(node.props.rows).length ? asArray(node.props.rows) : asArray(node.props.data));
  const firstRow = asRecord(rows[0]);
  if (!firstRow) return [];
  const columns = asArray(node.props.columns).map(asRecord).filter((item): item is JsonRecord => Boolean(item));
  const keys = columns.map((column) => text(column.key)).filter(Boolean);
  const values = (keys.length ? keys : Object.keys(firstRow))
    .map((key) => text(firstRow[key]))
    .filter(Boolean)
    .slice(0, 6);
  return values.length ? [`示例内容：${values.join('、')}`] : [];
}

function actionLabels(node: ComponentNode): string[] {
  return labelsFromList(node.props.actions);
}

function fieldDetails(node: ComponentNode): string[] {
  return asArray(node.content?.fields ?? node.props.fields)
    .map(asRecord)
    .filter((field): field is JsonRecord => Boolean(field))
    .map((field) => {
      const parts = [text(field.label) || text(field.title) || text(field.key)];
      if (text(field.required) === 'true') parts.push('必填');
      const options = labelsFromList(field.options);
      if (options.length) parts.push(`可选项：${options.join('、')}`);
      const defaultValue = text(field.defaultValue);
      if (defaultValue) parts.push(`默认值：${defaultValue}`);
      const validation = text(field.validation) || text(field.rules);
      if (validation) parts.push(`校验：${validation}`);
      return parts.filter(Boolean).join('，');
    })
    .filter(Boolean);
}

function buttonTexts(node: ComponentNode): string[] {
  const values = [text(node.props.text), text(node.props.submitText), text(node.props.resetText)].filter(Boolean);
  if (node.type === 'Button' && !values.length) values.push(readableNodeName(node));
  return values;
}

function textContents(node: ComponentNode): string[] {
  if (!textWidgetTypes.has(node.type)) return [];
  return [text(node.props.content), text(node.content?.content), text(node.props.label)].filter(Boolean);
}

function floatButtonContents(node: ComponentNode): string[] {
  if (!node.type.startsWith('FloatButton')) return [];
  const values = [text(node.props.content), text(node.props.tooltip)].filter(Boolean);
  for (const item of asArray(node.props.items)) {
    const record = asRecord(item);
    const label = text(record?.content) || text(record?.label);
    if (label) values.push(label);
  }
  return values;
}

function optionDetails(node: ComponentNode): DetailBlock[] {
  const blocks: DetailBlock[] = [];
  const menus = labelsFromList(node.content?.menuItems ?? node.props.menuItems);
  if (menus.length) blocks.push({ title: '菜单项', items: menus });
  const options = labelsFromList(node.content?.options ?? node.props.options);
  if (options.length) blocks.push({ title: '可选项', items: options });
  const tabs = labelsFromList(node.content?.items ?? node.props.items);
  if (node.type === 'Tabs' && tabs.length) blocks.push({ title: '标签页', items: tabs });
  if (node.type === 'Steps' && tabs.length) blocks.push({ title: '步骤', items: tabs });
  const menuItems = labelsFromList(node.content?.items ?? node.props.items);
  if (node.type === 'Menu' && menuItems.length) blocks.push({ title: '菜单项', items: menuItems });
  return blocks;
}

function modalDetails(node: ComponentNode): DetailBlock[] {
  if (!modalTypes.has(node.type)) return [];
  const blocks: DetailBlock[] = [];
  const title = text(node.props.title);
  const content = text(node.content?.body ?? node.props.content);
  const footerButtons = labelsFromList(node.content?.footerButtons ?? node.props.footerButtons);
  if (title) blocks.push({ title: '标题', items: [title] });
  if (content) blocks.push({ title: '显示内容', items: [content] });
  if (footerButtons.length) blocks.push({ title: '底部按钮', items: footerButtons });
  return blocks;
}

function moduleType(node: ComponentNode, pageNodes: ComponentNode[]): string {
  if (node.semantic?.moduleType?.trim()) return node.semantic.moduleType.trim();
  if (node.type === 'SearchBar') return '搜索区';
  if (tableTypes.has(node.type)) return '列表区';
  if (formTypes.has(node.type)) return '表单区';
  if (detailTypes.has(node.type)) return '详情区';
  if (modalTypes.has(node.type)) return node.type === 'Drawer' ? '抽屉区' : '弹窗区';
  if (node.type === 'Dropdown' || node.type === 'Button' || node.type === 'FloatButton' || node.type === 'FloatButton.Group') return '操作区';
  if (node.children?.some((childId) => pageNodes.some((item) => item.id === childId && (item.type === 'Button' || item.type === 'Dropdown')))) return '操作区';
  return `${componentLabel(node.type)}区`;
}

function moduleDescription(node: ComponentNode, type: string): string {
  if (node.semantic?.description?.trim()) return node.semantic.description.trim();
  if (type === '搜索区') return '用于按条件查询并筛选页面内容。';
  if (type === '操作区') return '提供新增、批量处理、导出或其他业务动作入口。';
  if (type === '列表区') return '展示业务记录，并提供查看、编辑或处理入口。';
  if (type === '表单区') return '填写并提交业务处理所需的信息。';
  if (type === '详情区') return '展示当前业务对象的关键信息和明细内容。';
  if (type === '弹窗区' || type === '抽屉区') return '承载确认、详情查看或表单处理内容。';
  return `展示${componentLabel(node.type)}相关业务内容。`;
}

function moduleInfo(node: ComponentNode, pageNodes: ComponentNode[]): ModuleInfo {
  const type = moduleType(node, pageNodes);
  return {
    name: readableNodeName(node),
    type,
    description: moduleDescription(node, type),
  };
}

function detailBlocksForNode(node: ComponentNode): DetailBlock[] {
  const blocks: DetailBlock[] = [];
  const textItems = textContents(node);
  if (textItems.length) blocks.push({ title: '显示文案', items: textItems });
  const floatItems = floatButtonContents(node);
  if (floatItems.length) blocks.push({ title: '显示内容', items: floatItems });
  const fields = fieldDetails(node);
  if (fields.length) blocks.push({ title: formTypes.has(node.type) ? '表单字段' : '字段', items: fields });
  const columns = columnLabels(node);
  if (columns.length) blocks.push({ title: tableTypes.has(node.type) || detailTypes.has(node.type) ? '显示字段' : '字段', items: columns });
  const rowSamples = rowValues(node);
  if (rowSamples.length) blocks.push({ title: '列表内容', items: rowSamples });
  const actions = actionLabels(node);
  if (actions.length) blocks.push({ title: '行内按钮', items: actions });
  const buttons = buttonTexts(node);
  if (buttons.length) blocks.push({ title: '按钮', items: buttons.map((item) => `点击“${item}”`) });
  blocks.push(...optionDetails(node));
  blocks.push(...modalDetails(node));
  const emptyText = text(node.props.emptyText);
  if (emptyText) blocks.push({ title: '空状态', items: [emptyText] });
  const successMessage = text(node.props.successMessage);
  if (successMessage) blocks.push({ title: '成功提示', items: [successMessage] });
  return blocks;
}

function childNodes(page: Page, node: ComponentNode): ComponentNode[] {
  return (node.children ?? []).map((childId) => page.nodes[childId]).filter((child): child is ComponentNode => Boolean(child));
}

function mergeBlocks(blocks: DetailBlock[]): DetailBlock[] {
  const byTitle = new Map<string, string[]>();
  for (const block of blocks) {
    const current = byTitle.get(block.title) ?? [];
    for (const item of block.items) {
      if (!current.includes(item)) current.push(item);
    }
    byTitle.set(block.title, current);
  }
  return Array.from(byTitle, ([title, items]) => ({ title, items }));
}

function collectDetailBlocks(page: Page, node: ComponentNode): DetailBlock[] {
  return mergeBlocks([detailBlocksForNode(node), ...childNodes(page, node).flatMap((child) => detailBlocksForNode(child))].flat());
}

function actionText(project: Project, action: Action): string {
  switch (action.type) {
    case 'openModal':
      return '打开对应弹窗或抽屉。';
    case 'closeModal':
      return '关闭当前弹窗或抽屉。';
    case 'navigate': {
      const page = project.pages.find((item) => item.id === action.targetPageId);
      return `进入${page?.name ?? '目标页面'}。`;
    }
    case 'setVariable':
      return '记录当前选择或填写内容，供后续页面继续使用。';
    case 'refreshData':
      return '刷新页面显示内容。';
    case 'showMessage':
      return `显示“${action.message}”提示。`;
    case 'resetForm':
      return '清空表单内容。';
    case 'submitMock':
      if (action.operation === 'delete') return '确认后删除当前记录，并刷新列表。';
      if (action.operation === 'update') return '保存修改内容，并刷新列表。';
      return '提交表单内容，保存成功后刷新列表。';
  }
}

function interactionsForNode(interactions: Interaction[], node: ComponentNode): Interaction[] {
  return interactions.filter((interaction) => (interaction.trigger.componentId.split(':')[0] ?? interaction.trigger.componentId) === node.id);
}

function numberName(index: number): string {
  return ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][index - 1] ?? String(index);
}

function renderModule(project: Project, page: Page, pageNodes: ComponentNode[], node: ComponentNode, index: number): string {
  const info = moduleInfo(node, pageNodes);
  const lines: string[] = [`#### 模块${numberName(index)}：${info.name}`, '', `类型：${info.type}`, '', '用途：', info.description, ''];
  for (const block of collectDetailBlocks(page, node)) {
    lines.push(`${block.title}：`, bullet(block.items), '');
  }
  const related = interactionsForNode(project.interactions, node);
  if (related.length) {
    lines.push('操作说明：');
    for (const interaction of related) {
      const source = interaction.trigger.componentId.includes(':') ? `点击“${interaction.trigger.componentId.split(':').slice(1).join(':')}”` : `触发“${info.name}”`;
      lines.push(`- ${source}后，${interaction.actions.map((action) => actionText(project, action)).join('')}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

function renderPages(project: Project): string {
  return ['| 页面 | 主要用途 |', '|---|---|', ...project.pages.map((page) => `| ${page.name} | ${page.purpose ?? '用于完成后台业务操作'} |`)].join('\n');
}

function parentByNodeId(page: Page): Map<string, string> {
  const parents = new Map<string, string>();
  for (const node of Object.values(page.nodes)) {
    for (const childId of node.children ?? []) parents.set(childId, node.id);
  }
  return parents;
}

function isInsideFrame(node: ComponentNode, frame: PageFrame): boolean {
  if (node.canvas?.parentFrameId === frame.id) return true;
  if (!node.canvas) return false;
  const centerX = node.canvas.x + node.canvas.width / 2;
  const centerY = node.canvas.y + node.canvas.height / 2;
  return centerX >= frame.x && centerX <= frame.x + frame.width && centerY >= frame.y && centerY <= frame.y + frame.height;
}

function nodesForFrame(page: Page, frame?: PageFrame): ComponentNode[] {
  const allNodes = walkPageNodes(page).filter((node) => node.id !== page.rootNodeId && !node.meta?.hiddenInEditor && !node.canvas?.hidden);
  if (!frame) return allNodes;
  const direct = new Set(allNodes.filter((node) => isInsideFrame(node, frame)).map((node) => node.id));
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of allNodes) {
      if (direct.has(node.id) && node.children) {
        for (const childId of node.children) {
          if (!direct.has(childId) && page.nodes[childId]) {
            direct.add(childId);
            changed = true;
          }
        }
      }
    }
  }
  return allNodes.filter((node) => direct.has(node.id));
}

function canvasOrder(node: ComponentNode, fallback: number): number {
  if (!node.canvas) return fallback * 100_000;
  return node.canvas.y * 10_000 + node.canvas.x + fallback;
}

function moduleNodes(page: Page, scopedNodes: ComponentNode[]): ComponentNode[] {
  const scopedIds = new Set(scopedNodes.map((node) => node.id));
  const parents = parentByNodeId(page);
  return scopedNodes
    .filter((node) => !textWidgetTypes.has(node.type))
    .filter((node) => {
      const parentId = parents.get(node.id);
      return !parentId || parentId === page.rootNodeId || !scopedIds.has(parentId);
    })
    .map((node, index) => ({ node, order: canvasOrder(node, index) }))
    .sort((left, right) => left.order - right.order)
    .map(({ node }) => node);
}

function renderFrameContent(project: Project, page: Page, scopedNodes: ComponentNode[]): string {
  const lines: string[] = [];
  const standaloneText = scopedNodes.filter((node) => textWidgetTypes.has(node.type)).flatMap(textContents);
  if (standaloneText.length) lines.push('显示文案：', bullet(standaloneText), '');
  const modules = moduleNodes(page, scopedNodes);
  modules.forEach((node, index) => lines.push(renderModule(project, page, scopedNodes, node, index + 1)));
  if (!modules.length && !standaloneText.length) lines.push('暂无可导出的页面内容。', '');
  return lines.join('\n');
}

function renderPageModules(project: Project): string {
  const sections: string[] = [];
  project.pages.forEach((page, pageIndex) => {
    sections.push(`### 3.${pageIndex + 1} ${page.name}`);
    if (page.frames?.length) {
      for (const frame of [...page.frames].sort((left, right) => left.zIndex - right.zIndex)) {
        sections.push(`#### 可见页面：${frame.name}`);
        sections.push(renderFrameContent(project, page, nodesForFrame(page, frame)));
      }
      return;
    }
    sections.push(renderFrameContent(project, page, nodesForFrame(page)));
  });
  return sections.join('\n');
}

function renderInteractionSummary(project: Project): string {
  const rows = project.interactions.flatMap((interaction) =>
    interaction.actions.map((action) => {
      const triggerLabel = interaction.trigger.componentId.includes(':') ? `点击“${interaction.trigger.componentId.split(':').slice(1).join(':')}”` : interaction.name;
      return `| ${triggerLabel} | ${actionText(project, action)} |`;
    }),
  );
  return ['| 操作 | 结果 |', '|---|---|', ...(rows.length ? rows : ['| 暂未配置 | 暂无 |'])].join('\n');
}

export function exportPlainPrd(project: Project): string {
  const markdown = `${sectionTitle(1, `${project.name} PRD`)}

${sectionTitle(2, '1. 项目说明')}

${project.description || `该后台用于支持${project.name}相关业务的查询、处理和跟进。`}

${sectionTitle(2, '2. 页面清单')}

${renderPages(project)}

${sectionTitle(2, '3. 页面与模块说明')}

${renderPageModules(project)}

${sectionTitle(2, '4. 主要交互说明')}

${renderInteractionSummary(project)}

${sectionTitle(2, '5. 异常和提示')}

- 如果必填内容为空，页面提示用户补充。
- 如果执行删除等高风险操作，需要先让用户确认。
- 如果提交成功，页面显示成功提示。
- 如果没有可展示内容，页面显示空状态提示。`;
  return sanitizePlainPrd(markdown);
}
