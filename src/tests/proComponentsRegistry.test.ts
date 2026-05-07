import { describe, expect, it } from 'vitest';
import { createNode } from '../registry/createNode';
import { getComponentDefinition, listComponentDefinitions } from '../registry/componentDefinitionRegistry';

describe('ProComponents registry', () => {
  it('registers S2 heavy components as draggable schema-driven definitions', () => {
    const types = listComponentDefinitions().filter((definition) => definition.source === 'pro-components').map((definition) => definition.type);

    expect(types).toEqual(expect.arrayContaining(['pro.ProLayout', 'pro.PageContainer', 'pro.ProTable', 'pro.EditableProTable', 'pro.ProForm', 'pro.ProCard', 'pro.ProDescriptions', 'pro.ProList']));
    expect(getComponentDefinition('pro.ProTable')?.propSchema.some((group) => group.fields.some((field) => field.editor === 'tableColumns'))).toBe(true);
    expect(getComponentDefinition('pro.ProForm')?.contentSchema?.some((group) => group.fields.some((field) => field.editor === 'formFields' && field.path === 'content.fields'))).toBe(true);
  });

  it('creates ProComponent nodes from separated defaults', () => {
    const node = createNode('pro.ProTable');

    expect(node.type).toBe('pro.ProTable');
    expect(typeof node.props.headerTitle).toBe('string');
    expect(node.props.columns).toEqual([expect.objectContaining({ key: 'name', valueType: 'text', search: true })]);
    expect(node.data).toEqual({ rows: [] });
  });
});
