import type { ComponentNode, NodeCanvasConfig, Operation, Page, PageFrame, Project } from '../domain/types';

const PAGE_PADDING = 24;
const HORIZONTAL_GAP = 12;
const ROW_GAP = 16;
const SECTION_GAP = 16;
const MIN_TABLE_HEIGHT = 28;

type LayoutEntry = {
  node: ComponentNode;
  canvas: NodeCanvasConfig;
};

type LayoutRow = {
  entries: LayoutEntry[];
};

const titleTypes = new Set(['PageTitle', 'ModuleTitle', 'H1', 'H2', 'H3']);
const tableTypes = new Set(['Table', 'TableSkeleton', 'pro.ProTable', 'pro.EditableProTable']);

function sameRow(row: LayoutRow, entry: LayoutEntry): boolean {
  const rowTop = Math.min(...row.entries.map((item) => item.canvas.y));
  const rowBottom = Math.max(...row.entries.map((item) => item.canvas.y + item.canvas.height));
  const entryCenter = entry.canvas.y + entry.canvas.height / 2;
  return entryCenter >= rowTop - 8 && entryCenter <= rowBottom + 8;
}

function visibleFrameEntries(page: Page, frameId: string): LayoutEntry[] {
  return Object.values(page.nodes)
    .filter((node) => node.id !== page.rootNodeId && node.type !== 'WhitePanel' && node.canvas?.parentFrameId === frameId && !node.canvas.hidden)
    .map((node) => ({ node, canvas: node.canvas as NodeCanvasConfig }))
    .sort((left, right) => left.canvas.y - right.canvas.y || left.canvas.x - right.canvas.x);
}

function whitePanelDeleteOperations(page: Page, frameId: string): Operation[] {
  return Object.values(page.nodes)
    .filter((node) => node.type === 'WhitePanel' && node.canvas?.parentFrameId === frameId && !node.canvas.hidden)
    .map((node): Operation => ({ type: 'deleteNode', pageId: page.id, nodeId: node.id }));
}

function innerWidth(frame: PageFrame): number {
  return Math.max(1, frame.width - PAGE_PADDING * 2);
}

function clampSizeToFrame(canvas: NodeCanvasConfig, frame: PageFrame, patch: Partial<NodeCanvasConfig>): Partial<NodeCanvasConfig> {
  const next: Partial<NodeCanvasConfig> = { ...patch };
  const maxWidth = innerWidth(frame);
  const maxHeight = Math.max(MIN_TABLE_HEIGHT, frame.height - PAGE_PADDING);
  const width = Math.min(patch.width ?? canvas.width, maxWidth);
  const height = Math.min(patch.height ?? canvas.height, maxHeight);
  if (patch.width !== undefined) next.width = width;
  if (patch.height !== undefined) next.height = height;
  if (patch.x !== undefined) next.x = Math.min(Math.max(0, frame.width - width), Math.max(PAGE_PADDING, patch.x));
  if (patch.y !== undefined) next.y = Math.min(Math.max(0, frame.height - height - PAGE_PADDING), Math.max(PAGE_PADDING, patch.y));
  return next;
}

function pushOperation(operations: Operation[], page: Page, frame: PageFrame, entry: LayoutEntry, patch: Partial<NodeCanvasConfig>) {
  const next = clampSizeToFrame(entry.canvas, frame, patch);
  const changedCanvas = Object.fromEntries(
    Object.entries(next).filter(([key, value]) => entry.canvas[key as keyof NodeCanvasConfig] !== value),
  ) as Partial<NodeCanvasConfig>;
  if (!Object.keys(changedCanvas).length) return;
  operations.push({
    type: 'updateNodeCanvas',
    pageId: page.id,
    nodeId: entry.node.id,
    canvas: { ...changedCanvas, parentFrameId: frame.id },
  });
}

function layoutInlineRows(params: {
  operations: Operation[];
  page: Page;
  frame: PageFrame;
  entries: LayoutEntry[];
  startY: number;
}): number {
  let x = PAGE_PADDING;
  let y = params.startY;
  let rowHeight = 0;

  for (const entry of params.entries.sort((left, right) => left.canvas.x - right.canvas.x || left.canvas.y - right.canvas.y)) {
    const width = Math.min(entry.canvas.width, innerWidth(params.frame));
    const height = entry.canvas.height;
    if (x > PAGE_PADDING && x + width > params.frame.width - PAGE_PADDING) {
      x = PAGE_PADDING;
      y += rowHeight + ROW_GAP;
      rowHeight = 0;
    }
    pushOperation(params.operations, params.page, params.frame, entry, { x, y, width });
    x += width + HORIZONTAL_GAP;
    rowHeight = Math.max(rowHeight, height);
  }

  return y + rowHeight;
}

export function groupEntriesByLayoutRows(entries: LayoutEntry[]): LayoutRow[] {
  const rows: LayoutRow[] = [];
  for (const entry of entries) {
    const row = rows.find((candidate) => sameRow(candidate, entry));
    if (row) row.entries.push(entry);
    else rows.push({ entries: [entry] });
  }
  return rows.map((row) => ({ entries: [...row.entries].sort((left, right) => left.canvas.x - right.canvas.x) }));
}

export function createLayoutAdjustmentOperations(project: Project, pageId: string, frameId?: string): Operation[] {
  const page = project.pages.find((item) => item.id === pageId);
  const activeFrameId = frameId ?? page?.frames?.[0]?.id;
  if (!page || !activeFrameId) return [];
  const frame = page.frames?.find((item) => item.id === activeFrameId);
  if (!frame) return whitePanelDeleteOperations(page, activeFrameId);

  const operations: Operation[] = [...whitePanelDeleteOperations(page, activeFrameId)];
  const entries = visibleFrameEntries(page, activeFrameId);
  const titles = entries.filter((entry) => titleTypes.has(entry.node.type));
  const tables = entries.filter((entry) => tableTypes.has(entry.node.type));
  const remaining = entries.filter((entry) => !titleTypes.has(entry.node.type) && !tableTypes.has(entry.node.type));
  let y = PAGE_PADDING;

  for (const entry of titles) {
    pushOperation(operations, page, frame, entry, { x: PAGE_PADDING, y, width: innerWidth(frame) });
    y += entry.canvas.height + SECTION_GAP;
  }

  if (remaining.length) {
    y = layoutInlineRows({ operations, page, frame, entries: remaining, startY: y });
    y += SECTION_GAP;
  }

  for (const entry of tables) {
    const availableHeight = Math.max(MIN_TABLE_HEIGHT, frame.height - y - PAGE_PADDING);
    const height = Math.min(entry.canvas.height, availableHeight);
    pushOperation(operations, page, frame, entry, { x: PAGE_PADDING, y, width: innerWidth(frame), height });
    y += height + SECTION_GAP;
  }

  return operations;
}
