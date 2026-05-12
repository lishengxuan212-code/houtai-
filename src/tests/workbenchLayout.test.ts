import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { ResizablePanels } from '../editor/workbench/ResizablePanels';
import { WorkbenchShell } from '../editor/workbench/WorkbenchShell';

describe('WorkbenchShell', () => {
  it('renders the Axure-like workbench regions and toolbar entries in Chinese', () => {
    const html = renderToStaticMarkup(createElement(WorkbenchShell));
    expect(html).toContain('新建项目');
    expect(html).toContain('保存');
    expect(html).toContain('预览');
    expect(html).toContain('导出 PRD');
    expect(html).toContain('页面');
    expect(html).toContain('概要');
    expect(html).toContain('组件库');
    expect(html).toContain('母版');
    expect(html).toContain('模板');
    expect(html).toContain('属性');
    expect(html).toContain('交互');
    expect(html).toContain('数据');
    expect(html).toContain('AI 生成');
    expect(html).toContain('导出');
  });

  it('uses 80 percent chrome panel proportions while leaving the center fluid', () => {
    const html = renderToStaticMarkup(
      createElement(ResizablePanels, {
        left: createElement('div', null, 'left'),
        center: createElement('div', null, 'center'),
        right: createElement('div', null, 'right'),
      }),
    );

    expect(html).toContain('grid-template-columns:272px 5px minmax(0, 1fr) 5px 304px');
  });
});
