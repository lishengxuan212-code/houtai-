import { describe, expect, it } from 'vitest';
import { getApiCoverageReport } from '../registry/apiSchemas/apiCoverage';

describe('API coverage report', () => {
  it('reports full coverage for FloatButton variants and partial coverage for large components', () => {
    const report = getApiCoverageReport();
    const byType = new Map(report.map((item) => [item.componentType, item]));

    expect(byType.get('FloatButton')?.coverage).toBe('full');
    expect(byType.get('FloatButton.Group')?.coverage).toBe('full');
    expect(byType.get('FloatButton.BackTop')?.coverage).toBe('full');
    expect(byType.get('Accordion')?.coverage).toBe('full');
    expect(byType.get('Table')?.coverage).toBe('partial');
    expect(byType.get('pro.ProTable')?.coverage).toBe('partial');
    expect(byType.get('Table')?.missingProps).toContain('rowSelection');
  });
});
