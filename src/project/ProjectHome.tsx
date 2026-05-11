import { Button, Empty, Typography } from 'antd';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { listProjects } from './ProjectManager';
import { NewProjectModal } from '../editor/project/NewProjectModal';
import '../editor/workbench/WorkbenchLayout.css';
import { useProjectStore } from '../store/projectStore';

type ProjectHomeProps = {
  onOpenProject: (projectId: string) => void;
};

const businessTypeLabels: Record<string, string> = {
  blank: '空白后台',
  ecommerce: '电商后台',
  crm: 'CRM 后台',
  approval: '审批后台',
  cms: '内容管理',
  user_permission: '用户权限',
  dashboard: '数据看板',
  custom: '自定义',
};

export function ProjectHome({ onOpenProject }: ProjectHomeProps) {
  const [newOpen, setNewOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const openProject = useProjectStore((state) => state.openProject);
  const projects = listProjects();
  void refreshKey;

  function open(projectId: string) {
    openProject(projectId);
    onOpenProject(projectId);
  }

  return (
    <main className="project-home">
      <header className="project-home-header">
        <div>
          <Typography.Text type="secondary">Admin Prototype Studio</Typography.Text>
          <Typography.Title level={2}>项目列表</Typography.Title>
        </div>
        <Button type="primary" icon={<Plus size={16} />} onClick={() => setNewOpen(true)}>
          新建项目
        </Button>
      </header>

      {projects.length === 0 ? (
        <div className="project-home-empty">
          <Empty description="暂无项目">
            <Button type="primary" onClick={() => setNewOpen(true)}>创建第一个项目</Button>
          </Empty>
        </div>
      ) : (
        <section className="project-card-grid" aria-label="Project list">
          {projects.map((project) => {
            const canvasText = project.canvasSize ? `${project.canvasSize.width} x ${project.canvasSize.height}` : '1200 x 760';
            return (
              <button
                key={project.id}
                type="button"
                className="project-card"
                aria-label={`Open ${project.name}`}
                onClick={() => open(project.id)}
              >
                <div className="project-thumbnail">
                  <div className="project-thumbnail-topbar" />
                  <div className="project-thumbnail-sidebar" />
                  <div className="project-thumbnail-content">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
                <div className="project-card-body">
                  <Typography.Text strong>{project.name}</Typography.Text>
                  <Typography.Text type="secondary">{businessTypeLabels[project.businessType] ?? project.businessType}</Typography.Text>
                  <div className="project-card-meta">
                    <span>{project.pageCount} pages</span>
                    <span>{canvasText}</span>
                  </div>
                  <Typography.Text type="secondary">{new Date(project.updatedAt).toLocaleString()}</Typography.Text>
                </div>
              </button>
            );
          })}
        </section>
      )}

      <NewProjectModal
        open={newOpen}
        onClose={() => {
          setNewOpen(false);
          setRefreshKey((value) => value + 1);
          if (listProjects().length > projects.length) onOpenProject(useProjectStore.getState().project.id);
        }}
      />
    </main>
  );
}
