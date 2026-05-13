import { Form, Radio } from 'antd';
import type { JsonRecord, JsonValue } from '../../domain/types';
import type { FieldConfig } from '../../domain/types';
import { getValueAtPropPath, setValueAtPropPath } from '../../domain/operations/componentPropertyOperations';
import type { PropSchemaField } from '../../registry/types/propSchema';
import { ColorPropEditor } from './editors/ColorPropEditor';
import { CollectionItemsEditor, type CollectionItemConfig } from './editors/CollectionItemsEditor';
import { BadgePropsEditor } from './editors/BadgePropsEditor';
import { FormFieldsEditor } from './editors/FormFieldsEditor';
import { IconPropEditor } from './editors/IconPropEditor';
import { InteractionEventEditor } from './editors/InteractionEventEditor';
import { NumberPropEditor } from './editors/NumberPropEditor';
import { SelectPropEditor } from './editors/SelectPropEditor';
import { SwitchPropEditor } from './editors/SwitchPropEditor';
import { TableColumnsEditor } from './editors/TableColumnsEditor';
import { TableActionBuilder } from './TableActionBuilder';
import { MenuItemsEditor, type MenuItemConfig } from './editors/MenuItemsEditor';
import { TableRowsEditor } from './editors/TableRowsEditor';
import { asRows } from './editors/tableRowsValue';
import { TextPropEditor } from './editors/TextPropEditor';
import type { TableColumnConfig } from './builderUtils';

type Props = {
  field: PropSchemaField;
  propsValue: JsonRecord;
  nodePropsValue?: JsonRecord;
  onChange: (props: JsonRecord) => void;
};

function asString(value: JsonValue | undefined): string {
  return typeof value === 'string' ? value : '';
}

function asBoolean(value: JsonValue | undefined): boolean {
  return typeof value === 'boolean' ? value : false;
}

function updateField(propsValue: JsonRecord, field: PropSchemaField, value: JsonValue, onChange: (props: JsonRecord) => void) {
  onChange(setValueAtPropPath(propsValue, field.path, value));
}

export function PropFieldRenderer({ field, propsValue, nodePropsValue = propsValue, onChange }: Props) {
  const value = getValueAtPropPath(propsValue, field.path);
  const editor = field.editor ?? (field.control === 'boolean' ? 'switch' : field.control);

  if (editor === 'json' || editor === 'codePreview') return null;

  return (
    <Form.Item label={field.label}>
      {editor === 'text' ? <TextPropEditor ariaLabel={field.label} value={asString(value)} onChange={(next) => updateField(propsValue, field, next, onChange)} /> : null}
      {editor === 'textarea' ? <TextPropEditor ariaLabel={field.label} textarea value={asString(value)} onChange={(next) => updateField(propsValue, field, next, onChange)} /> : null}
      {editor === 'reactNode' ? <TextPropEditor ariaLabel={field.label} value={asString(value)} onChange={(next) => updateField(propsValue, field, next, onChange)} /> : null}
      {editor === 'number' ? <NumberPropEditor value={typeof value === 'number' ? value : undefined} onChange={(next) => updateField(propsValue, field, next, onChange)} /> : null}
      {editor === 'switch' ? <SwitchPropEditor value={asBoolean(value)} onChange={(next) => updateField(propsValue, field, next, onChange)} /> : null}
      {editor === 'select' ? (
        <SelectPropEditor value={typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? value : undefined} options={field.options ?? []} onChange={(next) => updateField(propsValue, field, next as JsonValue, onChange)} />
      ) : null}
      {editor === 'multiSelect' ? (
        <SelectPropEditor mode="multiple" value={Array.isArray(value) ? (value as (string | number | boolean)[]) : []} options={field.options ?? []} onChange={(next) => updateField(propsValue, field, next as JsonValue, onChange)} />
      ) : null}
      {editor === 'radio' ? <Radio.Group value={value} options={field.options ?? []} onChange={(event) => updateField(propsValue, field, event.target.value as JsonValue, onChange)} /> : null}
      {editor === 'color' ? <ColorPropEditor value={asString(value)} onChange={(next) => updateField(propsValue, field, next, onChange)} /> : null}
      {editor === 'icon' ? <IconPropEditor value={asString(value)} onChange={(next) => updateField(propsValue, field, next, onChange)} /> : null}
      {editor === 'badge' || editor === 'objectEditor' ? <BadgePropsEditor value={value} onChange={(next) => updateField(propsValue, field, next, onChange)} /> : null}
      {editor === 'arrayEditor' ? <MenuItemsEditor value={Array.isArray(value) ? (value as MenuItemConfig[]) : []} onChange={(next) => updateField(propsValue, field, next as JsonValue, onChange)} /> : null}
      {editor === 'styleEditor' || editor === 'classNameEditor' || editor === 'advancedJson' ? null : null}
      {editor === 'interactionEvent' ? <InteractionEventEditor label={field.label} /> : null}
      {editor === 'tableColumns' ? <TableColumnsEditor value={Array.isArray(value) ? (value as TableColumnConfig[]) : []} onChange={(next) => updateField(propsValue, field, next as JsonValue, onChange)} /> : null}
      {editor === 'tableRows' ? <TableRowsEditor value={asRows(value)} columns={Array.isArray(nodePropsValue.columns) ? (nodePropsValue.columns as TableColumnConfig[]) : []} onChange={(next) => updateField(propsValue, field, next as JsonValue, onChange)} /> : null}
      {editor === 'menuItems' ? <MenuItemsEditor value={Array.isArray(value) ? (value as MenuItemConfig[]) : []} onChange={(next) => updateField(propsValue, field, next as JsonValue, onChange)} /> : null}
      {editor === 'options' ? <CollectionItemsEditor value={Array.isArray(value) ? value : []} addLabel="添加选项" onChange={(next) => updateField(propsValue, field, next as JsonValue, onChange)} /> : null}
      {editor === 'tabsItems' ? <CollectionItemsEditor value={Array.isArray(value) ? value : []} addLabel="添加标签页" onChange={(next) => updateField(propsValue, field, next as JsonValue, onChange)} /> : null}
      {editor === 'stepsItems' ? <CollectionItemsEditor value={Array.isArray(value) ? value : []} addLabel="添加步骤" onChange={(next) => updateField(propsValue, field, next as JsonValue, onChange)} /> : null}
      {editor === 'treeData' ? <CollectionItemsEditor value={Array.isArray(value) ? (value as CollectionItemConfig[]) : []} addLabel="添加项目" onChange={(next) => updateField(propsValue, field, next as JsonValue, onChange)} /> : null}
      {editor === 'formFields' ? <FormFieldsEditor value={Array.isArray(value) ? (value as FieldConfig[]) : []} onChange={(next) => updateField(propsValue, field, next as JsonValue, onChange)} /> : null}
      {editor === 'actions' ? <TableActionBuilder actions={Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []} onChange={(next) => updateField(propsValue, field, next, onChange)} /> : null}
      {editor === 'dataSource' || editor === 'layout' ? <TextPropEditor value={asString(value)} onChange={(next) => updateField(propsValue, field, next, onChange)} /> : null}
    </Form.Item>
  );
}
