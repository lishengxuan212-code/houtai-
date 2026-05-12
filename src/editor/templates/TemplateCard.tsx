import { Button, Popconfirm, Space, Tag, Typography } from 'antd';
import type { UserTemplate } from '../../templates/userTemplateTypes';

const typeLabels: Record<UserTemplate['type'], string> = {
  page: '页面模板',
  pageFrame: '页面模板',
  canvasBoard: '页面模板',
  block: '组件模板',
  group: '组件模板',
  component: '组件模板',
  componentPreset: '组件模板',
};

export function TemplateCard({
  template,
  onUse,
  onRename,
  onDelete,
  onDuplicate,
  onUpdate,
  onPreview,
}: {
  template: UserTemplate;
  onUse: (template: UserTemplate) => void;
  onRename: (template: UserTemplate) => void;
  onDelete: (template: UserTemplate) => void;
  onDuplicate: (template: UserTemplate) => void;
  onUpdate: (template: UserTemplate) => void;
  onPreview: (template: UserTemplate) => void;
}) {
  return (
    <div className="template-card">
      <Typography.Text strong>{template.name}</Typography.Text>
      <Typography.Text type="secondary">{template.description || '暂无说明'}</Typography.Text>
      <div>
        <Tag>{typeLabels[template.type]}</Tag>
        <Tag>{template.category}</Tag>
      </div>
      <Button size="small" block onClick={() => onUse(template)}>使用模板</Button>
      <Space size={6} wrap>
        <Button size="small" type="link" onClick={() => onPreview(template)}>预览</Button>
        <Button size="small" type="link" onClick={() => onRename(template)}>重命名</Button>
        <Button size="small" type="link" onClick={() => onUpdate(template)}>更新</Button>
        <Button size="small" type="link" onClick={() => onDuplicate(template)}>复制</Button>
        <Popconfirm title="删除模板？" okText="删除" cancelText="取消" onConfirm={() => onDelete(template)}>
          <Button size="small" type="link" danger>删除</Button>
        </Popconfirm>
      </Space>
    </div>
  );
}
