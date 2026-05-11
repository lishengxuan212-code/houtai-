import { create } from 'zustand';
import { applyOperation, applyOperations } from '../domain/operations';
import { createId } from '../domain/ids';
import { findParentNode, getPage } from '../domain/selectors';
import type { JsonRecord, NodeCanvasConfig, Operation, Project } from '../domain/types';
import {
  bringNodeToFrontByZIndex,
  getNextFrameZIndex,
  moveNodeBackwardByZIndex,
  moveNodeForwardByZIndex,
  sendNodeToBackByZIndex,
  type CanvasAlignment,
  type DistributionDirection,
} from '../domain/canvas';
import type { CreateProjectOptions } from '../project/ProjectManager';
import { createProjectFromTemplate, deleteProject as deleteProjectRecordById, openProject as openProjectRecord, renameProject as renameProjectRecordById, saveProjectRecord as saveProjectRecordById } from '../project/ProjectManager';
import { createNode } from '../registry/createNode';
import { loadProject, saveProject, scheduleProjectSave } from './persistence';
import { initialProject } from './initialProject';
import { incrementMetric, measureMetric } from '../editor/performance/performanceMetrics';

type ProjectStore = {
  project: Project;
  currentPageId: string;
  currentFrameId: string | undefined;
  selectedNodeId: string | undefined;
  selectedNodeIds: string[];
  clipboardNodeIds: string[];
  pastProjects: Project[];
  futureProjects: Project[];
  mode: 'edit' | 'preview';
  dirty: boolean;
  apply: (operation: Operation) => void;
  renameProject: (name: string) => void;
  selectPage: (pageId: string) => void;
  selectFrame: (frameId: string | undefined) => void;
  renameCurrentPage: (name: string) => void;
  deleteCurrentPage: () => void;
  deletePage: (pageId: string) => void;
  selectNode: (nodeId: string | undefined) => void;
  selectNodes: (nodeIds: string[]) => void;
  setMode: (mode: 'edit' | 'preview') => void;
  addPage: () => void;
  addComponent: (type: string) => void;
  addComponentToParent: (type: string, parentNodeId: string, canvas?: Partial<NodeCanvasConfig>) => void;
  renameSelectedNode: (name: string) => void;
  updateSelectedProps: (props: JsonRecord) => void;
  updateSelectedContent: (content: JsonRecord) => void;
  updateSelectedData: (data: JsonRecord) => void;
  updateSelectedEvents: (events: Record<string, JsonRecord>) => void;
  deleteSelectedNode: () => void;
  copySelectedNodes: () => void;
  pasteClipboard: () => void;
  undo: () => void;
  redo: () => void;
  alignSelectedNodes: (alignment: CanvasAlignment) => void;
  distributeSelectedNodes: (direction: DistributionDirection) => void;
  bringSelectedToFront: () => void;
  sendSelectedToBack: () => void;
  moveSelectedForward: () => void;
  moveSelectedBackward: () => void;
  reorderLayerStack: (orderedNodeIds: string[], frameId?: string) => void;
  groupSelectedNodes: () => void;
  ungroupSelectedNode: () => void;
  moveSelectedNode: (direction: 'up' | 'down') => void;
  reorderNode: (nodeId: string, targetNodeId: string, position?: 'before' | 'after') => void;
  reorderNodeToIndex: (nodeId: string, parentNodeId: string, targetIndex: number) => void;
  moveNodeToParent: (nodeId: string, newParentNodeId: string) => void;
  reset: () => void;
  replaceProject: (project: Project, currentPageId?: string, selectedNodeId?: string) => void;
  commitProject: (project: Project, currentPageId?: string, selectedNodeId?: string) => void;
  createProject: (options: CreateProjectOptions) => void;
  openProject: (projectId: string) => void;
  saveCurrentProject: () => void;
  renameProjectRecord: (projectId: string, name: string) => void;
  deleteProjectRecord: (projectId: string) => void;
};

function persist(project: Project) {
  saveProject(project);
  return project;
}

function persistLater(project: Project) {
  scheduleProjectSave(project);
  return project;
}

export const useProjectStore = create<ProjectStore>((set, get) => {
  const project = loadProject();
  const commitOperations = (operations: Operation[]) => {
    if (operations.length === 0) return;
    set((state) => {
      const next = measureMetric('projectApply', () => applyOperations(state.project, operations));
      incrementMetric('storeUpdate');
      persistLater(next);
      return { project: next, dirty: true, pastProjects: [...state.pastProjects, state.project].slice(-50), futureProjects: [] };
    });
  };
  return {
    project,
    currentPageId: project.pages[0]?.id ?? initialProject.pages[0]!.id,
    currentFrameId: project.pages[0]?.frames?.[0]?.id,
    selectedNodeId: project.pages[0]?.rootNodeId,
    selectedNodeIds: project.pages[0]?.rootNodeId ? [project.pages[0].rootNodeId] : [],
    clipboardNodeIds: [],
    pastProjects: [],
    futureProjects: [],
    mode: 'edit',
    dirty: false,
    apply: (operation) =>
      set((state) => {
        const next = measureMetric('projectApply', () => applyOperation(state.project, operation));
        incrementMetric('storeUpdate');
        persistLater(next);
        return { project: next, dirty: true, pastProjects: [...state.pastProjects, state.project].slice(-50), futureProjects: [] };
      }),
    renameProject: (name) =>
      set((state) => {
        const next = persist({ ...state.project, name, updatedAt: new Date().toISOString() });
        return { project: next };
      }),
    selectPage: (pageId) =>
      set((state) => {
        const page = getPage(state.project, pageId);
        return page ? { currentPageId: pageId, currentFrameId: page.frames?.[0]?.id, selectedNodeId: page.rootNodeId, selectedNodeIds: [page.rootNodeId] } : {};
      }),
    selectFrame: (frameId) => set({ currentFrameId: frameId }),
    selectNode: (nodeId) => set({ selectedNodeId: nodeId, selectedNodeIds: nodeId ? [nodeId] : [] }),
    selectNodes: (nodeIds) => set({ selectedNodeId: nodeIds[0], selectedNodeIds: nodeIds }),
    renameCurrentPage: (name) => {
      const state = get();
      state.apply({ type: 'updatePage', pageId: state.currentPageId, patch: { name } });
    },
    deleteCurrentPage: () =>
      set((state) => {
        if (state.project.pages.length <= 1) return {};
        const pages = state.project.pages.filter((page) => page.id !== state.currentPageId);
        const nextProject = persist({
          ...state.project,
          pages,
          interactions: state.project.interactions.filter((interaction) => pages.some((page) => page.nodes[interaction.trigger.componentId.split(':')[0] ?? interaction.trigger.componentId])),
          updatedAt: new Date().toISOString(),
        });
        const nextPage = pages[0]!;
        return { project: nextProject, currentPageId: nextPage.id, currentFrameId: nextPage.frames?.[0]?.id, selectedNodeId: nextPage.rootNodeId, selectedNodeIds: [nextPage.rootNodeId] };
      }),
    deletePage: (pageId) =>
      set((state) => {
        if (state.project.pages.length <= 1) return {};
        const pages = state.project.pages.filter((page) => page.id !== pageId);
        if (pages.length === state.project.pages.length) return {};
        const nextProject = persist({
          ...state.project,
          pages,
          interactions: state.project.interactions.filter((interaction) => pages.some((page) => page.nodes[interaction.trigger.componentId.split(':')[0] ?? interaction.trigger.componentId])),
          updatedAt: new Date().toISOString(),
        });
        const nextPage = state.currentPageId === pageId ? pages[0]! : (pages.find((page) => page.id === state.currentPageId) ?? pages[0]!);
        return { project: nextProject, currentPageId: nextPage.id, currentFrameId: nextPage.frames?.[0]?.id, selectedNodeId: nextPage.rootNodeId, selectedNodeIds: [nextPage.rootNodeId] };
      }),
    setMode: (mode) => set({ mode }),
    addPage: () => {
      const id = `page_custom_${Date.now().toString(36)}`;
      const rootId = `node_${id}_root`;
      get().apply({
        type: 'addPage',
        page: {
          id,
          name: '新建页面',
          route: `/${id}`,
          purpose: '新建后台页面',
          rootNodeId: rootId,
          nodes: {
            [rootId]: {
              id: rootId,
              type: 'PageContainer',
              name: '新建页面容器',
              props: { title: '新建页面', description: '页面说明' },
              children: [],
            },
          },
        },
      });
      set({ currentPageId: id, currentFrameId: undefined, selectedNodeId: rootId, selectedNodeIds: [rootId] });
    },
    addComponent: (type) => {
      const state = get();
      const page = getPage(state.project, state.currentPageId);
      if (!page) return;
      const selected = state.selectedNodeId ? page.nodes[state.selectedNodeId] : undefined;
      const parent = selected?.children ? selected : selected ? findParentNode(page, selected.id) : page.nodes[page.rootNodeId];
      if (!parent) return;
      const node = createNode(type);
      const frameId = state.currentFrameId ?? page.frames?.[0]?.id;
      if (frameId) {
        node.canvas = {
          x: node.canvas?.x ?? node.layout?.x ?? 0,
          y: node.canvas?.y ?? node.layout?.y ?? 0,
          width: node.canvas?.width ?? node.layout?.width ?? 180,
          height: node.canvas?.height ?? node.layout?.height ?? 80,
          zIndex: getNextFrameZIndex(page, frameId),
          ...(node.canvas?.locked !== undefined ? { locked: node.canvas.locked } : {}),
          ...(node.canvas?.hidden !== undefined ? { hidden: node.canvas.hidden } : {}),
          ...(node.canvas?.rotation !== undefined ? { rotation: node.canvas.rotation } : {}),
          parentFrameId: frameId,
        };
      }
      state.apply({ type: 'addNode', pageId: page.id, parentNodeId: parent.id, node });
      set({ selectedNodeId: node.id, selectedNodeIds: [node.id] });
    },
    addComponentToParent: (type, parentNodeId, canvas) => {
      const state = get();
      const page = getPage(state.project, state.currentPageId);
      const parent = page?.nodes[parentNodeId];
      if (!page || !parent?.children) return;
      const node = createNode(type);
      if (canvas) {
        node.canvas = {
          x: canvas.x ?? 0,
          y: canvas.y ?? 0,
          width: canvas.width ?? node.layout?.width ?? 180,
          height: canvas.height ?? node.layout?.height ?? 80,
          zIndex: canvas.zIndex ?? (canvas.parentFrameId ? getNextFrameZIndex(page, canvas.parentFrameId) : 0),
          ...(canvas.locked !== undefined ? { locked: canvas.locked } : {}),
          ...(canvas.hidden !== undefined ? { hidden: canvas.hidden } : {}),
          ...(canvas.rotation !== undefined ? { rotation: canvas.rotation } : {}),
          ...(canvas.parentFrameId !== undefined ? { parentFrameId: canvas.parentFrameId } : {}),
        };
      }
      state.apply({ type: 'addNode', pageId: page.id, parentNodeId: parent.id, node });
      set({ selectedNodeId: node.id, selectedNodeIds: [node.id] });
    },
    updateSelectedProps: (props) => {
      const state = get();
      if (!state.selectedNodeId) return;
      state.apply({ type: 'updateNodeProps', pageId: state.currentPageId, nodeId: state.selectedNodeId, props });
    },
    updateSelectedContent: (content) => {
      const state = get();
      if (!state.selectedNodeId) return;
      state.apply({ type: 'updateNodeContent', pageId: state.currentPageId, nodeId: state.selectedNodeId, content });
    },
    updateSelectedData: (data) => {
      const state = get();
      if (!state.selectedNodeId) return;
      state.apply({ type: 'updateNodeData', pageId: state.currentPageId, nodeId: state.selectedNodeId, data });
    },
    updateSelectedEvents: (events) => {
      const state = get();
      if (!state.selectedNodeId) return;
      state.apply({ type: 'updateNodeEvents', pageId: state.currentPageId, nodeId: state.selectedNodeId, events });
    },
    renameSelectedNode: (name) => {
      const state = get();
      if (!state.selectedNodeId || state.selectedNodeId.includes(':')) return;
      state.apply({ type: 'updateNodeName', pageId: state.currentPageId, nodeId: state.selectedNodeId, name });
    },
    deleteSelectedNode: () => {
      const state = get();
      const page = getPage(state.project, state.currentPageId);
      if (!page || !state.selectedNodeId || state.selectedNodeId === page.rootNodeId) return;
      const parent = findParentNode(page, state.selectedNodeId);
      state.apply({ type: 'deleteNode', pageId: page.id, nodeId: state.selectedNodeId });
      const nextSelectedNodeId = parent?.id ?? page.rootNodeId;
      set({ selectedNodeId: nextSelectedNodeId, selectedNodeIds: [nextSelectedNodeId] });
    },
    copySelectedNodes: () => {
      const state = get();
      const page = getPage(state.project, state.currentPageId);
      const nodeIds = state.selectedNodeIds.filter((nodeId) => page?.nodes[nodeId] && nodeId !== page.rootNodeId);
      set({ clipboardNodeIds: nodeIds });
    },
    pasteClipboard: () =>
      set((state) => {
        const page = getPage(state.project, state.currentPageId);
        const parent = page?.nodes[page.rootNodeId];
        if (!page || !parent?.children || state.clipboardNodeIds.length === 0) return {};
        const before = new Set(Object.keys(page.nodes));
        const targetFrameId = state.currentFrameId ?? page.frames?.[0]?.id;
        const nextProject = persist(
          applyOperation(state.project, {
            type: 'cloneNodes',
            pageId: page.id,
            parentNodeId: parent.id,
            nodeIds: state.clipboardNodeIds,
            offset: { x: 24, y: 24 },
            placeAtHighestLayer: true,
            ...(targetFrameId ? { targetFrameId } : {}),
          }),
        );
        const nextPage = getPage(nextProject, page.id);
        const newIds = nextPage ? Object.keys(nextPage.nodes).filter((nodeId) => !before.has(nodeId)) : [];
        const selectedNodeId = newIds[0] ?? state.selectedNodeId;
        return {
          project: nextProject,
          dirty: true,
          pastProjects: [...state.pastProjects, state.project].slice(-50),
          futureProjects: [],
          selectedNodeId,
          selectedNodeIds: selectedNodeId ? [selectedNodeId] : [],
        };
      }),
    undo: () =>
      set((state) => {
        const previous = state.pastProjects.at(-1);
        if (!previous) return {};
        const page = previous.pages.find((item) => item.id === state.currentPageId) ?? previous.pages[0];
        const selectedNodeId = state.selectedNodeId && page?.nodes[state.selectedNodeId] ? state.selectedNodeId : page?.rootNodeId;
        persistLater(previous);
        return {
          project: previous,
          currentPageId: page?.id ?? state.currentPageId,
          currentFrameId: page?.frames?.[0]?.id,
          selectedNodeId,
          selectedNodeIds: selectedNodeId ? [selectedNodeId] : [],
          pastProjects: state.pastProjects.slice(0, -1),
          futureProjects: [state.project, ...state.futureProjects].slice(0, 50),
          dirty: true,
        };
      }),
    redo: () =>
      set((state) => {
        const next = state.futureProjects[0];
        if (!next) return {};
        const page = next.pages.find((item) => item.id === state.currentPageId) ?? next.pages[0];
        const selectedNodeId = state.selectedNodeId && page?.nodes[state.selectedNodeId] ? state.selectedNodeId : page?.rootNodeId;
        persistLater(next);
        return {
          project: next,
          currentPageId: page?.id ?? state.currentPageId,
          currentFrameId: page?.frames?.[0]?.id,
          selectedNodeId,
          selectedNodeIds: selectedNodeId ? [selectedNodeId] : [],
          pastProjects: [...state.pastProjects, state.project].slice(-50),
          futureProjects: state.futureProjects.slice(1),
          dirty: true,
        };
      }),
    alignSelectedNodes: (alignment) => {
      const state = get();
      const page = getPage(state.project, state.currentPageId);
      const nodeIds = state.selectedNodeIds.filter((nodeId) => page?.nodes[nodeId] && nodeId !== page.rootNodeId);
      if (nodeIds.length < 2) return;
      state.apply({ type: 'alignNodes', pageId: state.currentPageId, nodeIds, alignment });
    },
    distributeSelectedNodes: (direction) => {
      const state = get();
      const page = getPage(state.project, state.currentPageId);
      const nodeIds = state.selectedNodeIds.filter((nodeId) => page?.nodes[nodeId] && nodeId !== page.rootNodeId);
      if (nodeIds.length < 3) return;
      state.apply({ type: 'distributeNodes', pageId: state.currentPageId, nodeIds, direction });
    },
    bringSelectedToFront: () => {
      const state = get();
      const page = getPage(state.project, state.currentPageId);
      if (!page || !state.selectedNodeId || state.selectedNodeId === page.rootNodeId) return;
      const frameId = page.nodes[state.selectedNodeId]?.canvas?.parentFrameId ?? state.currentFrameId ?? page.frames?.[0]?.id;
      if (!frameId) return;
      commitOperations(bringNodeToFrontByZIndex(page, state.selectedNodeId, frameId).map((patch) => ({ type: 'updateNodeCanvas', pageId: page.id, nodeId: patch.nodeId, canvas: { zIndex: patch.zIndex, parentFrameId: frameId } })));
    },
    sendSelectedToBack: () => {
      const state = get();
      const page = getPage(state.project, state.currentPageId);
      if (!page || !state.selectedNodeId || state.selectedNodeId === page.rootNodeId) return;
      const frameId = page.nodes[state.selectedNodeId]?.canvas?.parentFrameId ?? state.currentFrameId ?? page.frames?.[0]?.id;
      if (!frameId) return;
      commitOperations(sendNodeToBackByZIndex(page, state.selectedNodeId, frameId).map((patch) => ({ type: 'updateNodeCanvas', pageId: page.id, nodeId: patch.nodeId, canvas: { zIndex: patch.zIndex, parentFrameId: frameId } })));
    },
    moveSelectedForward: () => {
      const state = get();
      const page = getPage(state.project, state.currentPageId);
      if (!page || !state.selectedNodeId || state.selectedNodeId === page.rootNodeId) return;
      const frameId = page.nodes[state.selectedNodeId]?.canvas?.parentFrameId ?? state.currentFrameId ?? page.frames?.[0]?.id;
      if (!frameId) return;
      commitOperations(moveNodeForwardByZIndex(page, state.selectedNodeId, frameId).map((patch) => ({ type: 'updateNodeCanvas', pageId: page.id, nodeId: patch.nodeId, canvas: { zIndex: patch.zIndex, parentFrameId: frameId } })));
    },
    moveSelectedBackward: () => {
      const state = get();
      const page = getPage(state.project, state.currentPageId);
      if (!page || !state.selectedNodeId || state.selectedNodeId === page.rootNodeId) return;
      const frameId = page.nodes[state.selectedNodeId]?.canvas?.parentFrameId ?? state.currentFrameId ?? page.frames?.[0]?.id;
      if (!frameId) return;
      commitOperations(moveNodeBackwardByZIndex(page, state.selectedNodeId, frameId).map((patch) => ({ type: 'updateNodeCanvas', pageId: page.id, nodeId: patch.nodeId, canvas: { zIndex: patch.zIndex, parentFrameId: frameId } })));
    },
    reorderLayerStack: (orderedNodeIds, frameId) => {
      const state = get();
      const page = getPage(state.project, state.currentPageId);
      const targetFrameId = frameId ?? state.currentFrameId ?? page?.frames?.[0]?.id;
      if (!page || !targetFrameId) return;
      state.apply({ type: 'updateNodeLayerOrder', pageId: page.id, frameId: targetFrameId, orderedNodeIds });
    },
    groupSelectedNodes: () => {
      const state = get();
      const page = getPage(state.project, state.currentPageId);
      const parent = page?.nodes[page.rootNodeId];
      const nodeIds = state.selectedNodeIds.filter((nodeId) => page?.nodes[nodeId]?.canvas && nodeId !== page.rootNodeId);
      if (!page || !parent?.children || nodeIds.length < 2) return;
      const canvases = nodeIds.map((nodeId) => page.nodes[nodeId]!.canvas!);
      const parentFrameId = state.currentFrameId ?? canvases.find((canvas) => canvas.parentFrameId)?.parentFrameId;
      const left = Math.min(...canvases.map((canvas) => canvas.x));
      const top = Math.min(...canvases.map((canvas) => canvas.y));
      const right = Math.max(...canvases.map((canvas) => canvas.x + canvas.width));
      const bottom = Math.max(...canvases.map((canvas) => canvas.y + canvas.height));
      const groupId = createId('group');
      const zIndex = parentFrameId ? getNextFrameZIndex(page, parentFrameId) : Math.max(...canvases.map((canvas) => canvas.zIndex)) + 1;
      state.apply({
        type: 'groupNodes',
        pageId: page.id,
        parentNodeId: parent.id,
        childNodeIds: nodeIds,
        groupNode: {
          id: groupId,
          type: 'Section',
          name: 'Group',
          props: { title: 'Group' },
          canvas: {
            x: left,
            y: top,
            width: right - left,
            height: bottom - top,
            zIndex,
            ...(parentFrameId ? { parentFrameId } : {}),
          },
          semantic: { moduleName: 'Group', moduleType: 'module' },
          children: nodeIds,
        },
      });
      set({ selectedNodeId: groupId, selectedNodeIds: [groupId] });
    },
    ungroupSelectedNode: () => {
      const state = get();
      const page = getPage(state.project, state.currentPageId);
      const node = state.selectedNodeId ? page?.nodes[state.selectedNodeId] : undefined;
      if (!page || !node?.children?.length) return;
      state.apply({ type: 'ungroupNode', pageId: page.id, groupNodeId: node.id });
      set({ selectedNodeId: node.children[0], selectedNodeIds: [...node.children] });
    },
    moveSelectedNode: (direction) => {
      const state = get();
      const page = getPage(state.project, state.currentPageId);
      if (!page || !state.selectedNodeId) return;
      const parent = findParentNode(page, state.selectedNodeId);
      if (!parent) return;
      state.apply({ type: 'moveNode', pageId: page.id, parentNodeId: parent.id, nodeId: state.selectedNodeId, direction });
    },
    reorderNode: (nodeId, targetNodeId, position) => {
      const state = get();
      const page = getPage(state.project, state.currentPageId);
      if (!page) return;
      const parent = findParentNode(page, nodeId);
      const targetParent = findParentNode(page, targetNodeId);
      if (!parent || !targetParent || parent.id !== targetParent.id) return;
      state.apply({
        type: 'reorderNode',
        pageId: page.id,
        parentNodeId: parent.id,
        nodeId,
        targetNodeId,
        ...(position ? { position } : {}),
      });
    },
    reorderNodeToIndex: (nodeId, parentNodeId, targetIndex) => {
      const state = get();
      const page = getPage(state.project, state.currentPageId);
      const parent = page?.nodes[parentNodeId];
      if (!page || !parent?.children?.includes(nodeId)) return;
      state.apply({ type: 'reorderNodeToIndex', pageId: page.id, parentNodeId, nodeId, targetIndex });
    },
    moveNodeToParent: (nodeId, newParentNodeId) => {
      const state = get();
      const page = getPage(state.project, state.currentPageId);
      const nextParent = page?.nodes[newParentNodeId];
      if (!page || !nextParent?.children) return;
      state.apply({ type: 'moveNodeToParent', pageId: page.id, nodeId, newParentNodeId });
    },
    reset: () => {
      saveProject(initialProject);
      set({
        project: initialProject,
        currentPageId: initialProject.pages[0]!.id,
        currentFrameId: initialProject.pages[0]!.frames?.[0]?.id,
        selectedNodeId: initialProject.pages[0]!.rootNodeId,
        selectedNodeIds: [initialProject.pages[0]!.rootNodeId],
        clipboardNodeIds: [],
        pastProjects: [],
        futureProjects: [],
        mode: 'edit',
        dirty: false,
      });
    },
    replaceProject: (project, currentPageId, selectedNodeId) => {
      saveProject(project);
      const page = project.pages.find((item) => item.id === currentPageId) ?? project.pages[0];
      const nextSelectedNodeId = selectedNodeId && page?.nodes[selectedNodeId] ? selectedNodeId : page?.rootNodeId;
      set({
        project,
        currentPageId: page?.id ?? initialProject.pages[0]!.id,
        currentFrameId: page?.frames?.[0]?.id,
        selectedNodeId: nextSelectedNodeId,
        selectedNodeIds: nextSelectedNodeId ? [nextSelectedNodeId] : [],
        pastProjects: [],
        futureProjects: [],
        mode: 'edit',
        dirty: false,
      });
    },
    commitProject: (project, currentPageId, selectedNodeId) => {
      set((state) => {
        persistLater(project);
        const page = project.pages.find((item) => item.id === currentPageId) ?? project.pages[0];
        const nextSelectedNodeId = selectedNodeId && page?.nodes[selectedNodeId] ? selectedNodeId : page?.rootNodeId;
        return {
          project,
          currentPageId: page?.id ?? state.currentPageId,
          currentFrameId: page?.frames?.[0]?.id,
          selectedNodeId: nextSelectedNodeId,
          selectedNodeIds: nextSelectedNodeId ? [nextSelectedNodeId] : [],
          pastProjects: [...state.pastProjects, state.project].slice(-50),
          futureProjects: [],
          dirty: true,
        };
      });
    },
    createProject: (options) => {
      const project = createProjectFromTemplate(options);
      saveProjectRecordById(project, options.templateSourceId);
      set({
        project,
        currentPageId: project.pages[0]?.id ?? initialProject.pages[0]!.id,
        currentFrameId: project.pages[0]?.frames?.[0]?.id,
        selectedNodeId: project.pages[0]?.rootNodeId,
        selectedNodeIds: project.pages[0]?.rootNodeId ? [project.pages[0].rootNodeId] : [],
        pastProjects: [],
        futureProjects: [],
        mode: 'edit',
        dirty: false,
      });
    },
    openProject: (projectId) => {
      const project = openProjectRecord(projectId);
      if (!project) return;
      set({
        project,
        currentPageId: project.pages[0]?.id ?? initialProject.pages[0]!.id,
        currentFrameId: project.pages[0]?.frames?.[0]?.id,
        selectedNodeId: project.pages[0]?.rootNodeId,
        selectedNodeIds: project.pages[0]?.rootNodeId ? [project.pages[0].rootNodeId] : [],
        pastProjects: [],
        futureProjects: [],
        mode: 'edit',
        dirty: false,
      });
    },
    saveCurrentProject: () => {
      saveProjectRecordById(get().project);
      set({ dirty: false });
    },
    renameProjectRecord: (projectId, name) => {
      const project = renameProjectRecordById(projectId, name);
      if (project && project.id === get().project.id) set({ project });
    },
    deleteProjectRecord: (projectId) => {
      deleteProjectRecordById(projectId);
      if (projectId === get().project.id) get().reset();
    },
  };
});
