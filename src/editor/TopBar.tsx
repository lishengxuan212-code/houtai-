import { useState } from 'react';
import { Button, Modal, Space, Typography } from 'antd';
import { Bot, Download, GitBranch, Play, RotateCcw, SquarePen } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { LogicBoardPanel } from './LogicBoardPanel';

export function TopBar() {
  const [logicBoardOpen, setLogicBoardOpen] = useState(false);
  const project = useProjectStore((state) => state.project);
  const mode = useProjectStore((state) => state.mode);
  const setMode = useProjectStore((state) => state.setMode);
  const reset = useProjectStore((state) => state.reset);

  return (
    <header className="top-bar">
      <div>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Admin Prototype Studio
        </Typography.Title>
        <Typography.Text type="secondary">{project.name}</Typography.Text>
      </div>
      <Space>
        <Button icon={<RotateCcw size={16} />} onClick={reset}>
          重置 Demo
        </Button>
        <Button icon={<Bot size={16} />} onClick={() => setMode('edit')}>
          编辑检查
        </Button>
        <Button icon={<Download size={16} />} onClick={() => setMode('edit')}>
          PRD
        </Button>
        <Button icon={<GitBranch size={16} />} onClick={() => setLogicBoardOpen(true)}>
          逻辑看板
        </Button>
        <Button
          type={mode === 'preview' ? 'default' : 'primary'}
          icon={mode === 'preview' ? <SquarePen size={16} /> : <Play size={16} />}
          onClick={() => setMode(mode === 'preview' ? 'edit' : 'preview')}
        >
          {mode === 'preview' ? '返回编辑' : '预览'}
        </Button>
      </Space>
      <Modal
        title="逻辑看板"
        open={logicBoardOpen}
        onCancel={() => setLogicBoardOpen(false)}
        footer={null}
        width={760}
      >
        <LogicBoardPanel />
      </Modal>
    </header>
  );
}
