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
  setZoom: (zoom: number) => void;
};

export const useCanvasViewportStore = create<CanvasViewportStore>((set) => ({
  zoom: 1,
  setZoom: (zoom) => set({ zoom }),
}));

