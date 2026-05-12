import { RuntimeProvider } from '../../runtime/RuntimeProvider';
import { RuntimeRenderer } from '../../runtime/RuntimeRenderer';
import { useProjectStore } from '../../store/projectStore';
import { AssemblyCanvas } from '../AssemblyCanvas';
import './WorkbenchLayout.css';
import { LeftNavigatorPanel } from './LeftNavigatorPanel';
import { LibraryDockPanel } from './LibraryDockPanel';
import { ResizablePanels } from './ResizablePanels';
import { RightInspectorPanel } from './RightInspectorPanel';
import { TopPropertyBar } from './TopPropertyBar';
import { TopToolbar } from './TopToolbar';

function LeftWorkbench() {
  return (
    <aside className="workbench-left">
      <LeftNavigatorPanel />
      <LibraryDockPanel />
    </aside>
  );
}

export function WorkbenchShell({ onBackHome }: { onBackHome?: (() => void) | undefined }) {
  const project = useProjectStore((state) => state.project);
  const currentPageId = useProjectStore((state) => state.currentPageId);
  const currentFrameId = useProjectStore((state) => state.currentFrameId);
  const mode = useProjectStore((state) => state.mode);

  return (
    <div className="workbench-shell">
      <TopToolbar onBackHome={onBackHome} />
      {mode === 'preview' ? (
        <div className="preview-shell">
          <RuntimeProvider project={project} initialPageId={currentPageId}>
            <RuntimeRenderer project={project} {...(currentFrameId ? { activeFrameId: currentFrameId } : {})} />
          </RuntimeProvider>
        </div>
      ) : (
        <>
          <TopPropertyBar />
          <ResizablePanels left={<LeftWorkbench />} center={<AssemblyCanvas />} right={<RightInspectorPanel />} />
        </>
      )}
    </div>
  );
}
