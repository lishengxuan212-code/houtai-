import type { FieldConfig, JsonValue } from '../../domain/types';
import { AdvancedJsonEditor } from './AdvancedJsonEditor';
import { FieldListBuilder } from './FieldListBuilder';
import type { InspectorProps } from './types';

function asFields(value: JsonValue | undefined): FieldConfig[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is FieldConfig => item !== null && typeof item === 'object' && 'key' in item && 'label' in item && 'type' in item);
}

export function SearchBarInspector({ node, updateProps }: InspectorProps) {
  return (
    <div className="inspector-stack">
      <FieldListBuilder fields={asFields(node.props.fields)} onChange={(fields) => updateProps({ fields: fields as unknown as JsonValue })} />
      <AdvancedJsonEditor key={JSON.stringify(node.props)} value={node.props} onApply={updateProps} />
    </div>
  );
}
