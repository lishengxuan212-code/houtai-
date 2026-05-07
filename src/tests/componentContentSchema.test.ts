import { describe, expect, it } from 'vitest';
import { getComponentDefinition } from '../registry/componentDefinitionRegistry';

describe('component content/data/slot schema', () => {
  it('separates Dropdown menu content from ordinary props', () => {
    const dropdown = getComponentDefinition('Dropdown');

    expect(dropdown?.propSchema.some((group) => group.fields.some((field) => field.path === 'props.text'))).toBe(true);
    expect(dropdown?.contentSchema?.some((group) => group.fields.some((field) => field.editor === 'menuItems' && field.path === 'content.menuItems'))).toBe(true);
  });

  it('defines table-family row data as dataSchema', () => {
    expect(getComponentDefinition('Table')?.dataSchema?.some((group) => group.fields.some((field) => field.editor === 'tableRows'))).toBe(true);
    expect(getComponentDefinition('pro.ProTable')?.dataSchema?.some((group) => group.fields.some((field) => field.editor === 'tableRows'))).toBe(true);
    expect(getComponentDefinition('pro.EditableProTable')?.dataSchema?.some((group) => group.fields.some((field) => field.editor === 'tableRows'))).toBe(true);
  });

  it('defines PageContainer regions as slot schema', () => {
    const pageContainer = getComponentDefinition('PageContainer');

    expect(pageContainer?.slotSchema?.some((group) => group.fields.some((field) => field.path === 'props.regions.showToolbar'))).toBe(true);
  });

  it('uses visual collection editors for options and structured navigation content', () => {
    expect(getComponentDefinition('Select')?.contentSchema?.some((group) => group.fields.some((field) => field.path === 'content.options' && field.editor === 'options'))).toBe(true);
    expect(getComponentDefinition('Radio')?.contentSchema?.some((group) => group.fields.some((field) => field.path === 'content.options' && field.editor === 'options'))).toBe(true);
    expect(getComponentDefinition('Checkbox')?.contentSchema?.some((group) => group.fields.some((field) => field.path === 'content.options' && field.editor === 'options'))).toBe(true);
    expect(getComponentDefinition('Menu')?.contentSchema?.some((group) => group.fields.some((field) => field.path === 'content.items' && field.editor === 'menuItems'))).toBe(true);
    expect(getComponentDefinition('Tabs')?.contentSchema?.some((group) => group.fields.some((field) => field.path === 'content.items' && field.editor === 'tabsItems'))).toBe(true);
    expect(getComponentDefinition('Steps')?.contentSchema?.some((group) => group.fields.some((field) => field.path === 'content.items' && field.editor === 'stepsItems'))).toBe(true);
    expect(getComponentDefinition('Collapse')?.contentSchema?.some((group) => group.fields.some((field) => field.path === 'content.panels' && field.editor === 'treeData'))).toBe(true);
  });

  it('moves modal and drawer body/footer content into content schema', () => {
    expect(getComponentDefinition('Modal')?.contentSchema?.some((group) => group.fields.some((field) => field.path === 'content.body'))).toBe(true);
    expect(getComponentDefinition('Modal')?.contentSchema?.some((group) => group.fields.some((field) => field.path === 'content.footerButtons' && field.editor === 'options'))).toBe(true);
    expect(getComponentDefinition('Drawer')?.contentSchema?.some((group) => group.fields.some((field) => field.path === 'content.body'))).toBe(true);
    expect(getComponentDefinition('Drawer')?.contentSchema?.some((group) => group.fields.some((field) => field.path === 'content.footerButtons' && field.editor === 'options'))).toBe(true);
  });
});
