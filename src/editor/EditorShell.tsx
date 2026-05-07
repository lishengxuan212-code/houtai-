import { useState } from 'react';
import { RuntimeProvider } from '../runtime/RuntimeProvider';
import { RuntimeRenderer } from '../runtime/RuntimeRenderer';
import { useProjectStore } from '../store/projectStore';
import { AssemblyCanvas } from './AssemblyCanvas';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { TopBar } from './TopBar';
import { PerformanceDebugPanel } from './performance/PerformanceDebugPanel';
import './editor.css';

export function EditorShell() {
  const isDev = Boolean((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV);
  const project = useProjectStore((state) => state.project);
  const currentPageId = useProjectStore((state) => state.currentPageId);
  const mode = useProjectStore((state) => state.mode);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  return (
    <div className="studio-shell">
      <TopBar />
      {mode === 'preview' ? (
        <div className="preview-shell">
          <RuntimeProvider project={project} initialPageId={currentPageId}>
            <RuntimeRenderer project={project} />
          </RuntimeProvider>
        </div>
      ) : (
        <div className={`editor-grid${leftCollapsed ? ' left-collapsed' : ''}${rightCollapsed ? ' right-collapsed' : ''}`}>
          <LeftPanel collapsed={leftCollapsed} onToggle={() => setLeftCollapsed((value) => !value)} />
          <AssemblyCanvas />
          <RightPanel collapsed={rightCollapsed} onToggle={() => setRightCollapsed((value) => !value)} />
          {isDev ? <PerformanceDebugPanel /> : null}
        </div>
      )}
    </div>
  );
}
