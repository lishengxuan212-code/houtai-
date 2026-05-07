import { Alert, Button, Input, Select, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { buildFieldKeyImpact } from '../domain/fieldImpact';
import type { DataSource, JsonRecord, JsonValue } from '../domain/types';
import { useProjectStore } from '../store/projectStore';

function nextRecord(source: DataSource): JsonRecord {
  const record: JsonRecord = { id: `record_${Date.now().toString(36)}` };
  for (const field of source.fields) record[field.key] = '';
  return record;
}

function updateRecordCell(records: JsonRecord[], rowIndex: number, key: string, value: JsonValue): JsonRecord[] {
  return records.map((record, index) => (index === rowIndex ? { ...record, [key]: value } : { ...record }));
}

export function DataPanel() {
  const project = useProjectStore((state) => state.project);
  const apply = useProjectStore((state) => state.apply);
  const [selectedSourceId, setSelectedSourceId] = useState(project.dataSources[0]?.id ?? '');
  const [pendingRename, setPendingRename] = useState<{ fromKey: string; toKey: string } | undefined>();
  const [lastRename, setLastRename] = useState<{ fromKey: string; toKey: string } | undefined>();
  const source = project.dataSources.find((item) => item.id === selectedSourceId) ?? project.dataSources[0];

  if (!source) return <Typography.Text type="secondary">暂无数据源</Typography.Text>;
  const currentSource = source;

  function updateRecords(records: JsonRecord[]) {
    apply({ type: 'updateDataSourceRecords', dataSourceId: currentSource.id, records });
  }

  function updateFieldLabel(fieldKey: string, label: string) {
    apply({
      type: 'updateDataSourceFields',
      dataSourceId: currentSource.id,
      fields: currentSource.fields.map((field) => (field.key === fieldKey ? { ...field, label } : field)),
    });
  }

  const impact = pendingRename ? buildFieldKeyImpact(project, { dataSourceId: currentSource.id, ...pendingRename }) : undefined;

  const columns: ColumnsType<JsonRecord> = currentSource.fields.map((field) => ({
    title: field.label,
    dataIndex: field.key,
    key: field.key,
    render: (_value, _record, index) => (
      <Input
        value={String(currentSource.records[index]?.[field.key] ?? '')}
        onChange={(event) => updateRecords(updateRecordCell(currentSource.records, index, field.key, event.target.value))}
      />
    ),
  }));

  columns.push({
    title: '操作',
    key: 'actions',
    width: 72,
    render: (_value, _record, index) => (
      <Button size="small" danger icon={<Trash2 size={14} />} onClick={() => updateRecords(currentSource.records.filter((_item, itemIndex) => itemIndex !== index))} />
    ),
  });

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Typography.Text strong>示例数据</Typography.Text>
      <Select value={currentSource.id} options={project.dataSources.map((item) => ({ label: item.name, value: item.id }))} style={{ width: '100%' }} onChange={setSelectedSourceId} />
      <Typography.Text strong>字段定义</Typography.Text>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {currentSource.fields.map((field) => (
          <div className="data-field-row" key={field.key}>
            <Input value={field.label} onChange={(event) => updateFieldLabel(field.key, event.target.value)} placeholder="字段名称" />
            <Input value={pendingRename?.fromKey === field.key ? pendingRename.toKey : field.key} onChange={(event) => setPendingRename({ fromKey: field.key, toKey: event.target.value })} placeholder="字段 key" />
          </div>
        ))}
      </Space>
      {impact ? (
        <Alert
          type={impact.canAutoSync ? 'warning' : 'error'}
          showIcon
          message="字段 key 影响分析"
          description={
            <Space direction="vertical" size={6}>
              <Typography.Text>
                将 {impact.fromKey} 改为 {impact.toKey}，影响 {impact.items.length} 处：{impact.items.map((item) => item.type).join('、')}
              </Typography.Text>
              {impact.conflicts.length > 0 ? <Typography.Text type="danger">{impact.conflicts.join('，')}</Typography.Text> : null}
              <Button
                size="small"
                type="primary"
                disabled={!impact.canAutoSync || !impact.toKey.trim()}
                onClick={() => {
                  apply({ type: 'renameDataSourceFieldKey', dataSourceId: currentSource.id, fromKey: impact.fromKey, toKey: impact.toKey });
                  setLastRename({ fromKey: impact.fromKey, toKey: impact.toKey });
                  setPendingRename(undefined);
                }}
              >
                同步替换
              </Button>
            </Space>
          }
        />
      ) : null}
      {lastRename ? (
        <Button
          onClick={() => {
            apply({ type: 'renameDataSourceFieldKey', dataSourceId: currentSource.id, fromKey: lastRename.toKey, toKey: lastRename.fromKey });
            setLastRename(undefined);
          }}
        >
          撤销上次 key 同步
        </Button>
      ) : null}
      <Typography.Text strong>示例记录</Typography.Text>
      <Table size="small" rowKey={(record, index) => String(record.id ?? index)} pagination={false} dataSource={currentSource.records} columns={columns} scroll={{ x: true }} />
      <Button icon={<Plus size={14} />} onClick={() => updateRecords([...currentSource.records, nextRecord(currentSource)])}>
        新增示例数据
      </Button>
    </Space>
  );
}
