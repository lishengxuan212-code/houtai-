import { Button, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { JsonRecord } from '../../domain/types';
import type { NodeRendererProps } from './rendererTypes';
import { asArray, asString } from './primitive';

type ColumnConfig = { key: string; title: string };

export function TableRenderer({ node, context }: NodeRendererProps) {
  const dataSourceId = asString(node.props.dataSourceId, '');
  const propRows = asArray<JsonRecord>(node.data?.rows ?? node.props.rows, []);
  const rows = propRows.length ? propRows : (context.getData?.(dataSourceId) ?? []);
  const actions = asArray<string>(node.props.actions, []);
  const rawColumns = asArray<ColumnConfig>(node.props.columns, []);

  if (context.mode === 'edit') {
    return (
      <div className="design-table-renderer" data-testid={`design-renderer-${node.id}`}>
        <div className="design-table-header">
          {rawColumns.map((column) => (
            <span key={column.key}>
              {context.inlineEdit?.arrayItemText({ node, arrayProp: 'columns', itemKey: column.key, labelKey: 'title', value: column.title }) ?? column.title}
            </span>
          ))}
          {actions.length > 0 ? <span>操作</span> : null}
        </div>
        {(rows.length ? rows.slice(0, 5) : [{}]).map((row, index) => (
          <div className="design-table-row" key={String(row.id ?? row.key ?? index)}>
            {rawColumns.map((column) => (
              <span key={column.key}>{String(row[column.key] ?? '-')}</span>
            ))}
            {actions.length > 0 ? <span>{actions.join(' / ')}</span> : null}
          </div>
        ))}
      </div>
    );
  }

  const columns: ColumnsType<JsonRecord> = asArray<ColumnConfig>(node.props.columns, []).map((column) => ({
    title:
      context.mode === 'edit'
        ? (context.inlineEdit?.arrayItemText({ node, arrayProp: 'columns', itemKey: column.key, labelKey: 'title', value: column.title }) ?? column.title)
        : column.title,
    dataIndex: column.key,
    key: column.key,
    render: (value) => String(value ?? ''),
  }));

  if (actions.length > 0) {
    columns.push({
      title: '操作',
      key: 'actions',
      render: (_, row, index) => (
        <Space>
          {actions.map((action) => (
            <Button
              key={action}
              type="link"
              danger={action.includes('删')}
              onClick={(event) => {
                event.stopPropagation();
                if (context.mode === 'edit') {
                  context.selectInteractionTarget?.(`${node.id}:${action}`);
                  return;
                }
                context.dispatch?.({ componentId: `${node.id}:${action}`, event: 'click', payload: { row, action } });
              }}
            >
              {context.mode === 'edit'
                ? (context.inlineEdit?.arrayItemText({ node, arrayProp: 'actions', itemKey: action, labelKey: '', value: action }) ?? action)
                : action}
            </Button>
          ))}
          <Button
            type="link"
            onClick={(event) => {
              event.stopPropagation();
              if (context.mode === 'edit') {
                context.selectInteractionTarget?.(node.id);
                return;
              }
              context.dispatch?.({ componentId: node.id, event: 'rowClick', payload: { row, rowIndex: index } });
            }}
          >
            行点击
          </Button>
        </Space>
      ),
    });
  }

  return (
    <Table
      size="small"
      rowKey={(row) => String(row.id ?? row.orderNo ?? Math.random())}
      dataSource={rows}
      columns={columns}
      pagination={{ pageSize: 5 }}
      onRow={(row, rowIndex) => ({
        onDoubleClick: () => context.dispatch?.({ componentId: node.id, event: 'rowClick', payload: { row, rowIndex: rowIndex ?? 0 } }),
      })}
    />
  );
}
