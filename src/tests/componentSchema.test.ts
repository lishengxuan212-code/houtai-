import { describe, expect, it } from 'vitest';
import { getComponentDefinition, getResolvedDefaultProps, listComponentDefinitions } from '../registry/componentDefinitionRegistry';
import { setValueAtPropPath } from '../domain/operations/componentPropertyOperations';

describe('component schema layer', () => {
  it('reads immutable system definitions separately from user default overrides', () => {
    const button = getComponentDefinition('Button');

    expect(button?.nameEn).toBe('Button');
    expect(button?.source).toBe('antd');
    expect(button?.propSchema.some((group) => group.fields.some((field) => field.path === 'props.text'))).toBe(true);

    const resolved = getResolvedDefaultProps('Button', { Button: { text: 'Confirm' } });

    expect(resolved.text).toBe('Confirm');
    expect(button?.defaultProps.text).not.toBe('Confirm');
  });

  it('lists ProComponents as enabled heavy component definitions', () => {
    const types = listComponentDefinitions().map((definition) => definition.type);

    expect(types).toContain('pro.ProTable');
    expect(types).toContain('pro.ProForm');
    expect(types).toContain('pro.ProLayout');
  });

  it('sets nested node props by serializable prop paths', () => {
    const props = setValueAtPropPath(
      { columns: [{ key: 'name', title: 'Name' }] },
      'props.columns.0.title',
      'Customer Name',
    );

    expect(props).toEqual({ columns: [{ key: 'name', title: 'Customer Name' }] });
  });

  it('uses structured editors for editable text, options, table columns, and table rows', () => {
    const table = getComponentDefinition('Table');
    const select = getComponentDefinition('Select');
    const listBox = getComponentDefinition('ListBox');

    expect(table?.propSchema.flatMap((group) => group.fields.map((field) => field.editor))).toContain('tableColumns');
    expect(table?.dataSchema?.flatMap((group) => group.fields.map((field) => field.editor))).toContain('tableRows');
    expect(select?.contentSchema?.flatMap((group) => group.fields.map((field) => field.editor))).toContain('options');
    expect(listBox?.contentSchema?.flatMap((group) => group.fields.map((field) => field.editor))).toContain('options');
  });
});
