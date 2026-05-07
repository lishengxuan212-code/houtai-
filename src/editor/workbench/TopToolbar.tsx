import { Button, Input, Modal, Space, Typography } from 'antd';
import { Bot, GitBranch, Play, SquarePen } from 'lucide-react';
import { useMemo, useState } from 'react';
import { exportPlainPrd } from '../../export/plainPrd';
import { useProjectStore } from '../../store/projectStore';
import { LogicBoardPanel } from '../LogicBoardPanel';
import { ProjectToolbarActions } from '../project/ProjectToolbarActions';

export function TopToolbar() {
  const [logicBoardOpen, setLogicBoardOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const project = useProjectStore((state) => state.project);
  const mode = useProjectStore((state) => state.mode);
  const setMode = useProjectStore((state) => state.setMode);
  const renameProject = useProjectStore((state) => state.renameProject);
  const markdown = useMemo(() => exportPlainPrd(project), [project]);

  return (
    <header className="workbench-topbar">
      <div className="workbench-project-title">
        <Typography.Text type="secondary">Admin Prototype Studio</Typography.Text>
        <Input value={project.name} onChange={(event) => renameProject(event.target.value)} aria-label="项目名" />
      </div>
      <Space>
        <ProjectToolbarActions onExport={() => setExportOpen(true)} />
        <Button icon={<Bot size={16} />} onClick={() => setMode('edit')}>AI 检查</Button>
        <Button icon={<GitBranch size={16} />} onClick={() => setLogicBoardOpen(true)}>逻辑看板</Button>
        <Button
          type={mode === 'preview' ? 'default' : 'primary'}
          icon={mode === 'preview' ? <SquarePen size={16} /> : <Play size={16} />}
          onClick={() => setMode(mode === 'preview' ? 'edit' : 'preview')}
        >
          {mode === 'preview' ? '返回编辑' : '预览'}
        </Button>
      </Space>
      <Modal title="逻辑看板" open={logicBoardOpen} onCancel={() => setLogicBoardOpen(false)} footer={null} width={760}>
        <LogicBoardPanel />
      </Modal>
      <Modal title="导出 PRD" open={exportOpen} onCancel={() => setExportOpen(false)} footer={null} width={820}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Button onClick={() => void navigator.clipboard?.writeText(markdown)}>复制 Markdown</Button>
          <Input.TextArea rows={22} value={markdown} readOnly />
        </Space>
      </Modal>
    </header>
  );
}
