import { Button, Space } from 'antd';
import { Download, FolderOpen, Plus, Save } from 'lucide-react';
import { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { NewProjectModal } from './NewProjectModal';
import { ProjectListModal } from './ProjectListModal';

export function ProjectToolbarActions({ onExport }: { onExport: () => void }) {
  const [newOpen, setNewOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const saveCurrentProject = useProjectStore((state) => state.saveCurrentProject);
  return (
    <>
      <Space>
        <Button icon={<Plus size={16} />} onClick={() => setNewOpen(true)}>新建项目</Button>
        <Button icon={<FolderOpen size={16} />} onClick={() => setListOpen(true)}>项目列表</Button>
        <Button icon={<Save size={16} />} onClick={saveCurrentProject}>保存</Button>
        <Button icon={<Download size={16} />} onClick={onExport}>导出 PRD</Button>
      </Space>
      <NewProjectModal open={newOpen} onClose={() => setNewOpen(false)} />
      <ProjectListModal open={listOpen} onClose={() => setListOpen(false)} />
    </>
  );
}
