import { Alert, Button, Empty, Space, Typography } from 'antd';
import { useMemo } from 'react';
import { createLayoutAdjustmentOperations } from '../ai/layoutAdjuster';
import { applyOperations } from '../domain/operations';
import { RuntimeProvider } from '../runtime/RuntimeProvider';
import { RuntimeRenderer } from '../runtime/RuntimeRenderer';
import { useProjectStore } from '../store/projectStore';

export function LayoutAdjustmentPanel({ onApplied }: { onApplied?: () => void }) {
  const project = useProjectStore((state) => state.project);
  const currentPageId = useProjectStore((state) => state.currentPageId);
  const currentFrameId = useProjectStore((state) => state.currentFrameId);
  const commitProject = useProjectStore((state) => state.commitProject);
  const operations = useMemo(() => createLayoutAdjustmentOperations(project, currentPageId, currentFrameId), [currentFrameId, currentPageId, project]);
  const previewProject = useMemo(() => (operations.length ? applyOperations(project, operations) : project), [operations, project]);
  const currentPage = project.pages.find((page) => page.id === currentPageId);

  function applyLayoutAdjustment() {
    if (operations.length === 0) return;
    const selectedNodeId = operations[0]?.type === 'updateNodeCanvas' ? operations[0].nodeId : currentPage?.rootNodeId;
    commitProject(previewProject, currentPageId, selectedNodeId);
    onApplied?.();
  }

  return (
    <Space orientation="vertical" size={12} style={{ width: '100%' }}>
      <Typography.Text type="secondary">
        按当前画布中同一行的组件进行横向整理，自动拉开重叠组件，并为上下行保留间距。
      </Typography.Text>
      {operations.length === 0 ? (
        <Empty description="当前页面暂无需要调整的布局" />
      ) : (
        <Alert type="info" showIcon message={`将调整 ${operations.length} 个组件的位置。`} />
      )}
      <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, maxHeight: 520, overflow: 'auto', padding: 12 }}>
        <RuntimeProvider project={previewProject} initialPageId={currentPageId}>
          <RuntimeRenderer project={previewProject} {...(currentFrameId ? { activeFrameId: currentFrameId } : {})} />
        </RuntimeProvider>
      </div>
      <Button type="primary" disabled={operations.length === 0} onClick={applyLayoutAdjustment}>
        应用布局调整
      </Button>
    </Space>
  );
}
