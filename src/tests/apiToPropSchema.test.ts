import { describe, expect, it } from 'vitest';
import { floatButtonApiSchema } from '../registry/apiSchemas/floatButtonApiSchema';
import { apiSchemaToPropSchema, apiTypeEditorMapping } from '../registry/apiSchemas/apiSchemaToPropSchema';

describe('API schema to prop schema mapping', () => {
  it('maps official API value kinds to visual editors', () => {
    expect(apiTypeEditorMapping).toMatchObject({
      string: 'text',
      number: 'number',
      boolean: 'switch',
      enum: 'select',
      reactNode: 'reactNode',
      object: 'objectEditor',
      array: 'arrayEditor',
      function: 'interactionEvent',
      css: 'styleEditor',
      semanticClass: 'classNameEditor',
    });
  });

  it('derives grouped prop schemas from FloatButton API schema', () => {
    const result = apiSchemaToPropSchema(floatButtonApiSchema, 'FloatButton');

    expect(result.propSchema.map((group) => group.title)).toEqual(expect.arrayContaining(['基础', '内容', '行为', '高级']));
    expect(result.interactionSchema.flatMap((group) => group.fields.map((field) => field.editor))).toContain('interactionEvent');
    expect(result.propSchema.flatMap((group) => group.fields).find((field) => field.path === 'props.badge')?.editor).toBe('badge');
    expect(result.propSchema.flatMap((group) => group.fields).find((field) => field.path === 'props.target')?.visibleWhen).toEqual({
      path: 'props.href',
      operator: 'exists',
    });
  });
});
