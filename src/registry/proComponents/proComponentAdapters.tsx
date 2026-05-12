import { Button, Card, Descriptions, Form, Input, InputNumber, Layout, List, Select, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { FieldConfig, JsonRecord } from '../../domain/types';
import type { NodeRendererProps } from '../renderers/rendererTypes';
import { asArray, asString } from '../renderers/primitive';

type ProColumn = {
  key: string;
  title: string;
  valueType?: string;
  search?: boolean;
};

function columnsFromProps(node: NodeRendererProps['node'], context: NodeRendererProps['context']): ColumnsType<JsonRecord> {
  return asArray<ProColumn>(node.props.columns, []).map((column) => ({
    title:
      context.mode === 'edit'
        ? (context.inlineEdit?.arrayItemText({ node, arrayProp: 'columns', itemKey: column.key, labelKey: 'title', value: column.title }) ?? column.title)
        : column.title,
    dataIndex: column.key,
    key: column.key,
    render: (value) => String(value ?? ''),
  }));
}

function rowsFromNode(node: NodeRendererProps['node'], context: NodeRendererProps['context']): JsonRecord[] {
  const dataSourceId = asString(node.props.dataSourceId, '');
  const configuredRows = asArray<JsonRecord>(node.data?.rows ?? node.props.data, []);
  return configuredRows.length ? configuredRows : (context.getData?.(dataSourceId) ?? []);
}

export function ProTableAdapter({ node, context }: NodeRendererProps) {
  const rows = rowsFromNode(node, context);
  const searchableColumns = asArray<ProColumn>(node.props.columns, []).filter((column) => column.search);
  return (
    <Card size="small" title={asString(node.props.headerTitle, '数据列表')}>
      {node.props.search ? (
        <Space style={{ marginBottom: 12 }} wrap>
          {searchableColumns.map((column) => (
            <Input key={column.key} placeholder={column.title} />
          ))}
          <Button type="primary">查询</Button>
          <Button>重置</Button>
        </Space>
      ) : null}
      <Table
        size="small"
        rowKey={(row) => String(row.id ?? row.key ?? JSON.stringify(row))}
        columns={columnsFromProps(node, context)}
        dataSource={rows}
        pagination={node.props.pagination ? { pageSize: 5 } : false}
        locale={{ emptyText: asString(node.props.emptyText, '暂无数据') }}
      />
    </Card>
  );
}

export function EditableProTableAdapter(props: NodeRendererProps) {
  return <ProTableAdapter {...props} />;
}

export function ProFormAdapter({ node, context }: NodeRendererProps) {
  const [form] = Form.useForm();
  const fields = asArray<FieldConfig>(node.content?.fields ?? node.props.fields, []);
  return (
    <Card size="small" title={asString(node.props.title, '业务表单')}>
      <Form form={form} layout={asString(node.props.layout, 'vertical') as 'vertical' | 'horizontal' | 'inline'} requiredMark={Boolean(node.props.requiredMark)} onFinish={(values) => context.dispatch?.({ componentId: node.id, event: 'submit', payload: { values, formId: node.id } })}>
        {fields.map((field) => {
          const fallbackLabel = field.label || field.key;
          const label =
            context.mode === 'edit'
              ? (context.inlineEdit?.arrayItemText({ node, arrayProp: 'fields', itemKey: field.key, labelKey: 'label', value: fallbackLabel }) ?? fallbackLabel)
              : fallbackLabel;
          return (
            <Form.Item key={field.key} name={field.key} label={label} rules={[{ required: Boolean(field.required), message: `请输入${fallbackLabel}` }]}>
              {field.type === 'number' || field.type === 'money' ? (
                <InputNumber style={{ width: '100%' }} />
              ) : field.type === 'select' || field.type === 'status' ? (
                <Select options={(field.options ?? []).map((item) => ({ label: item, value: item }))} />
              ) : (
                <Input />
              )}
            </Form.Item>
          );
        })}
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              {asString(node.props.submitText, '提交')}
            </Button>
            <Button onClick={() => form.resetFields()}>{asString(node.props.resetText, '重置')}</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}

export function ProLayoutAdapter({ node, children }: NodeRendererProps) {
  const menus = asArray<{ path: string; name: string }>(node.props.menus, []);
  return (
    <Layout style={{ minHeight: 320, border: '1px solid #f0f0f0' }}>
      {node.props.showSider ? (
        <Layout.Sider theme={node.props.theme === 'dark' ? 'dark' : 'light'} width={180}>
          <Typography.Title level={5} style={{ padding: 16, margin: 0 }}>
            {asString(node.props.title, '后台系统')}
          </Typography.Title>
          <div>
            {menus.map((menu) => (
              <div key={menu.path} style={{ padding: '8px 16px', background: menu.path === node.props.selectedMenu ? '#e6f4ff' : undefined }}>
                {menu.name}
              </div>
            ))}
          </div>
        </Layout.Sider>
      ) : null}
      <Layout>
        {node.props.showHeader ? <Layout.Header style={{ height: 48, lineHeight: '48px', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>{asString(node.props.title, '后台系统')}</Layout.Header> : null}
        <Layout.Content style={{ padding: 16 }}>{children}</Layout.Content>
      </Layout>
    </Layout>
  );
}

export function ProPageContainerAdapter({ node, children }: NodeRendererProps) {
  return (
    <section>
      <Typography.Title level={4}>{asString(node.props.title, '页面标题')}</Typography.Title>
      <Typography.Paragraph type="secondary">{asString(node.props.subTitle, '')}</Typography.Paragraph>
      {children}
    </section>
  );
}

export function ProCardAdapter({ node, children }: NodeRendererProps) {
  return (
    <Card size="small" title={asString(node.props.title, '卡片标题')} bordered={Boolean(node.props.bordered)}>
      {children}
    </Card>
  );
}

export function ProDescriptionsAdapter({ node }: NodeRendererProps) {
  const detailData = node.data?.record ?? node.props.data;
  const data = detailData && typeof detailData === 'object' && !Array.isArray(detailData) ? (detailData as JsonRecord) : {};
  return (
    <Descriptions size="small" title={asString(node.props.title, '详情信息')} bordered>
      {asArray<ProColumn>(node.props.columns, []).map((column) => (
        <Descriptions.Item key={column.key} label={column.title}>
          {String(data[column.key] ?? '')}
        </Descriptions.Item>
      ))}
    </Descriptions>
  );
}

export function ProListAdapter({ node }: NodeRendererProps) {
  return <List header={asString(node.props.title, '列表')} dataSource={asArray<{ title: string; description?: string }>(node.data?.items ?? node.props.items, [])} renderItem={(item) => <List.Item><List.Item.Meta title={item.title} description={item.description} /></List.Item>} />;
}
