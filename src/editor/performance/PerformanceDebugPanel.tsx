import { useEffect, useState } from 'react';
import { getMetricSnapshot, type PerformanceMetricSnapshot } from './performanceMetrics';
import { useProjectStore } from '../../store/projectStore';
import { useCanvasInteractionStore } from '../../store/editorStores';

export function PerformanceDebugPanel() {
  const project = useProjectStore((state) => state.project);
  const currentPageId = useProjectStore((state) => state.currentPageId);
  const selectedNodeIds = useProjectStore((state) => state.selectedNodeIds);
  const visibleNodeCount = useCanvasInteractionStore((state) => state.visibleNodeCount);
  const [snapshot, setSnapshot] = useState<PerformanceMetricSnapshot>(() => getMetricSnapshot());

  useEffect(() => {
    const id = window.setInterval(() => setSnapshot(getMetricSnapshot()), 500);
    return () => window.clearInterval(id);
  }, []);

  const page = project.pages.find((item) => item.id === currentPageId);
  const nodeCount = page ? Object.keys(page.nodes).length : 0;

  return (
    <aside className="performance-debug-panel" aria-label="Performance Debug">
      <strong>Performance Debug</strong>
      <span>Nodes: {nodeCount}</span>
      <span>Visible: {visibleNodeCount}</span>
      <span>Selected: {selectedNodeIds.length}</span>
      <span>Recent: {snapshot.recentOperation ? `${snapshot.recentOperation.name} ${snapshot.recentOperation.durationMs}ms` : '-'}</span>
      <span>Canvas renders: {snapshot.counters.canvasRender ?? 0}</span>
      <span>Node renders: {snapshot.counters.nodeRender ?? 0}</span>
      <span>Store updates: {snapshot.counters.storeUpdate ?? 0}</span>
      <span>Persistence writes: {snapshot.counters.persistenceWrite ?? 0}</span>
    </aside>
  );
}
