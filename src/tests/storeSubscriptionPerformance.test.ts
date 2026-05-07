import { describe, expect, it } from 'vitest';
import { useCanvasInteractionStore, useCanvasViewportStore } from '../store/editorStores';
import { useProjectStore } from '../store/projectStore';

describe('editor hot-state stores', () => {
  it('keeps viewport changes outside project store subscriptions', () => {
    let projectNotifications = 0;
    const unsubscribe = useProjectStore.subscribe(() => {
      projectNotifications += 1;
    });

    useCanvasViewportStore.getState().setZoom(1.25);
    unsubscribe();

    expect(projectNotifications).toBe(0);
    expect(useCanvasViewportStore.getState().zoom).toBe(1.25);
  });

  it('keeps drag interaction state outside project data', () => {
    const beforeProject = useProjectStore.getState().project;
    useCanvasInteractionStore.getState().beginInteraction({
      kind: 'drag',
      pageId: 'page',
      nodeId: 'node',
      frameId: 'frame',
      startPointer: { x: 0, y: 0 },
      startCanvas: { x: 0, y: 0, width: 100, height: 50, zIndex: 1 },
      previewCanvas: { x: 0, y: 0, width: 100, height: 50, zIndex: 1 },
    });
    useCanvasInteractionStore.getState().updateInteraction({ x: 20, y: 30, width: 100, height: 50, zIndex: 1 });

    expect(useProjectStore.getState().project).toBe(beforeProject);
    expect(useCanvasInteractionStore.getState().active?.previewCanvas).toMatchObject({ x: 20, y: 30 });
  });
});
