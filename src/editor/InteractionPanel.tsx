import { Alert, Button, Empty, Form, Input, List, Select, Space, Switch, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import type { JsonValue } from '../domain/types';
import { buildInteractionTemplate, type InteractionTemplateId, type InteractionTemplateInput } from '../interactions/templateBuilders';
import { componentLabel } from '../registry/componentLabels';
import { useProjectStore } from '../store/projectStore';
import { interactionsForSelection, nodeName, resultText, triggerText } from './interactionSummary';

const templateOptions: { label: string; value: InteractionTemplateId }[] = [
  { label: '按钮打开弹窗', value: 'buttonOpenModal' },
  { label: '关闭弹窗', value: 'closeModal' },
  { label: '跳转页面', value: 'navigatePage' },
  { label: '表单提交', value: 'formSubmit' },
  { label: '搜索刷新表格', value: 'searchRefreshTable' },
  { label: '删除二次确认', value: 'deleteWithConfirm' },
  { label: '显示提示', value: 'showMessage' },
  { label: '显示组件', value: 'showNode' },
  { label: '隐藏组件', value: 'hideNode' },
  { label: '切换显示/隐藏', value: 'toggleNodeVisibility' },
  { label: '启用组件', value: 'enableNode' },
  { label: '禁用组件', value: 'disableNode' },
  { label: '切换启用/禁用', value: 'toggleNodeDisabled' },
];

export function InteractionPanel() {
  const project = useProjectStore((state) => state.project);
  const selectedNodeId = useProjectStore((state) => state.selectedNodeId);
  const apply = useProjectStore((state) => state.apply);
  const [errors, setErrors] = useState<string[]>([]);
  const interactions = interactionsForSelection(project, selectedNodeId);

  const nodes = useMemo(() => project.pages.flatMap((page) => Object.values(page.nodes)), [project.pages]);
  if (!selectedNodeId) return <Empty description="请选择组件" />;

  const nodeOptions = nodes.flatMap((node) => {
    const base = [{ label: `${node.name} / ${componentLabel(node.type)}`, value: node.id }];
    if (node.type === 'Table' && Array.isArray(node.props.actions)) {
      return [
        ...base,
        ...node.props.actions
          .filter((item): item is string => typeof item === 'string')
          .map((action) => ({ label: `${node.name}中的「${action}」`, value: `${node.id}:${action}` })),
      ];
    }
    return base;
  });
  const modalOptions = nodes.filter((node) => node.type === 'Modal' || node.type === 'Drawer').map((node) => ({ label: node.name, value: node.id }));
  const pageOptions = project.pages.map((page) => ({ label: page.name, value: page.id }));
  const dataOptions = project.dataSources.map((source) => ({ label: source.name, value: source.id }));

  function addFromWizard(values: Record<string, JsonValue>) {
    const input: InteractionTemplateInput = {
      templateId: String(values.templateId ?? 'showMessage') as InteractionTemplateId,
      triggerComponentId: String(values.triggerComponentId ?? selectedNodeId),
    };
    if (values.targetNodeId) input.targetNodeId = String(values.targetNodeId);
    if (values.targetPageId) input.targetPageId = String(values.targetPageId);
    if (values.dataSourceId) input.dataSourceId = String(values.dataSourceId);
    if (values.message) input.message = String(values.message);
    const result = buildInteractionTemplate(project, input);
    setErrors(result.errors);
    result.interactions.forEach((interaction) => apply({ type: 'addInteraction', interaction }));
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Form
        key={selectedNodeId}
        layout="vertical"
        onFinish={addFromWizard}
        initialValues={{ templateId: 'showMessage', triggerComponentId: selectedNodeId, message: '操作成功' }}
      >
        <Typography.Text strong>交互配置向导</Typography.Text>
        <Typography.Paragraph type="secondary" style={{ marginTop: 6, marginBottom: 8 }}>
          当前查看：{nodeName(project, selectedNodeId)}
        </Typography.Paragraph>
        {errors.length > 0 ? <Alert type="error" message={errors.join('，')} showIcon /> : null}
        <Form.Item name="templateId" label="交互模板">
          <Select options={templateOptions} />
        </Form.Item>
        <Form.Item name="triggerComponentId" label="触发组件/按钮">
          <Select options={nodeOptions} showSearch optionFilterProp="label" />
        </Form.Item>
        <Form.Item noStyle shouldUpdate>
          {({ getFieldValue }) => {
            const templateId = getFieldValue('templateId') as InteractionTemplateId;
            return (
              <>
                {templateId === 'buttonOpenModal' || templateId === 'closeModal' || templateId === 'formSubmit' || templateId === 'deleteWithConfirm' ? (
                  <Form.Item name="targetNodeId" label="目标弹窗/抽屉">
                    <Select options={modalOptions} />
                  </Form.Item>
                ) : null}
                {templateId === 'showNode' ||
                templateId === 'hideNode' ||
                templateId === 'toggleNodeVisibility' ||
                templateId === 'enableNode' ||
                templateId === 'disableNode' ||
                templateId === 'toggleNodeDisabled' ? (
                  <Form.Item name="targetNodeId" label="目标组件">
                    <Select options={nodeOptions} showSearch optionFilterProp="label" />
                  </Form.Item>
                ) : null}
                {templateId === 'navigatePage' ? (
                  <Form.Item name="targetPageId" label="目标页面">
                    <Select options={pageOptions} />
                  </Form.Item>
                ) : null}
                {templateId === 'formSubmit' || templateId === 'searchRefreshTable' || templateId === 'deleteWithConfirm' ? (
                  <Form.Item name="dataSourceId" label="数据源">
                    <Select options={dataOptions} />
                  </Form.Item>
                ) : null}
                {templateId === 'formSubmit' || templateId === 'showMessage' || templateId === 'deleteWithConfirm' ? (
                  <Form.Item name="message" label="提示文案">
                    <Input />
                  </Form.Item>
                ) : null}
              </>
            );
          }}
        </Form.Item>
        <Button type="primary" htmlType="submit" block>
          生成交互
        </Button>
      </Form>
      <List
        size="small"
        header={<Typography.Text strong>此处相关交互</Typography.Text>}
        dataSource={interactions}
        locale={{ emptyText: '当前选择范围内没有交互' }}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Switch key="enabled" checked={item.enabled} onChange={(enabled) => apply({ type: 'updateInteraction', interactionId: item.id, patch: { enabled } })} />,
              <Button key="delete" size="small" danger onClick={() => apply({ type: 'deleteInteraction', interactionId: item.id })}>
                删除
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <>
                  {nodeName(project, item.trigger.componentId)} <Tag>{triggerText(item.trigger.event)}</Tag>
                </>
              }
              description={item.actions.map((action) => resultText(project, action)).join('，')}
            />
          </List.Item>
        )}
      />
    </Space>
  );
}
