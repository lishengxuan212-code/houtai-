import type { ComponentNode, JsonRecord } from '../domain/types';
import { createId } from '../domain/ids';
import { assertDescriptor } from './componentRegistry';
import { getComponentDefinition, getResolvedDefaultProps } from './componentDefinitionRegistry';
import { getComponentDefaultOverrides } from '../store/componentLibraryStore';
import { generateRowsFromColumns } from '../editor/inspector/editors/tableRowsUtils';
import { componentLabel } from './componentLabels';

function defaultDataForNode(type: string, props: JsonRecord, definitionDefaultData: JsonRecord | undefined): JsonRecord | undefined {
  if (type !== 'Table' && type !== 'pro.ProTable' && type !== 'pro.EditableProTable') return definitionDefaultData ? structuredClone(definitionDefaultData) : undefined;
  const rows = Array.isArray(props.rows) ? props.rows : [];
  const dataRows = Array.isArray(props.data) ? props.data : [];
  const defaultRows = Array.isArray(definitionDefaultData?.rows) ? definitionDefaultData.rows : [];
  if (type === 'pro.ProTable' || type === 'pro.EditableProTable') {
    return {
      ...(definitionDefaultData ? structuredClone(definitionDefaultData) : {}),
      rows: rows.length ? rows : dataRows.length ? dataRows : defaultRows,
    };
  }
  return {
    ...(definitionDefaultData ? structuredClone(definitionDefaultData) : {}),
    rows: rows.length ? rows : dataRows.length ? dataRows : defaultRows.length ? defaultRows : generateRowsFromColumns(Array.isArray(props.columns) ? props.columns : []),
  };
}

function defaultContentForNode(type: string, props: JsonRecord, definitionDefaultContent: JsonRecord | undefined): JsonRecord | undefined {
  const content = definitionDefaultContent ? structuredClone(definitionDefaultContent) : undefined;
  if (type === 'pro.ProForm' && Array.isArray(props.fields)) {
    return { ...(content ?? {}), fields: structuredClone(props.fields) };
  }
  if ((type === 'Modal' || type === 'Drawer') && (props.content !== undefined || props.footerButtons !== undefined)) {
    return {
      ...(content ?? {}),
      ...(props.content !== undefined ? { body: structuredClone(props.content) } : {}),
      ...(props.footerButtons !== undefined ? { footerButtons: structuredClone(props.footerButtons) } : {}),
    };
  }
  return content;
}

export function createNode(type: string, props: JsonRecord = {}): ComponentNode {
  const definition = getComponentDefinition(type);
  const descriptor = definition ? undefined : assertDescriptor(type);
  const defaultProps = definition ? getResolvedDefaultProps(type, getComponentDefaultOverrides()) : descriptor!.defaultProps;
  const nextProps = { ...defaultProps, ...props };
  const defaultContent = defaultContentForNode(type, nextProps, definition?.defaultContent);
  const defaultData = defaultDataForNode(type, nextProps, definition?.defaultData);
  return {
    id: createId(type.toLowerCase()),
    type,
    name: componentLabel(type) || definition?.nameZh || descriptor!.displayName,
    props: nextProps,
    ...(defaultContent ? { content: defaultContent } : {}),
    ...(defaultData ? { data: defaultData } : {}),
    ...(definition?.defaultEvents ? { events: structuredClone(definition.defaultEvents) } : {}),
    ...(definition?.canHaveChildren || descriptor?.canHaveChildren ? { children: [] } : {}),
  };
}
