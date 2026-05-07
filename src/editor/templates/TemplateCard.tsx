import { Button, Tag, Typography } from 'antd';
import type { UserTemplate } from '../../templates/userTemplateTypes';

const typeLabels: Record<UserTemplate['type'], string> = {
  page: '页面模板',
  block: '区块模板',
  component: '组件模板',
};

export function TemplateCard({ template, onUse }: { template: UserTemplate; onUse: (template: UserTemplate) => void }) {
  return (
    <div className="template-card">
      <Typography.Text strong>{template.name}</Typography.Text>
      <Typography.Text type="secondary">{template.description || '暂无说明'}</Typography.Text>
      <div>
        <Tag>{typeLabels[template.type]}</Tag>
        <Tag>{template.category}</Tag>
      </div>
      <Button size="small" block onClick={() => onUse(template)}>使用模板</Button>
    </div>
  );
}
