import { Button, Empty, Input, List, Modal, Popconfirm, Space, Typography } from 'antd';
import { useState } from 'react';
import { listProjects } from '../../project/ProjectManager';
import { useProjectStore } from '../../store/projectStore';

export function ProjectListModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [renamingId, setRenamingId] = useState<string>();
  const [name, setName] = useState('');
  const openProject = useProjectStore((state) => state.openProject);
  const renameProjectRecord = useProjectStore((state) => state.renameProjectRecord);
  const deleteProjectRecord = useProjectStore((state) => state.deleteProjectRecord);

  const projects = open ? listProjects() : [];
  const refresh = () => setRefreshKey((value) => value + 1);
  void refreshKey;

  return (
    <Modal title="项目列表" open={open} onCancel={onClose} footer={null} width={680}>
      {projects.length === 0 ? <Empty description="暂无已保存项目" /> : null}
      <List
        dataSource={projects}
        renderItem={(project) => (
          <List.Item
            actions={[
              <Button key="open" size="small" type="link" onClick={() => { openProject(project.id); onClose(); }}>打开</Button>,
              <Button key="rename" size="small" type="link" onClick={() => { setRenamingId(project.id); setName(project.name); }}>重命名</Button>,
              <Popconfirm key="delete" title="删除项目？" onConfirm={() => { deleteProjectRecord(project.id); refresh(); }}>
                <Button size="small" type="link" danger>删除</Button>
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              title={
                renamingId === project.id ? (
                  <Space.Compact>
                    <Input size="small" value={name} onChange={(event) => setName(event.target.value)} />
                    <Button size="small" onClick={() => { renameProjectRecord(project.id, name); setRenamingId(undefined); refresh(); }}>保存</Button>
                  </Space.Compact>
                ) : (
                  project.name
                )
              }
              description={`${project.businessType} · ${project.pageCount} 个页面 · ${new Date(project.updatedAt).toLocaleString()}`}
            />
          </List.Item>
        )}
      />
      <Typography.Text type="secondary">最近项目按更新时间排序。</Typography.Text>
    </Modal>
  );
}
