import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentNode, Project } from '../domain/types';
import { GeneratedInspector } from '../editor/inspector/GeneratedInspector';
import { exportMarkdownPrd } from '../export/markdownPrd';
import { getComponentDefinition } from '../registry/componentDefinitionRegistry';
import { RuntimeProvider } from '../runtime/RuntimeProvider';
import { RuntimeRenderer } from '../runtime/RuntimeRenderer';

describe('FloatButton editor, preview, and PRD sync', () => {
  it('edits FloatButton content without opening JSON', () => {
    const node: ComponentNode = {
      id: 'float_button_1',
      type: 'FloatButton',
      name: '悬浮帮助',
      props: { shape: 'square', type: 'default', content: '' },
    };
    const updateProps = vi.fn();

    render(<GeneratedInspector node={node} definition={getComponentDefinition('FloatButton')!} updateProps={updateProps} />);

    fireEvent.change(screen.getByLabelText('按钮内容'), { target: { value: '帮助' } });
    expect(updateProps).toHaveBeenCalledWith(expect.objectContaining({ content: '帮助' }));
    expect(screen.queryByText('高级 / 调试')).toBeInTheDocument();
  });

  it('renders edited FloatButton props and dispatches click interactions', async () => {
    const project: Project = {
      id: 'float_project',
      name: 'FloatButton 项目',
      version: 1,
      createdAt: '2026-05-07T00:00:00.000+08:00',
      updatedAt: '2026-05-07T00:00:00.000+08:00',
      variables: [],
      dataSources: [],
      interactions: [
        {
          id: 'float_click_message',
          name: '点击帮助显示提示',
          trigger: { componentId: 'float_help', event: 'click' },
          actions: [{ type: 'showMessage', level: 'info', message: '已点击帮助按钮' }],
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
            root: { id: 'root', type: 'PageContainer', name: '页面容器', props: { title: '首页' }, children: ['float_help'] },
            float_help: {
              id: 'float_help',
              type: 'FloatButton',
              name: '悬浮帮助',
              props: { shape: 'square', type: 'primary', content: '帮助', tooltip: '打开帮助中心', badge: { enabled: true, count: 3, dot: false } },
            },
          },
        },
      ],
    };

    render(
      <RuntimeProvider project={project} initialPageId="page_main">
        <RuntimeRenderer project={project} />
      </RuntimeProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: '帮助' }));
    expect(await screen.findByText('已点击帮助按钮')).toBeInTheDocument();
    expect(exportMarkdownPrd(project)).toContain('帮助');
    expect(exportMarkdownPrd(project)).toContain('打开帮助中心');
  });
});
