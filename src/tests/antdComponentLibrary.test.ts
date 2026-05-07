import { describe, expect, it } from 'vitest';
import { antdLibraryManifest, filterLibraryComponents, libraryCategories } from '../registry/antdManifest';
import { getAllDescriptors } from '../registry/componentRegistry';

describe('Ant Design component library manifest', () => {
  it('covers all required official categories and searchable Chinese/English names', () => {
    expect(libraryCategories).toEqual(['通用', '布局', '导航', '数据录入', '数据展示', '反馈', '其他', '重型组件']);
    expect(antdLibraryManifest.length).toBeGreaterThanOrEqual(70);
    expect(filterLibraryComponents(antdLibraryManifest, { query: '表格' }).map((item) => item.nameEn)).toContain('Table');
    expect(antdLibraryManifest.map((item) => item.nameEn)).toEqual(expect.arrayContaining(['Row', 'Col', 'BackTop', 'theme']));
    expect(filterLibraryComponents(antdLibraryManifest, { query: 'Table' }).map((item) => item.nameZh)).toContain('表格');
    expect(filterLibraryComponents(antdLibraryManifest, { category: '反馈' }).map((item) => item.nameEn)).toContain('Modal');
  });

  it('marks system/action/pro components without hiding them', () => {
    const message = antdLibraryManifest.find((item) => item.nameEn === 'Message');
    const proTable = antdLibraryManifest.find((item) => item.nameEn === 'ProTable');
    expect(message).toMatchObject({ renderKind: 'feedbackAction', draggable: false, enabled: true });
    expect(proTable).toMatchObject({ source: 'pro-components', renderKind: 'pro', draggable: true, enabled: true });
  });

  it('registers draggable enabled components as descriptors', () => {
    const descriptorTypes = new Set(getAllDescriptors().map((item) => item.type));
    const draggableTypes = antdLibraryManifest.filter((item) => item.draggable && item.enabled).map((item) => item.key);
    expect(draggableTypes.length).toBeGreaterThan(40);
    expect(draggableTypes.every((type) => descriptorTypes.has(type))).toBe(true);
  });
});
