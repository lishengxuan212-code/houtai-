import { Button, Empty, Input, Modal, Space, Typography } from 'antd';
import { useState } from 'react';
import { deleteUserTemplate, duplicateUserTemplate, listUserTemplates, renameUserTemplate } from '../../templates/templateOperations';
import type { UserTemplate } from '../../templates/userTemplateTypes';
import { SaveTemplateModal } from './SaveTemplateModal';
import { TemplateCard } from './TemplateCard';
import { useTemplateActions } from './useTemplateActions';

export function TemplateLibraryPanel() {
  const [saveOpen, setSaveOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [renaming, setRenaming] = useState<UserTemplate | undefined>();
  const [renameValue, setRenameValue] = useState('');
  const [updating, setUpdating] = useState<UserTemplate | undefined>();
  const { useTemplate } = useTemplateActions();
  const templates: UserTemplate[] = listUserTemplates();
  const refresh = () => setRefreshKey((value) => value + 1);
  void refreshKey;

  return (
    <div className="panel-section">
      <div className="panel-heading">
        <Typography.Text strong>模板库</Typography.Text>
        <Button size="small" onClick={() => setSaveOpen(true)}>保存模板</Button>
      </div>
      {templates.length === 0 ? <Empty description="暂无用户模板" /> : null}
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onUse={useTemplate}
            onRename={(item) => {
              setRenaming(item);
              setRenameValue(item.name);
            }}
            onDelete={(item) => {
              deleteUserTemplate(item.id);
              refresh();
            }}
            onDuplicate={(item) => {
              duplicateUserTemplate(item.id);
              refresh();
            }}
            onUpdate={(item) => setUpdating(item)}
          />
        ))}
      </Space>
      <SaveTemplateModal open={saveOpen} onClose={() => { setSaveOpen(false); refresh(); }} />
      {updating ? <SaveTemplateModal open templateToUpdate={updating} onClose={() => { setUpdating(undefined); refresh(); }} /> : null}
      <Modal
        title="重命名模板"
        open={Boolean(renaming)}
        onCancel={() => setRenaming(undefined)}
        onOk={() => {
          if (renaming && renameValue.trim()) renameUserTemplate(renaming.id, renameValue.trim());
          setRenaming(undefined);
          refresh();
        }}
      >
        <Input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} />
      </Modal>
    </div>
  );
}
