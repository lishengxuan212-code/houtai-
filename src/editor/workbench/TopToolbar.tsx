import { Button, Empty, Input, List, Modal, Space, Tag, Typography } from 'antd';
import { Bot, GitBranch, Home, Play, SquarePen } from 'lucide-react';
import { useMemo, useState } from 'react';
import { runAiRulesForPage } from '../../ai/rules';
import { exportPlainPrd } from '../../export/plainPrd';
import { useProjectStore } from '../../store/projectStore';
import { LogicBoardPanel } from '../LogicBoardPanel';
import { ProjectToolbarActions } from '../project/ProjectToolbarActions';

const severityColor = {
  error: 'red',
  warning: 'orange',
  info: 'blue',
} as const;

export function TopToolbar({ onBackHome }: { onBackHome?: (() => void) | undefined }) {
  const [logicBoardOpen, setLogicBoardOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [aiCheckOpen, setAiCheckOpen] = useState(false);
  const project = useProjectStore((state) => state.project);
  const currentPageId = useProjectStore((state) => state.currentPageId);
  const mode = useProjectStore((state) => state.mode);
  const setMode = useProjectStore((state) => state.setMode);
  const renameProject = useProjectStore((state) => state.renameProject);
  const markdown = useMemo(() => exportPlainPrd(project), [project]);
  const currentPage = project.pages.find((page) => page.id === currentPageId);
  const aiSuggestions = useMemo(() => runAiRulesForPage(project, currentPageId), [currentPageId, project]);

  return (
    <header className="workbench-topbar">
      <div className="workbench-project-title">
        <Typography.Text type="secondary">Admin Prototype Studio</Typography.Text>
        <Input value={project.name} onChange={(event) => renameProject(event.target.value)} aria-label="项目名称" />
      </div>
      <Space>
        {onBackHome ? <Button icon={<Home size={16} />} onClick={onBackHome}>首页</Button> : null}
        <ProjectToolbarActions onExport={() => setExportOpen(true)} />
        <Button icon={<Bot size={16} />} onClick={() => setAiCheckOpen(true)}>AI 检查</Button>
        <Button icon={<GitBranch size={16} />} onClick={() => setLogicBoardOpen(true)}>逻辑看板</Button>
        <Button
          type={mode === 'preview' ? 'default' : 'primary'}
          icon={mode === 'preview' ? <SquarePen size={16} /> : <Play size={16} />}
          onClick={() => setMode(mode === 'preview' ? 'edit' : 'preview')}
        >
          {mode === 'preview' ? '返回编辑' : '预览'}
        </Button>
      </Space>
      <Modal title="当前页面 AI 检查" open={aiCheckOpen} onCancel={() => setAiCheckOpen(false)} footer={null} width={760}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Text type="secondary">检查页面：{currentPage?.name ?? currentPageId}</Typography.Text>
          {aiSuggestions.length === 0 ? (
            <Empty description="当前页面没有发现规则问题" />
          ) : (
            <List
              size="small"
              dataSource={aiSuggestions}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color={severityColor[item.severity]}>{item.severity}</Tag>
                        <Typography.Text strong>{item.title}</Typography.Text>
                      </Space>
                    }
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          )}
        </Space>
      </Modal>
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
