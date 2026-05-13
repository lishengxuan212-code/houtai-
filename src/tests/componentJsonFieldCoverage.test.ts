import { describe, expect, it } from 'vitest';
import { getComponentDefinition } from '../registry/componentDefinitionRegistry';

function pathsFor(type: string): Set<string> {
  const definition = getComponentDefinition(type);
  if (!definition) throw new Error(`Missing component definition: ${type}`);
  return new Set([
    ...definition.propSchema.flatMap((group) => group.fields.map((field) => field.path)),
    ...(definition.contentSchema ?? []).flatMap((group) => group.fields.map((field) => field.path)),
    ...(definition.dataSchema ?? []).flatMap((group) => group.fields.map((field) => field.path)),
    ...(definition.slotSchema ?? []).flatMap((group) => group.fields.map((field) => field.path)),
  ]);
}

describe('component JSON editable field coverage', () => {
  it.each(['Input', 'Select', 'Radio', 'Checkbox', 'ListBox', 'DatePicker', 'InputNumber', 'TextareaAutosize', 'MuiSelect', 'MuiTextField', 'MuiRadioGroup'])(
    'exposes label and fieldKey for %s',
    (type) => {
      const paths = pathsFor(type);

      expect(paths.has('props.label')).toBe(true);
      expect(paths.has('props.fieldKey')).toBe(true);
    },
  );

  it.each(['Select', 'Radio', 'ListBox', 'MuiSelect', 'MuiRadioGroup'])('exposes options through the structured options editor for %s', (type) => {
    const paths = pathsFor(type);

    expect(paths.has('content.options')).toBe(true);
  });

  it.each(['Input', 'Select', 'DatePicker', 'InputNumber', 'TextareaAutosize', 'MuiSelect', 'MuiTextField'])('exposes placeholder for %s', (type) => {
    const paths = pathsFor(type);

    expect(paths.has('props.placeholder')).toBe(true);
  });
});
