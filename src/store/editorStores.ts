import { create } from 'zustand';
import type { NodeCanvasConfig } from '../domain/types';

export type CanvasInteractionKind = 'drag' | 'resize';

export type CanvasInteractionState = {
  kind: CanvasInteractionKind;
  pageId: string;
  nodeId: string;
  frameId: string;
  startPointer: { x: number; y: number };
  startCanvas: NodeCanvasConfig;
  previewCanvas: NodeCanvasConfig;
};

type CanvasInteractionStore = {
  active: CanvasInteractionState | undefined;
  visibleNodeCount: number;
  setVisibleNodeCount: (count: number) => void;
  beginInteraction: (state: CanvasInteractionState) => void;
  updateInteraction: (canvas: NodeCanvasConfig) => void;
  endInteraction: () => CanvasInteractionState | undefined;
  cancelInteraction: () => void;
};

export const useCanvasInteractionStore = create<CanvasInteractionStore>((set, get) => ({
  active: undefined,
  visibleNodeCount: 0,
  setVisibleNodeCount: (count) => set({ visibleNodeCount: count }),
  beginInteraction: (state) => set({ active: state }),
  updateInteraction: (canvas) =>
    set((state) => (state.active ? { active: { ...state.active, previewCanvas: canvas } } : {})),
  endInteraction: () => {
    const active = get().active;
    set({ active: undefined });
    return active;
  },
  cancelInteraction: () => set({ active: undefined }),
}));

type CanvasViewportStore = {
  zoom: number;
  spacePanActive: boolean;
  setZoom: (zoom: number) => void;
  setSpacePanActive: (active: boolean) => void;
  resetViewport: () => void;
};

export const useCanvasViewportStore = create<CanvasViewportStore>((set) => ({
  zoom: 1,
  spacePanActive: false,
  setZoom: (zoom) => set({ zoom }),
  setSpacePanActive: (active) => set({ spacePanActive: active }),
  resetViewport: () => set({ zoom: 1, spacePanActive: false }),
}));

type WorkbenchUiStore = {
  libraryTab: string;
  libraryScrollTop: number;
  rightInspectorTab: string;
  setLibraryTab: (tab: string) => void;
  setLibraryScrollTop: (scrollTop: number) => void;
  setRightInspectorTab: (tab: string) => void;
};

export const useWorkbenchUiStore = create<WorkbenchUiStore>((set) => ({
  libraryTab: 'library',
  libraryScrollTop: 0,
  rightInspectorTab: 'props',
  setLibraryTab: (libraryTab) => set({ libraryTab }),
  setLibraryScrollTop: (libraryScrollTop) => set({ libraryScrollTop }),
  setRightInspectorTab: (rightInspectorTab) => set({ rightInspectorTab }),
}));
