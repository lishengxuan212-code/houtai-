import { Button, Empty, Input, List, Modal, Space, Tag, Typography } from 'antd';
import { Bot, GitBranch, Home, LayoutGrid, Package, Play, SquarePen } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  loadAiModelDefaultSettings,
  loadPrdAiReviewDefaultSettings,
  isModelConfigured,
  savePrdAiReviewDefaultSettings,
  type AiModelSettings,
} from '../../ai/modelSettings';
import { runAiRulesForPage } from '../../ai/rules';
import { generatePrdAiReviewPreview, generatePrdAiReviewWithModel, PRD_AI_REVIEW_PROMPT } from '../../export/prdEnhancements';
import { exportPlainPrd } from '../../export/plainPrd';
import { useProjectStore } from '../../store/projectStore';
import { AiPanel } from '../AiPanel';
import { ComponentSystemPanel } from '../components/ComponentSystemPanel';
import { LayoutAdjustmentPanel } from '../LayoutAdjustmentPanel';
import { LogicBoardPanel } from '../LogicBoardPanel';
import { ProjectToolbarActions } from '../project/ProjectToolbarActions';
import { WORKBENCH_MODAL_WIDTH } from './modalConstants';

const severityColor = {
  error: 'red',
  warning: 'orange',
  info: 'blue',
} as const;

function updateReviewConfig(settings: AiModelSettings, patch: Partial<AiModelSettings['visionStructure']>): AiModelSettings {
  return { ...settings, visionStructure: { ...settings.visionStructure, ...patch } };
}

export function TopToolbar({ onBackHome }: { onBackHome?: (() => void) | undefined }) {
  const [logicBoardOpen, setLogicBoardOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [reviewPreviewOpen, setReviewPreviewOpen] = useState(false);
  const [aiCheckOpen, setAiCheckOpen] = useState(false);
  const [aiGenerateOpen, setAiGenerateOpen] = useState(false);
  const [layoutAdjustOpen, setLayoutAdjustOpen] = useState(false);
  const [componentSystemOpen, setComponentSystemOpen] = useState(false);
  const [markdown, setMarkdown] = useState('');
  const [reviewPreview, setReviewPreview] = useState('');
  const [exportStatus, setExportStatus] = useState('');
  const [generatingReview, setGeneratingReview] = useState(false);
  const [reviewSettings, setReviewSettings] = useState<AiModelSettings>(() => loadPrdAiReviewDefaultSettings());
  const project = useProjectStore((state) => state.project);
  const currentPageId = useProjectStore((state) => state.currentPageId);
  const mode = useProjectStore((state) => state.mode);
  const setMode = useProjectStore((state) => state.setMode);
  const renameProject = useProjectStore((state) => state.renameProject);
  const updatePrdMarkdown = useProjectStore((state) => state.updatePrdMarkdown);
  const currentPage = project.pages.find((page) => page.id === currentPageId);
  const aiSuggestions = useMemo(() => runAiRulesForPage(project, currentPageId), [currentPageId, project]);
  const currentMarkdown = markdown || project.prdMarkdown || exportPlainPrd(project);

  const openExport = () => {
    setMarkdown(project.prdMarkdown || exportPlainPrd(project));
    setExportOpen(true);
  };

  const updateMarkdown = (next: string) => {
    setMarkdown(next);
    updatePrdMarkdown(next);
  };

  const openReviewPreview = async () => {
    setGeneratingReview(true);
    setExportStatus(isModelConfigured(reviewSettings.visionStructure) ? 'AI 审核生成中...' : '未配置 PRD AI 审核模型，已使用本地规则生成预览。');
    try {
      const next = isModelConfigured(reviewSettings.visionStructure)
        ? await generatePrdAiReviewWithModel(reviewSettings.visionStructure, project, currentMarkdown)
        : generatePrdAiReviewPreview(project, currentMarkdown);
      setReviewPreview(next);
      setReviewPreviewOpen(true);
      setExportStatus('AI 审核预览已生成，确认后输出 PRD。');
    } catch (error) {
      setReviewPreview(generatePrdAiReviewPreview(project, currentMarkdown));
      setReviewPreviewOpen(true);
      setExportStatus(error instanceof Error ? `${error.message}，已改用本地规则生成预览。` : 'AI 审核失败，已改用本地规则生成预览。');
    } finally {
      setGeneratingReview(false);
    }
  };

  return (
    <header className="workbench-topbar">
      <div className="workbench-project-title">
        <Typography.Text type="secondary">Admin Prototype Studio</Typography.Text>
        <Input value={project.name} onChange={(event) => renameProject(event.target.value)} aria-label="项目名称" />
      </div>
      <Space>
        {onBackHome ? <Button icon={<Home size={16} />} onClick={onBackHome}>首页</Button> : null}
        <ProjectToolbarActions onExport={openExport} />
        <Button icon={<Package size={16} />} onClick={() => setComponentSystemOpen(true)}>组件系统</Button>
        <Button icon={<Bot size={16} />} onClick={() => setAiGenerateOpen(true)}>AI 生成</Button>
        <Button icon={<LayoutGrid size={16} />} onClick={() => setLayoutAdjustOpen(true)}>布局调整</Button>
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
      <Modal title="当前页面 AI 检查" open={aiCheckOpen} onCancel={() => setAiCheckOpen(false)} footer={null} width={WORKBENCH_MODAL_WIDTH}>
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
      <Modal title="AI 生成页面" open={aiGenerateOpen} onCancel={() => setAiGenerateOpen(false)} footer={null} width={WORKBENCH_MODAL_WIDTH}>
        <AiPanel />
      </Modal>
      <Modal title="AI 布局调整" open={layoutAdjustOpen} onCancel={() => setLayoutAdjustOpen(false)} footer={null} width={1040}>
        <LayoutAdjustmentPanel onApplied={() => setLayoutAdjustOpen(false)} />
      </Modal>
      <Modal title="组件系统" open={componentSystemOpen} onCancel={() => setComponentSystemOpen(false)} footer={null} width={WORKBENCH_MODAL_WIDTH}>
        <ComponentSystemPanel />
      </Modal>
      <Modal title="逻辑看板" open={logicBoardOpen} onCancel={() => setLogicBoardOpen(false)} footer={null} width={WORKBENCH_MODAL_WIDTH}>
        <LogicBoardPanel />
      </Modal>
      <Modal title="导出 PRD" open={exportOpen} onCancel={() => setExportOpen(false)} footer={null} width={WORKBENCH_MODAL_WIDTH}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space wrap>
            <Button onClick={() => updateMarkdown(exportPlainPrd(project))}>生成 PRD</Button>
            <Button loading={generatingReview} onClick={() => void openReviewPreview()}>AI 审核</Button>
            <Button onClick={() => void navigator.clipboard?.writeText(currentMarkdown)}>复制 Markdown</Button>
          </Space>
          {exportStatus ? <Typography.Text type="secondary">{exportStatus}</Typography.Text> : null}
          <Typography.Text strong>PRD AI 审核配置</Typography.Text>
          <Typography.Text type="secondary">默认读取 AI 生成默认配置；保存后只影响 PRD AI 审核，不影响 AI 生成。</Typography.Text>
          <Input
            aria-label="PRD AI 审核 API 地址"
            placeholder="API 地址"
            value={reviewSettings.visionStructure.apiUrl}
            onChange={(event) => setReviewSettings(updateReviewConfig(reviewSettings, { apiUrl: event.target.value }))}
          />
          <Input.Password
            aria-label="PRD AI 审核 API Key"
            placeholder="API Key"
            value={reviewSettings.visionStructure.apiKey}
            onChange={(event) => setReviewSettings(updateReviewConfig(reviewSettings, { apiKey: event.target.value }))}
          />
          <Input
            aria-label="PRD AI 审核模型"
            placeholder="模型名称"
            value={reviewSettings.visionStructure.model}
            onChange={(event) => setReviewSettings(updateReviewConfig(reviewSettings, { model: event.target.value }))}
          />
          <Space wrap>
            <Button onClick={() => setReviewSettings(loadAiModelDefaultSettings())}>使用 AI 生成默认配置</Button>
            <Button onClick={() => savePrdAiReviewDefaultSettings(reviewSettings)}>保存为 PRD AI 审核默认配置</Button>
          </Space>
          <Typography.Text type="secondary">{PRD_AI_REVIEW_PROMPT}</Typography.Text>
          <Input.TextArea rows={18} value={currentMarkdown} onChange={(event) => updateMarkdown(event.target.value)} />
        </Space>
      </Modal>
      <Modal
        title="AI 审核预览"
        open={reviewPreviewOpen}
        width={WORKBENCH_MODAL_WIDTH}
        okText="确认润色并输出"
        cancelText="返回修改"
        onOk={() => {
          updateMarkdown(reviewPreview);
          setReviewPreviewOpen(false);
        }}
        onCancel={() => setReviewPreviewOpen(false)}
      >
        <Input.TextArea rows={18} value={reviewPreview} onChange={(event) => setReviewPreview(event.target.value)} />
      </Modal>
    </header>
  );
}
