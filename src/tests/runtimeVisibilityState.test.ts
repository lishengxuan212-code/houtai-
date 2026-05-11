import { describe, expect, it } from 'vitest';
import type { Project } from '../domain/types';
import { runInteraction } from '../interactions/runner';
import { createRuntimeState, resetRuntimeState, setRuntimeNodeVisible, toggleRuntimeNodeVisible } from '../runtime/runtimeState';

const project: Project = {
  id: 'project_runtime_visibility',
  name: 'Runtime visibility',
  businessType: 'blank',
  version: 1,
  createdAt: '2026-05-08T00:00:00.000+08:00',
  updatedAt: '2026-05-08T00:00:00.000+08:00',
  variables: [],
  dataSources: [],
  interactions: [
    {
      id: 'show_target',
      name: 'Show target',
      trigger: { componentId: 'show_button', event: 'click' },
      actions: [{ type: 'showNode', targetNodeId: 'target_panel' }],
      enabled: true,
    },
    {
      id: 'hide_target',
      name: 'Hide target',
      trigger: { componentId: 'hide_button', event: 'click' },
      actions: [{ type: 'hideNode', targetNodeId: 'target_panel' }],
      enabled: true,
    },
    {
      id: 'toggle_target',
      name: 'Toggle target',
      trigger: { componentId: 'toggle_button', event: 'click' },
      actions: [{ type: 'toggleNodeVisibility', targetNodeId: 'target_panel' }],
      enabled: true,
    },
  ],
  pages: [
    {
      id: 'page_main',
      name: 'Runtime page',
      route: '/',
      rootNodeId: 'root',
      frames: [{ id: 'frame_main', name: 'Main frame', x: 0, y: 0, width: 960, height: 640, zIndex: 1 }],
      nodes: {
        root: {
          id: 'root',
          type: 'PageContainer',
          name: 'Root',
          props: { title: 'Root' },
          children: ['show_button', 'hide_button', 'toggle_button', 'target_panel', 'editor_hidden_panel', 'disabled_button'],
        },
        show_button: {
          id: 'show_button',
          type: 'Button',
          name: 'Show',
          props: { text: 'Show' },
          canvas: { x: 0, y: 0, width: 120, height: 40, zIndex: 1, parentFrameId: 'frame_main' },
        },
        hide_button: {
          id: 'hide_button',
          type: 'Button',
          name: 'Hide',
          props: { text: 'Hide' },
          canvas: { x: 0, y: 48, width: 120, height: 40, zIndex: 2, parentFrameId: 'frame_main' },
        },
        toggle_button: {
          id: 'toggle_button',
          type: 'Button',
          name: 'Toggle',
          props: { text: 'Toggle' },
          canvas: { x: 0, y: 96, width: 120, height: 40, zIndex: 3, parentFrameId: 'frame_main' },
        },
        target_panel: {
          id: 'target_panel',
          type: 'Card',
          name: 'Target panel',
          props: { title: 'Target panel' },
          runtime: { initialVisible: false },
          canvas: { x: 160, y: 0, width: 240, height: 120, zIndex: 4, parentFrameId: 'frame_main' },
        },
        editor_hidden_panel: {
          id: 'editor_hidden_panel',
          type: 'Card',
          name: 'Editor hidden panel',
          props: { title: 'Editor hidden panel' },
          canvas: { x: 160, y: 140, width: 240, height: 120, zIndex: 5, hidden: true, parentFrameId: 'frame_main' },
        },
        disabled_button: {
          id: 'disabled_button',
          type: 'Button',
          name: 'Disabled',
          props: { text: 'Disabled' },
          runtime: { initialDisabled: true },
          canvas: { x: 0, y: 144, width: 120, height: 40, zIndex: 6, parentFrameId: 'frame_main' },
        },
      },
    },
  ],
};

describe('runtime visibility state', () => {
  it('initializes runtime visibility and disabled state separately from editor canvas hiding', () => {
    const state = createRuntimeState(project, 'page_main');

    expect(state.nodeVisibility.target_panel).toBe(false);
    expect(state.nodeVisibility.editor_hidden_panel).toBe(true);
    expect(state.nodeDisabled.disabled_button).toBe(true);
  });

  it('runtime helpers update visibility without mutating project fields', () => {
    const state = createRuntimeState(project, 'page_main');
    const shown = setRuntimeNodeVisible(state, 'target_panel', true);
    const toggled = toggleRuntimeNodeVisible(shown, 'target_panel');

    expect(shown.nodeVisibility.target_panel).toBe(true);
    expect(toggled.nodeVisibility.target_panel).toBe(false);
    expect(project.pages[0]?.nodes.target_panel?.runtime?.initialVisible).toBe(false);
    expect(project.pages[0]?.nodes.target_panel?.canvas?.hidden).toBeUndefined();
  });

  it('click show hide and toggle actions only affect runtime visibility', () => {
    const initial = createRuntimeState(project, 'page_main');

    const shown = runInteraction(project, initial, { componentId: 'show_button', event: 'click' });
    expect(shown.nodeVisibility.target_panel).toBe(true);

    const hidden = runInteraction(project, shown, { componentId: 'hide_button', event: 'click' });
    expect(hidden.nodeVisibility.target_panel).toBe(false);

    const toggledVisible = runInteraction(project, hidden, { componentId: 'toggle_button', event: 'click' });
    expect(toggledVisible.nodeVisibility.target_panel).toBe(true);

    const toggledHidden = runInteraction(project, toggledVisible, { componentId: 'toggle_button', event: 'click' });
    expect(toggledHidden.nodeVisibility.target_panel).toBe(false);
    expect(project.pages[0]?.nodes.target_panel?.runtime?.initialVisible).toBe(false);
  });

  it('preview reset restores initial visibility and disabled state', () => {
    const changed = setRuntimeNodeVisible(createRuntimeState(project, 'page_main'), 'target_panel', true);
    const reset = resetRuntimeState(project, changed);

    expect(reset.currentPageId).toBe('page_main');
    expect(reset.nodeVisibility.target_panel).toBe(false);
    expect(reset.nodeVisibility.editor_hidden_panel).toBe(true);
    expect(reset.nodeDisabled.disabled_button).toBe(true);
  });
});
