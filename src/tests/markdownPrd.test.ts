import { describe, expect, it } from 'vitest';
import { exportMarkdownPrd } from '../export/markdownPrd';
import { initialProject } from '../store/initialProject';

describe('markdown PRD export', () => {
  it('exports plain-language project overview, pages, interactions, and fields', () => {
    const markdown = exportMarkdownPrd(initialProject);
    expect(markdown).toContain('# 电商订单后台 PRD');
    expect(markdown).toContain('## 订单管理');
    expect(markdown).toContain('### 显示层');
    expect(markdown).toContain('### 交互层');
    expect(markdown).toContain('### 逻辑层');
    expect(markdown).toContain('订单金额');
    expect(markdown).toContain('显示“订单已创建”提示');
    expect(markdown).not.toContain('页面清单');
    expect(markdown).not.toContain('主要交互说明');
    expect(markdown).not.toContain('数据源清单');
  });
});
