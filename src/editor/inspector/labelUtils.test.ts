import { describe, expect, it } from 'vitest';
import { propLabel } from './labelUtils';

describe('inspector label utils', () => {
  it('renders common property keys as Chinese labels', () => {
    expect(propLabel('dataSourceId')).toBe('数据源');
    expect(propLabel('columns')).toBe('表格列');
    expect(propLabel('fields')).toBe('字段');
    expect(propLabel('submitText')).toBe('提交按钮文案');
    expect(propLabel('placeholder')).toBe('占位文案');
  });
});
