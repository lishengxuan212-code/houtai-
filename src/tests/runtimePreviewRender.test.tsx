import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Project } from '../domain/types';
import { createRuntimeState } from '../runtime/runtimeState';
import { RuntimeProvider } from '../runtime/RuntimeProvider';
import { RuntimeRenderer } from '../runtime/RuntimeRenderer';
import { runInteraction } from '../interactions/runner';

const project: Project = {
  id: 'project_preview_test',
  name: '预览交互测试',
  businessType: 'blank',
  version: 1,
  createdAt: '2026-05-07T00:00:00.000+08:00',
  updatedAt: '2026-05-07T00:00:00.000+08:00',
  variables: [],
  dataSources: [],
  interactions: [
    {
      id: 'interaction_click_message',
      name: '点击显示提示',
      trigger: { componentId: 'button_show_message', event: 'click' },
      actions: [{ type: 'showMessage', level: 'success', message: '保存成功' }],
      enabled: true,
    },
  ],
  pages: [
    {
      id: 'page_main',
      name: '首页',
      route: '/',
      rootNodeId: 'root',
      nodes: {
        root: {
          id: 'root',
          type: 'PageContainer',
          name: '页面容器',
          props: { title: '首页' },
          children: ['button_show_message'],
        },
        button_show_message: {
          id: 'button_show_message',
          type: 'Button',
          name: '保存按钮',
          props: { text: '保存', variant: 'primary' },
        },
      },
    },
  ],
};

describe('runtime preview rendering', () => {
  it('dispatches rendered button interactions', async () => {
    render(
      <RuntimeProvider project={project} initialPageId="page_main">
        <RuntimeRenderer project={project} />
      </RuntimeProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /保\s*存/ }));
    expect(await screen.findByText('保存成功')).toBeInTheDocument();
  });

  it('applies runtime prop changes through preview dispatch', async () => {
    const propProject: Project = {
      ...project,
      interactions: [
        {
          id: 'interaction_set_button_text',
          name: 'Set button text',
          trigger: { componentId: 'button_show_message', event: 'click' },
          actions: [{ type: 'setNodeProp', targetNodeId: 'button_show_message', propKey: 'text', value: { kind: 'literal', value: 'Saved' } }],
          enabled: true,
        },
      ],
      pages: [
        {
          ...project.pages[0]!,
          nodes: {
            ...project.pages[0]!.nodes,
            button_show_message: {
              ...project.pages[0]!.nodes.button_show_message!,
              props: { text: 'Save', variant: 'primary' },
            },
          },
        },
      ],
    };

    render(
      <RuntimeProvider project={propProject} initialPageId="page_main">
        <RuntimeRenderer project={propProject} />
      </RuntimeProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('button', { name: 'Saved' })).toBeInTheDocument();
  });

  it('closes open modal nodes by default when no close interaction is configured', () => {
    const state = { ...createRuntimeState(project, 'page_main'), openNodes: ['modal_1'] };
    const modalProject: Project = {
      ...project,
      pages: [
        {
          ...project.pages[0]!,
          nodes: {
            ...project.pages[0]!.nodes,
            modal_1: { id: 'modal_1', type: 'Modal', name: '弹窗', props: { title: '弹窗' }, children: [] },
          },
        },
      ],
    };
    expect(runInteraction(modalProject, state, { componentId: 'modal_1', event: 'click' }).openNodes).toEqual([]);
  });

  it('renders only visible nodes assigned to the active page frame', () => {
    const framedProject: Project = {
      ...project,
      pages: [
        {
          id: 'page_main',
          name: 'Canvas page',
          route: '/',
          rootNodeId: 'root',
          frames: [
            { id: 'frame_a', name: 'List page', x: 100, y: 80, width: 960, height: 640, zIndex: 1 },
            { id: 'frame_b', name: 'Detail page', x: 1200, y: 80, width: 960, height: 640, zIndex: 2 },
          ],
          nodes: {
            root: {
              id: 'root',
              type: 'PageContainer',
              name: 'Legacy root',
              props: { title: 'Legacy root' },
              children: ['frame_a_title', 'frame_b_title', 'hidden_title', 'draft_note'],
            },
            frame_a_title: {
              id: 'frame_a_title',
              type: 'H1',
              name: 'Frame A title',
              props: { content: 'Frame A content' },
              canvas: { x: 24, y: 32, width: 320, height: 48, zIndex: 3, parentFrameId: 'frame_a' },
            },
            frame_b_title: {
              id: 'frame_b_title',
              type: 'H1',
              name: 'Frame B title',
              props: { content: 'Frame B content' },
              canvas: { x: 24, y: 32, width: 320, height: 48, zIndex: 3, parentFrameId: 'frame_b' },
            },
            hidden_title: {
              id: 'hidden_title',
              type: 'H1',
              name: 'Hidden title',
              props: { content: 'Hidden content' },
              runtime: { initialVisible: false },
              canvas: { x: 24, y: 96, width: 320, height: 48, zIndex: 4, parentFrameId: 'frame_a' },
            },
            draft_note: {
              id: 'draft_note',
              type: 'StickyNote',
              name: 'Draft note',
              props: { content: 'Draft outside frame' },
              canvas: { x: 400, y: 96, width: 240, height: 120, zIndex: 5 },
            },
          },
        },
      ],
    };

    render(
      <RuntimeProvider project={framedProject} initialPageId="page_main">
        <RuntimeRenderer project={framedProject} />
      </RuntimeProvider>,
    );

    expect(screen.getByText('Frame A content')).toBeInTheDocument();
    expect(screen.queryByText('Frame B content')).not.toBeInTheDocument();
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
    expect(screen.queryByText('Draft outside frame')).not.toBeInTheDocument();
  });

  it('renders the requested active frame and keeps nested frame children', () => {
    const framedProject: Project = {
      ...project,
      pages: [
        {
          id: 'page_main',
          name: 'Canvas page',
          route: '/',
          rootNodeId: 'root',
          frames: [
            { id: 'frame_a', name: 'List page', x: 100, y: 80, width: 960, height: 640, zIndex: 1 },
            { id: 'frame_b', name: 'Detail page', x: 1200, y: 80, width: 960, height: 640, zIndex: 2 },
          ],
          nodes: {
            root: {
              id: 'root',
              type: 'PageContainer',
              name: 'Legacy root',
              props: { title: 'Legacy root' },
              children: ['frame_a_title', 'detail_card'],
            },
            frame_a_title: {
              id: 'frame_a_title',
              type: 'H1',
              name: 'Frame A title',
              props: { content: 'Frame A content' },
              canvas: { x: 24, y: 32, width: 320, height: 48, zIndex: 3, parentFrameId: 'frame_a' },
            },
            detail_card: {
              id: 'detail_card',
              type: 'Card',
              name: 'Detail card',
              props: { title: 'Detail card' },
              children: ['detail_title'],
              canvas: { x: 32, y: 40, width: 360, height: 180, zIndex: 3, parentFrameId: 'frame_b' },
            },
            detail_title: {
              id: 'detail_title',
              type: 'H2',
              name: 'Detail title',
              props: { content: 'Nested detail content' },
            },
          },
        },
      ],
    };

    render(
      <RuntimeProvider project={framedProject} initialPageId="page_main">
        <RuntimeRenderer project={framedProject} activeFrameId="frame_b" />
      </RuntimeProvider>,
    );

    expect(screen.queryByText('Frame A content')).not.toBeInTheDocument();
    expect(screen.getByText('Detail card')).toBeInTheDocument();
    expect(screen.getByText('Nested detail content')).toBeInTheDocument();
  });

  it('uses canvas coordinates for absolute frame preview layout', () => {
    const framedProject: Project = {
      ...project,
      pages: [
        {
          id: 'page_main',
          name: 'Canvas page',
          route: '/',
          rootNodeId: 'root',
          frames: [{ id: 'frame_a', name: 'List page', x: 0, y: 0, width: 960, height: 640, zIndex: 1 }],
          nodes: {
            root: { id: 'root', type: 'PageContainer', name: 'Legacy root', props: { title: 'Legacy root' }, children: ['positioned_title'] },
            positioned_title: {
              id: 'positioned_title',
              type: 'H1',
              name: 'Positioned title',
              props: { content: 'Positioned content' },
              canvas: { x: 48, y: 72, width: 360, height: 52, zIndex: 7, parentFrameId: 'frame_a' },
            },
          },
        },
      ],
    };

    render(
      <RuntimeProvider project={framedProject} initialPageId="page_main">
        <RuntimeRenderer project={framedProject} />
      </RuntimeProvider>,
    );

    const wrapper = screen.getByTestId('runtime-canvas-node-positioned_title');
    expect(wrapper).toHaveStyle({
      position: 'absolute',
      left: '48px',
      top: '72px',
      width: '360px',
      height: '52px',
      zIndex: '7',
    });
    expect(document.querySelector('.node-frame')).not.toBeInTheDocument();
    expect(document.querySelector('.selection-box')).not.toBeInTheDocument();
    expect(document.querySelector('.resize-handle')).not.toBeInTheDocument();
  });

  it('lets shape widgets fill their canvas bounds in preview frames', () => {
    const shapeProject: Project = {
      ...project,
      pages: [
        {
          id: 'page_main',
          name: 'Shape page',
          route: '/',
          rootNodeId: 'root',
          frames: [{ id: 'frame_a', name: 'Frame', x: 0, y: 0, width: 640, height: 480, zIndex: 1 }],
          nodes: {
            root: { id: 'root', type: 'PageContainer', name: 'Root', props: {}, children: ['rect_1', 'circle_1'] },
            rect_1: {
              id: 'rect_1',
              type: 'Rectangle',
              name: 'Rectangle',
              props: { fill: '#dbeafe', radius: 10 },
              canvas: { x: 32, y: 48, width: 240, height: 120, zIndex: 1, parentFrameId: 'frame_a' },
            },
            circle_1: {
              id: 'circle_1',
              type: 'Circle',
              name: 'Circle',
              props: { fill: '#fee2e2' },
              canvas: { x: 300, y: 48, width: 120, height: 120, zIndex: 2, parentFrameId: 'frame_a' },
            },
          },
        },
      ],
    };

    render(
      <RuntimeProvider project={shapeProject} initialPageId="page_main">
        <RuntimeRenderer project={shapeProject} />
      </RuntimeProvider>,
    );

    expect(screen.getByTestId('runtime-canvas-node-rect_1')).toHaveStyle({ width: '240px', height: '120px', borderRadius: '10px', overflow: 'hidden' });
    expect(screen.getByTestId('runtime-node-fill-rect_1')).toHaveStyle({ width: '100%', height: '100%' });
    expect(screen.getByTestId('runtime-node-fill-circle_1')).toHaveStyle({ width: '100%', height: '100%' });
  });

  it('preserves structured root-node preview when a page has no frames while excluding runtime-hidden nodes', () => {
    const legacyProject: Project = {
      ...project,
      pages: [
        {
          id: 'page_main',
          name: 'Legacy page',
          route: '/',
          rootNodeId: 'root',
          nodes: {
            root: {
              id: 'root',
              type: 'PageContainer',
              name: 'Legacy root',
              props: { title: 'Legacy title' },
              children: ['visible_child', 'hidden_child'],
            },
            visible_child: {
              id: 'visible_child',
              type: 'H1',
              name: 'Visible child',
              props: { content: 'Visible structured child' },
            },
            hidden_child: {
              id: 'hidden_child',
              type: 'H1',
              name: 'Hidden child',
              props: { content: 'Hidden structured child' },
              runtime: { initialVisible: false },
              canvas: { x: 0, y: 0, width: 320, height: 48, zIndex: 1 },
            },
          },
        },
      ],
    };

    render(
      <RuntimeProvider project={legacyProject} initialPageId="page_main">
        <RuntimeRenderer project={legacyProject} />
      </RuntimeProvider>,
    );

    expect(screen.getByText('Legacy title')).toBeInTheDocument();
    expect(screen.getByText('Visible structured child')).toBeInTheDocument();
    expect(screen.queryByText('Hidden structured child')).not.toBeInTheDocument();
  });
});
