import type { ComponentEvent, JsonRecord } from '../domain/types';
import { antdLibraryManifest } from './antdManifest';
import { apiSchemaToPropSchema } from './apiSchemas/apiSchemaToPropSchema';
import { floatButtonApiSchema } from './apiSchemas/floatButtonApiSchema';
import { allDescriptors } from './descriptors';
import { normalizeComponentDefinition } from './normalizers/normalizeComponentDefinition';
import { mergeJsonRecords } from './normalizers/normalizeNodeProps';
import type { ComponentDefaultOverrideOptions, ComponentDefaultOverrides, ComponentDefinition } from './types/componentDefinition';
import type { PropSchemaGroup, PropSchemaField } from './types/propSchema';

const descriptorByType = new Map(allDescriptors.map((descriptor) => [descriptor.type, descriptor]));
const manifestByType = new Map(antdLibraryManifest.filter((component) => component.source !== 'pro-components' && component.source !== 'system').map((component) => [component.key, component]));

function field(path: string, label: string, editor: PropSchemaField['editor'], extra: Partial<PropSchemaField> = {}): PropSchemaField {
  return { path, label, editor, ...extra };
}

function floatButtonDefinition(input: {
  type: string;
  nameZh: string;
  defaultProps: JsonRecord;
  events: ComponentEvent[];
}): ComponentDefinition {
  const schemas = apiSchemaToPropSchema(floatButtonApiSchema, input.type);
  return {
    type: input.type,
    nameEn: input.type,
    nameZh: input.nameZh,
    source: 'antd',
    category: 'feedback',
    defaultProps: input.defaultProps,
    apiSchema: floatButtonApiSchema,
    propSchema: schemas.propSchema,
    interactionSchema: schemas.interactionSchema,
    supportedEvents: input.events,
    enabled: true,
    draggable: true,
    renderKind: 'visual',
  };
}

const floatButtonDefinitions: ComponentDefinition[] = [
  floatButtonDefinition({
    type: 'FloatButton',
    nameZh: '悬浮按钮',
    events: ['click'],
    defaultProps: {
      icon: 'QuestionCircleOutlined',
      content: '',
      tooltip: '',
      type: 'default',
      shape: 'circle',
      href: '',
      target: '_self',
      htmlType: 'button',
      classNames: {},
      badge: { enabled: false, count: 0, dot: false },
    },
  }),
  floatButtonDefinition({
    type: 'FloatButton.Group',
    nameZh: '悬浮按钮组',
    events: ['click', 'openChange'],
    defaultProps: {
      shape: 'circle',
      trigger: 'click',
      open: false,
      placement: 'top',
      closeIcon: 'CloseOutlined',
      items: [
        { id: 'help', content: '帮助', icon: 'QuestionCircleOutlined', type: 'default' },
        { id: 'feedback', content: '反馈', icon: 'MessageOutlined', type: 'default' },
      ],
    },
  }),
  floatButtonDefinition({
    type: 'FloatButton.BackTop',
    nameZh: '返回顶部',
    events: ['click'],
    defaultProps: {
      duration: 450,
      target: 'window',
      visibilityHeight: 400,
    },
  }),
];

const tableRowsGroup: PropSchemaGroup = { key: 'rows', id: 'rows', title: '行数据', fields: [field('data.rows', '行数据', 'tableRows')] };

function heavyDefinition(input: {
  type: string;
  nameEn: string;
  nameZh: string;
  defaultProps: JsonRecord;
  propSchema: PropSchemaGroup[];
  events?: ComponentEvent[];
  description?: string;
  canHaveChildren?: boolean;
  contentSchema?: PropSchemaGroup[];
  dataSchema?: PropSchemaGroup[];
  defaultContent?: JsonRecord;
  defaultData?: JsonRecord;
  slotSchema?: PropSchemaGroup[];
}): ComponentDefinition {
  return {
    type: input.type,
    nameEn: input.nameEn,
    nameZh: input.nameZh,
    source: 'pro-components',
    category: 'business',
    defaultProps: input.defaultProps,
    ...(input.defaultContent ? { defaultContent: input.defaultContent } : {}),
    ...(input.defaultData ? { defaultData: input.defaultData } : {}),
    propSchema: input.propSchema,
    supportedEvents: input.events ?? [],
    enabled: true,
    draggable: true,
    renderKind: 'pro',
    ...(input.description ? { description: input.description } : {}),
    ...(input.canHaveChildren ? { canHaveChildren: true } : {}),
    ...(input.contentSchema ? { contentSchema: input.contentSchema } : {}),
    ...(input.dataSchema ? { dataSchema: input.dataSchema } : {}),
    ...(input.slotSchema ? { slotSchema: input.slotSchema } : {}),
  };
}

const heavyComponentDefinitions: ComponentDefinition[] = [
  heavyDefinition({
    type: 'pro.ProTable',
    nameEn: 'ProTable',
    nameZh: '高级表格',
    description: '适合后台列表页，内置搜索区、工具栏、分页和列配置。',
    events: ['rowClick', 'search', 'click'],
    defaultProps: {
      headerTitle: '数据列表',
      search: true,
      toolbar: true,
      pagination: true,
      rowSelection: false,
      emptyText: '暂无数据',
      columns: [{ key: 'name', title: '名称', valueType: 'text', search: true }],
      actions: ['详情'],
    },
    propSchema: [
      {
        key: 'basic',
        id: 'basic',
        title: '基础',
        fields: [
          field('props.headerTitle', '表格标题', 'text'),
          field('props.search', '显示搜索区', 'switch'),
          field('props.toolbar', '显示工具栏', 'switch'),
          field('props.pagination', '显示分页', 'switch'),
          field('props.rowSelection', '支持行选择', 'switch'),
          field('props.emptyText', '空状态文案', 'text'),
        ],
      },
      { key: 'columns', id: 'columns', title: '列配置', fields: [field('props.columns', '表格列', 'tableColumns')] },
      { key: 'actions', id: 'actions', title: '操作列', fields: [field('props.actions', '操作按钮', 'actions')] },
    ],
    defaultData: { rows: [] },
    dataSchema: [tableRowsGroup],
  }),
  heavyDefinition({
    type: 'pro.EditableProTable',
    nameEn: 'EditableProTable',
    nameZh: '可编辑表格',
    description: '适合需要直接编辑行数据的后台表格。',
    events: ['change'],
    defaultProps: {
      headerTitle: '可编辑数据',
      rowKey: 'id',
      allowAddRow: true,
      allowDeleteRow: true,
      allowEditRow: true,
      columns: [{ key: 'name', title: '名称', valueType: 'text', editable: true, required: true }],
    },
    propSchema: [
      {
        key: 'basic',
        id: 'basic',
        title: '基础',
        fields: [
          field('props.headerTitle', '表格标题', 'text'),
          field('props.rowKey', '行主键字段', 'text'),
          field('props.allowAddRow', '允许新增行', 'switch'),
          field('props.allowDeleteRow', '允许删除行', 'switch'),
          field('props.allowEditRow', '允许编辑行', 'switch'),
        ],
      },
      { key: 'columns', id: 'columns', title: '列配置', fields: [field('props.columns', '表格列', 'tableColumns')] },
    ],
    defaultData: { rows: [] },
    dataSchema: [tableRowsGroup],
  }),
  heavyDefinition({
    type: 'pro.ProForm',
    nameEn: 'ProForm',
    nameZh: '高级表单',
    description: '适合复杂表单，支持字段配置、提交和重置文案。',
    events: ['submit', 'change'],
    defaultProps: {
      title: '业务表单',
      layout: 'vertical',
      submitText: '提交',
      resetText: '重置',
      requiredMark: true,
      successMessage: '提交成功',
    },
    propSchema: [
      {
        key: 'basic',
        id: 'basic',
        title: '基础',
        fields: [
          field('props.title', '表单标题', 'text'),
          field('props.layout', '表单布局', 'select', {
            options: [
              { label: '垂直', value: 'vertical' },
              { label: '水平', value: 'horizontal' },
              { label: '行内', value: 'inline' },
            ],
          }),
          field('props.submitText', '提交按钮文案', 'text'),
          field('props.resetText', '重置按钮文案', 'text'),
          field('props.requiredMark', '显示必填标记', 'switch'),
          field('props.successMessage', '提交成功提示', 'text'),
        ],
      },
    ],
    defaultContent: { fields: [{ key: 'name', label: '名称', type: 'text', required: true }] },
    contentSchema: [{ key: 'fields', id: 'fields', title: '字段配置', fields: [field('content.fields', '字段列表', 'formFields')] }],
  }),
  heavyDefinition({
    type: 'pro.ProLayout',
    nameEn: 'ProLayout',
    nameZh: '高级后台布局',
    description: '适合后台框架，包含系统名称、菜单、顶部栏和侧边栏。',
    events: ['click'],
    canHaveChildren: true,
    defaultProps: {
      title: '后台系统',
      logo: '',
      selectedMenu: '/dashboard',
      layout: 'side',
      theme: 'light',
      showHeader: true,
      showSider: true,
      menus: [
        { path: '/dashboard', name: '工作台' },
        { path: '/orders', name: '订单管理' },
      ],
    },
    propSchema: [
      {
        key: 'basic',
        id: 'basic',
        title: '基础',
        fields: [
          field('props.title', '系统名称', 'text'),
          field('props.logo', 'Logo', 'text'),
          field('props.selectedMenu', '默认菜单', 'text'),
          field('props.showHeader', '显示顶部栏', 'switch'),
          field('props.showSider', '显示侧边栏', 'switch'),
        ],
      },
    ],
  }),
  heavyDefinition({
    type: 'pro.PageContainer',
    nameEn: 'PageContainer',
    nameZh: '高级页面容器',
    canHaveChildren: true,
    defaultProps: { title: '页面标题', subTitle: '页面说明' },
    propSchema: [{ key: 'basic', id: 'basic', title: '基础', fields: [field('props.title', '标题', 'text'), field('props.subTitle', '说明', 'textarea')] }],
  }),
  heavyDefinition({
    type: 'pro.ProCard',
    nameEn: 'ProCard',
    nameZh: '高级卡片',
    canHaveChildren: true,
    defaultProps: { title: '卡片标题', bordered: true },
    propSchema: [{ key: 'basic', id: 'basic', title: '基础', fields: [field('props.title', '卡片标题', 'text'), field('props.bordered', '显示边框', 'switch')] }],
  }),
  heavyDefinition({
    type: 'pro.ProDescriptions',
    nameEn: 'ProDescriptions',
    nameZh: '高级详情',
    defaultProps: { title: '详情信息', columns: [{ key: 'name', title: '名称', valueType: 'text' }], data: { name: '示例名称' } },
    propSchema: [
      { key: 'basic', id: 'basic', title: '基础', fields: [field('props.title', '详情标题', 'text')] },
      { key: 'columns', id: 'columns', title: '字段配置', fields: [field('props.columns', '详情字段', 'tableColumns')] },
    ],
  }),
  heavyDefinition({
    type: 'pro.ProList',
    nameEn: 'ProList',
    nameZh: '高级列表',
    events: ['click'],
    defaultProps: { title: '列表', items: [{ title: '列表项', description: '说明文字' }] },
    propSchema: [{ key: 'basic', id: 'basic', title: '基础', fields: [field('props.title', '列表标题', 'text')] }],
    defaultData: { items: [{ title: '列表项', description: '说明文字' }] },
    dataSchema: [{ key: 'items', id: 'items', title: '列表数据', fields: [field('data.items', '列表数据', 'json')] }],
  }),
];

const normalizedDefinitions = [
  ...allDescriptors.map((descriptor) => normalizeComponentDefinition(descriptor, manifestByType.get(descriptor.type))),
  ...antdLibraryManifest
    .filter((component) => component.source === 'pro-components')
    .map((component) =>
      normalizeComponentDefinition(
        {
          type: `pro.${component.key}`,
          displayName: component.nameZh,
          category: 'business',
          defaultProps: component.defaultProps,
          editableProps: component.editableProps,
          supportedEvents: component.supportedEvents,
        },
        component,
      ),
    ),
];

function withS21Schemas(definition: ComponentDefinition): ComponentDefinition {
  if (definition.type === 'Dropdown') {
    return {
      ...definition,
      defaultProps: {
        ...definition.defaultProps,
        text: definition.defaultProps.text ?? 'Dropdown',
        menuItems: definition.defaultProps.menuItems ?? [
          { id: 'item1', key: 'item1', label: '第一项' },
          { id: 'item2', key: 'item2', label: '第二项' },
          { id: 'item3', key: 'item3', label: '第三项' },
        ],
      },
      defaultContent: { menuItems: definition.defaultProps.menuItems ?? [] },
      contentSchema: [{ key: 'menu', id: 'menu', title: '菜单内容', fields: [field('content.menuItems', '菜单项', 'menuItems')] }],
    };
  }
  if (definition.type === 'Table') {
    return { ...definition, defaultProps: { ...definition.defaultProps }, defaultData: { rows: definition.defaultProps.rows ?? [] }, dataSchema: [tableRowsGroup] };
  }
  if (definition.type === 'Select' || definition.type === 'Radio' || definition.type === 'Checkbox') {
    return {
      ...definition,
      defaultProps: {
        ...definition.defaultProps,
        options: definition.defaultProps.options ?? [
          { id: 'option1', key: 'option1', label: 'Option 1', value: 'option1' },
          { id: 'option2', key: 'option2', label: 'Option 2', value: 'option2' },
        ],
      },
      propSchema: definition.propSchema.map((group) => ({
        ...group,
        fields: group.fields.filter((schemaField) => schemaField.path !== 'props.options'),
      })),
      defaultContent: { options: definition.defaultProps.options ?? [] },
      contentSchema: [{ key: 'options', id: 'options', title: 'Options', fields: [field('content.options', 'Options', 'options')] }],
    };
  }
  if (definition.type === 'Menu') {
    return {
      ...definition,
      defaultProps: {
        ...definition.defaultProps,
        items: definition.defaultProps.items ?? [
          { id: 'dashboard', key: 'dashboard', label: 'Dashboard' },
          { id: 'orders', key: 'orders', label: 'Orders' },
        ],
      },
      propSchema: definition.propSchema.map((group) => ({
        ...group,
        fields: group.fields.filter((schemaField) => schemaField.path !== 'props.items'),
      })),
      defaultContent: { items: definition.defaultProps.items ?? [] },
      contentSchema: [{ key: 'items', id: 'items', title: 'Menu tree', fields: [field('content.items', 'Menu items', 'menuItems')] }],
    };
  }
  if (definition.type === 'Tabs') {
    return {
      ...definition,
      defaultProps: {
        ...definition.defaultProps,
        items: definition.defaultProps.items ?? [
          { id: 'all', key: 'all', label: 'All' },
          { id: 'pending', key: 'pending', label: 'Pending' },
        ],
      },
      propSchema: definition.propSchema.map((group) => ({
        ...group,
        fields: group.fields.filter((schemaField) => schemaField.path !== 'props.items'),
      })),
      defaultContent: { items: definition.defaultProps.items ?? [] },
      contentSchema: [{ key: 'tabs', id: 'tabs', title: 'Tabs', fields: [field('content.items', 'Tabs', 'tabsItems')] }],
    };
  }
  if (definition.type === 'Steps') {
    return {
      ...definition,
      defaultProps: {
        ...definition.defaultProps,
        items: definition.defaultProps.items ?? [
          { id: 'step1', key: 'step1', label: 'Step 1' },
          { id: 'step2', key: 'step2', label: 'Step 2' },
        ],
      },
      propSchema: definition.propSchema.map((group) => ({
        ...group,
        fields: group.fields.filter((schemaField) => schemaField.path !== 'props.items'),
      })),
      defaultContent: { items: definition.defaultProps.items ?? [] },
      contentSchema: [{ key: 'steps', id: 'steps', title: 'Steps', fields: [field('content.items', 'Steps', 'stepsItems')] }],
    };
  }
  if (definition.type === 'Collapse') {
    return {
      ...definition,
      defaultProps: {
        ...definition.defaultProps,
        panels: definition.defaultProps.panels ?? [
          { id: 'panel1', key: 'panel1', label: 'Panel 1', content: 'Panel content' },
        ],
      },
      defaultContent: { panels: definition.defaultProps.panels ?? [] },
      contentSchema: [{ key: 'panels', id: 'panels', title: 'Panels', fields: [field('content.panels', 'Panels', 'treeData')] }],
    };
  }
  if (definition.type === 'Modal' || definition.type === 'Drawer') {
    return {
      ...definition,
      defaultProps: {
        ...definition.defaultProps,
        content: definition.defaultProps.content ?? 'Content',
        footerButtons: definition.defaultProps.footerButtons ?? [
          { id: 'cancel', key: 'cancel', label: 'Cancel', value: 'cancel' },
          { id: 'confirm', key: 'confirm', label: 'Confirm', value: 'confirm' },
        ],
      },
      defaultContent: { body: definition.defaultProps.content ?? '', footerButtons: definition.defaultProps.footerButtons ?? [] },
      contentSchema: [
        {
          key: 'content',
          id: 'content',
          title: 'Content',
          fields: [field('content.body', 'Body content', 'textarea'), field('content.footerButtons', 'Footer buttons', 'options')],
        },
      ],
    };
  }
  if (definition.type === 'PageContainer') {
    return {
      ...definition,
      defaultProps: {
        ...definition.defaultProps,
        regions: definition.defaultProps.regions ?? {
          showTitle: true,
          showDescription: true,
          showToolbar: false,
          showContent: true,
          showFooter: false,
        },
      },
      slotSchema: [
        {
          key: 'regions',
          id: 'regions',
          title: '区域',
          fields: [
            field('props.regions.showTitle', '页面标题区', 'switch'),
            field('props.regions.showDescription', '页面说明区', 'switch'),
            field('props.regions.showToolbar', '工具栏区', 'switch'),
            field('props.regions.showContent', '内容区', 'switch'),
            field('props.regions.showFooter', '底部操作区', 'switch'),
          ],
        },
      ],
    };
  }
  return definition;
}

const definitions = [...new Map([...normalizedDefinitions, ...heavyComponentDefinitions, ...floatButtonDefinitions].map((definition) => [definition.type, withS21Schemas(definition)])).values()];
const registry = new Map(definitions.map((definition) => [definition.type, definition]));

export function listComponentDefinitions(): ComponentDefinition[] {
  return definitions.map((definition) => structuredClone(definition));
}

export function getComponentDefinition(type: string): ComponentDefinition | undefined {
  const definition = registry.get(type);
  return definition ? structuredClone(definition) : undefined;
}

export function getResolvedDefaultProps(type: string, overrides: ComponentDefaultOverrides = {}): JsonRecord {
  const definition = registry.get(type);
  const descriptor = descriptorByType.get(type);
  const defaultProps = definition?.defaultProps ?? descriptor?.defaultProps;
  if (!defaultProps) throw new Error(`Unknown component definition: ${type}`);
  return mergeJsonRecords(defaultProps, overrides[type] ?? {});
}

export function resolveDefaultProps(type: string, options: ComponentDefaultOverrideOptions = {}): JsonRecord {
  const definition = registry.get(type);
  const descriptor = descriptorByType.get(type);
  const defaultProps = definition?.defaultProps ?? descriptor?.defaultProps;
  if (!defaultProps) throw new Error(`Unknown component definition: ${type}`);
  return mergeJsonRecords(defaultProps, options.defaultProps ?? {});
}
