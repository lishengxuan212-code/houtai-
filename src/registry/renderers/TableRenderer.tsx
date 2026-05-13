import { Button, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { JsonRecord } from '../../domain/types';
import type { NodeRendererProps } from './rendererTypes';
import { asString } from './primitive';

type ColumnConfig = { key: string; title: string };
type TableColumnConfig = ColumnConfig & { actionItems?: string[] };

const ACTION_COLUMN_TITLES = new Set(['操作', 'actions', 'Actions']);
const MIN_COLUMN_WIDTH = 140;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeColumn(item: unknown, index: number): ColumnConfig | undefined {
  if (typeof item === 'string') {
    const title = item.trim();
    return title ? { key: title, title } : undefined;
  }
  if (!isRecord(item)) return undefined;
  const title = String(item.title ?? item.label ?? item.name ?? item.dataIndex ?? item.key ?? '').trim();
  const key = String((item.key ?? item.dataIndex ?? title) || `col_${index + 1}`).trim();
  return key ? { key, title: title || key } : undefined;
}

function normalizeColumns(value: unknown): ColumnConfig[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(normalizeColumn)
    .filter((column): column is ColumnConfig => Boolean(column));
}

function uniqueActions(...groups: unknown[]): string[] {
  return Array.from(
    new Set(
      groups
        .flatMap((group) => (Array.isArray(group) ? group : []))
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean),
    ),
  );
}

function normalizeActionItems(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
}

function normalizeActionGroups(value: unknown): Record<string, string[]> {
  if (!isRecord(value)) return {};
  return Object.entries(value).reduce<Record<string, string[]>>((groups, [key, value]) => {
    const items = normalizeActionItems(value);
    if (items.length > 0) groups[key] = items;
    return groups;
  }, {});
}

function actionGroupForColumn(column: ColumnConfig, groups: Record<string, string[]>): string[] {
  const candidates = [column.title, column.key, `${column.title}列`, `${column.key}列`];
  for (const candidate of candidates) {
    const group = groups[candidate];
    if (group?.length) return group;
  }
  return [];
}

function tableColumns(columns: ColumnConfig[], actions: string[], rowActions: unknown): TableColumnConfig[] {
  const groupedActions = normalizeActionGroups(rowActions);
  const hasGroupedActions = Object.keys(groupedActions).length > 0;

  if (hasGroupedActions) {
    return columns.map((column) => {
      const columnActions = actionGroupForColumn(column, groupedActions);
      const actionItems = ACTION_COLUMN_TITLES.has(column.title) ? uniqueActions(actions, columnActions) : columnActions;
      return actionItems.length ? { ...column, actionItems } : column;
    });
  }

  const flatActions = uniqueActions(actions, rowActions);
  const hasActionColumn = columns.some((column) => ACTION_COLUMN_TITLES.has(column.title));
  const nextColumns = hasActionColumn ? columns : columns.filter((column) => !ACTION_COLUMN_TITLES.has(column.title));

  if (!flatActions.length) return nextColumns;
  if (hasActionColumn) {
    return nextColumns.map((column) => (ACTION_COLUMN_TITLES.has(column.title) ? { ...column, actionItems: flatActions } : column));
  }
  return [...nextColumns, { key: 'actions', title: '操作', actionItems: flatActions }];
}

function readableCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(readableCell).filter(Boolean).join(' / ');
  if (isRecord(value)) {
    const preferred = value.text ?? value.label ?? value.title ?? value.name ?? value.value;
    return preferred !== undefined ? readableCell(preferred) : JSON.stringify(value);
  }
  return String(value);
}

function exampleRows(columns: ColumnConfig[], count = 3): JsonRecord[] {
  return Array.from({ length: count }, (_, rowIndex) => ({
    id: `preview_row_${rowIndex + 1}`,
    ...Object.fromEntries(columns.map((column) => [column.key, `${column.title}示例${rowIndex + 1}`])),
  }));
}

function firstRows(...values: unknown[]): JsonRecord[] {
  for (const value of values) {
    if (Array.isArray(value) && value.length) return value.filter(isRecord) as JsonRecord[];
  }
  return [];
}

export function TableRenderer({ node, context }: NodeRendererProps) {
  const dataSourceId = asString(node.props.dataSourceId, '');
  const propRows = firstRows(node.data?.rows, node.props.rows, node.props.data);
  const dataRows = propRows.length ? propRows : (context.getData?.(dataSourceId) ?? []);
  const rawColumns = tableColumns(normalizeColumns(node.props.columns), normalizeActionItems(node.props.actions), node.props.rowActions);
  const rows = dataRows.length ? dataRows : exampleRows(rawColumns);
  const tableMinWidth = Math.max(rawColumns.length * MIN_COLUMN_WIDTH, 360);

  const columns: ColumnsType<JsonRecord> = rawColumns.map((column) => ({
    title:
      context.mode === 'edit'
        ? (context.inlineEdit?.arrayItemText({ node, arrayProp: 'columns', itemKey: column.key, labelKey: 'title', value: column.title }) ?? column.title)
        : column.title,
    dataIndex: column.key,
    key: column.key,
    width: MIN_COLUMN_WIDTH,
    onHeaderCell: () => ({ style: { minWidth: MIN_COLUMN_WIDTH, whiteSpace: 'nowrap' } }),
    onCell: () => ({ style: { minWidth: MIN_COLUMN_WIDTH } }),
    render: (value, row, index) =>
      column.actionItems?.length ? (
        <Space>
          {column.actionItems.map((action) => (
            <Button
              key={action}
              type="link"
              danger={action.includes('删') || action.toLowerCase().includes('delete')}
              onClick={(event) => {
                event.stopPropagation();
                if (context.mode === 'edit') {
                  context.selectInteractionTarget?.(`${node.id}:${action}`);
                  return;
                }
                context.dispatch?.({ componentId: `${node.id}:${action}`, event: 'click', payload: { row, action } });
              }}
            >
              {action}
            </Button>
          ))}
        </Space>
      ) : (
        (context.mode === 'edit'
          ? (context.inlineEdit?.tableCellText?.({ node, rowIndex: index, columnKey: column.key, value: readableCell(value), row }) ?? readableCell(value))
          : readableCell(value))
      ),
  }));

  return (
    <div data-testid={`table-scroll-${node.id}`} style={{ overflowX: 'auto', width: '100%' }}>
      <Table
        size="small"
        rowKey={(row) => String(row.id ?? row.orderNo ?? Math.random())}
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 5 }}
        scroll={{ x: tableMinWidth }}
        style={{ minWidth: tableMinWidth }}
        onRow={(row, rowIndex) => ({
          onDoubleClick: () => context.dispatch?.({ componentId: node.id, event: 'rowClick', payload: { row, rowIndex: rowIndex ?? 0 } }),
        })}
      />
    </div>
  );
}
