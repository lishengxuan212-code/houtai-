import { describe, expect, it } from 'vitest';
import { exportPlainPrd } from '../export/plainPrd';
import { initialProject } from '../store/initialProject';

describe('plain PRD export', () => {
  it('exports business-readable pages, modules, fields, and interaction outcomes', () => {
    const markdown = exportPlainPrd(initialProject);
    expect(markdown).toContain('# 电商订单后台 PRD');
    expect(markdown).toContain('## 2. 页面清单');
    expect(markdown).toContain('模块一：订单搜索区');
    expect(markdown).toContain('订单金额');
    expect(markdown).toContain('点击');
    expect(markdown).toContain('提示');
  });

  it('does not expose technical vocabulary', () => {
    const markdown = exportPlainPrd(initialProject);
    const forbidden = ['JSON', 'DSL', 'schema', 'runtime', 'mock', 'operation', 'node', 'component tree', 'store', 'Zustand', 'Zod', 'renderer', 'Interaction Runner', 'DataSource'];
    for (const word of forbidden) {
      expect(markdown).not.toContain(word);
    }
    expect(markdown).not.toMatch(/runtime|mock|node/i);
  });
});
