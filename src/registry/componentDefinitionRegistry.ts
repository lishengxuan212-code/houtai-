import type { ComponentCategory, ComponentEvent, JsonRecord } from '../domain/types';
import { antdLibraryManifest } from './antdManifest';
import { apiSchemaToPropSchema } from './apiSchemas/apiSchemaToPropSchema';
import { floatButtonApiSchema } from './apiSchemas/floatButtonApiSchema';
import { muiAccordionApiSchema } from './apiSchemas/muiAccordionApiSchema';
import { allDescriptors } from './descriptors';
import { normalizeComponentDefinition } from './normalizers/normalizeComponentDefinition';
import { mergeJsonRecords } from './normalizers/normalizeNodeProps';
import type { ComponentDefaultOverrideOptions, ComponentDefaultOverrides, ComponentDefinition, ComponentGenerationRole, ComponentStyleCapability } from './types/componentDefinition';
import type { PropSchemaGroup, PropSchemaField } from './types/propSchema';

const descriptorByType = new Map(allDescriptors.map((descriptor) => [descriptor.type, descriptor]));
const manifestByType = new Map(antdLibraryManifest.filter((component) => component.source !== 'pro-components' && component.source !== 'system').map((component) => [component.key, component]));
const muiManifestItems = antdLibraryManifest.filter((component) => component.source === 'mui');
const foundationTypes = new Set([
  'PageContainer',
  'Section',
  'Card',
  'Button',
  'Input',
  'Select',
  'H1',
  'H2',
  'H3',
  'BodyText',
  'HelperText',
  'LinkText',
  'ErrorText',
  'Annotation',
  'StickyNote',
  'ModuleTitle',
  'PageTitle',
  'StatusLabel',
  'AmountText',
  'NumericText',
  'TimeText',
  'Rectangle',
  'Circle',
  'Line',
  'Arrow',
  'ImageWidget',
  'IconWidget',
  'Placeholder',
  'DividerWidget',
  'HotZone',
  'VisualBlock',
  'WhitePanel',
  'BadgePill',
  'HeaderBar',
  'SideNavBlock',
  'TableSkeleton',
]);

function generationRoleFor(type: string): ComponentGenerationRole {
  return foundationTypes.has(type) ? 'foundation' : 'enhancement';
}

function styleCapabilitiesFor(type: string): ComponentStyleCapability[] {
  if (['H1', 'H2', 'H3', 'BodyText', 'HelperText', 'LinkText', 'ErrorText', 'Annotation', 'StickyNote', 'ModuleTitle', 'PageTitle', 'StatusLabel', 'AmountText', 'NumericText', 'TimeText'].includes(type)) {
    return ['typography', 'color', 'background', 'border', 'borderRadius', 'padding', 'size'];
  }
  if (['WhitePanel', 'VisualBlock', 'Rectangle', 'HotZone', 'Card', 'Section'].includes(type)) {
    return ['background', 'border', 'borderRadius', 'shadow', 'padding', 'size'];
  }
  if (['Button', 'Input', 'Select', 'BadgePill'].includes(type)) {
    return ['background', 'border', 'borderRadius', 'typography', 'color', 'size'];
  }
  if (['TableSkeleton', 'HeaderBar', 'SideNavBlock'].includes(type)) {
    return ['background', 'border', 'borderRadius', 'spacing', 'size'];
  }
  return ['size'];
}

function withGenerationCapabilities(definition: ComponentDefinition): ComponentDefinition {
  const generationRole = definition.generationRole ?? generationRoleFor(definition.type);
  return {
    ...definition,
    propSchema: appendCommonAppearance(definition),
    generationRole,
    styleCapabilities: definition.styleCapabilities ?? styleCapabilitiesFor(definition.type),
    description:
      definition.description ??
      (definition.type === 'TableSkeleton'
        ? 'Foundation visual table block for screenshot-first page restoration before replacing it with a data table component.'
        : generationRole === 'foundation'
          ? 'Foundation node for AI-generated page structure and visual restoration.'
          : 'Higher level component used to enhance, replace, or reuse a generated page region.'),
  };
}

function field(path: string, label: string, editor: PropSchemaField['editor'], extra: Partial<PropSchemaField> = {}): PropSchemaField {
  return { path, label, editor, ...extra };
}

const fontOptions = ['Microsoft YaHei', 'PingFang SC', 'Arial', 'SimSun', 'SimHei', 'Helvetica', 'Tahoma'].map((value) => ({ label: value, value }));
const fontSizeOptions = [12, 13, 14, 16, 18, 20, 24, 28, 32, 40, 48].map((value) => ({ label: `${value}`, value }));
const fontWeightOptions = [
  { label: '常规', value: 400 },
  { label: '中等', value: 500 },
  { label: '加粗', value: 700 },
];
const alignOptions = [
  { label: '左对齐', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右对齐', value: 'right' },
];

const commonAppearanceSchema: PropSchemaGroup[] = [
  { key: 'opacity', id: 'opacity', title: '透明度', fields: [field('props.opacity', '透明度', 'number', { min: 0, max: 100 })] },
  {
    key: 'typography',
    id: 'typography',
    title: '文字',
    fields: [
      field('props.fontFamily', '字体', 'select', { options: fontOptions }),
      field('props.fontWeight', '字重', 'select', { options: fontWeightOptions }),
      field('props.fontSize', '字号', 'select', { options: fontSizeOptions }),
      field('props.color', '颜色', 'color'),
      field('props.lineHeight', '行高', 'number'),
      field('props.letterSpacing', '字间距', 'number'),
      field('props.align', '对齐', 'select', { options: alignOptions }),
      field('props.underline', '下划线', 'switch'),
      field('props.strikethrough', '删除线', 'switch'),
    ],
  },
  { key: 'fill', id: 'fill', title: '填充', fields: [field('props.fill', '填充色', 'color'), field('props.background', '背景色', 'color'), field('props.backgroundImage', '背景图片', 'text')] },
  {
    key: 'border',
    id: 'border',
    title: '边框',
    fields: [
      field('props.borderColor', '边框色', 'color'),
      field('props.borderWidth', '粗细', 'number', { min: 0, max: 20 }),
      field('props.borderStyle', '线型', 'select', {
        options: [
          { label: '实线', value: 'solid' },
          { label: '虚线', value: 'dashed' },
          { label: '点线', value: 'dotted' },
          { label: '无', value: 'none' },
        ],
      }),
    ],
  },
  { key: 'shadow', id: 'shadow', title: '阴影', fields: [field('props.shadow', '外阴影', 'text'), field('props.innerShadow', '内阴影', 'text')] },
  { key: 'corner', id: 'corner', title: '圆角', fields: [field('props.radius', '圆角', 'number', { min: 0, max: 200 }), field('props.borderRadius', '边框圆角', 'number', { min: 0, max: 200 })] },
  {
    key: 'padding',
    id: 'padding',
    title: '内边距',
    fields: [field('props.paddingLeft', '左', 'number', { min: 0, max: 200 }), field('props.paddingTop', '上', 'number', { min: 0, max: 200 }), field('props.paddingRight', '右', 'number', { min: 0, max: 200 }), field('props.paddingBottom', '下', 'number', { min: 0, max: 200 })],
  },
  { key: 'size', id: 'size', title: '尺寸', fields: [field('props.width', '宽度', 'number', { min: 1 }), field('props.height', '高度', 'number', { min: 1 })] },
];

function appendCommonAppearance(definition: ComponentDefinition): PropSchemaGroup[] {
  const existing = new Set(definition.propSchema.flatMap((group) => group.fields.map((schemaField) => schemaField.path)));
  return [
    ...definition.propSchema,
    ...commonAppearanceSchema
      .map((group) => ({ ...group, fields: group.fields.filter((schemaField) => !existing.has(schemaField.path)) }))
      .filter((group) => group.fields.length > 0),
  ];
}

function editorForManifestProp(key: string, control: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'json'): PropSchemaField['editor'] {
  if (control === 'boolean') return 'switch';
  if (control !== 'json') return control;
  if (key === 'columns') return 'tableColumns';
  if (key === 'rows' || key === 'data') return 'tableRows';
  if (key === 'fields') return 'formFields';
  if (key === 'options') return 'options';
  if (key === 'items') return 'menuItems';
  if (key === 'tabs') return 'tabsItems';
  if (key === 'steps') return 'stepsItems';
  if (key === 'treeData') return 'treeData';
  if (key === 'actions') return 'actions';
  return 'advancedJson';
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

const tableRowsGroup: PropSchemaGroup = { key: 'rows', id: 'rows', title: '行数据', fields: [field('rows', '行数据', 'tableRows')] };

const categoryMap: Record<string, ComponentCategory> = {
  通用: 'navigation',
  布局: 'layout',
  导航: 'navigation',
  数据录入: 'form',
  数据展示: 'data',
  反馈: 'feedback',
  其他: 'business',
  重型组件: 'business',
};

function manifestDefinition(component: (typeof antdLibraryManifest)[number]): ComponentDefinition {
  return {
    type: component.key,
    nameEn: component.nameEn,
    nameZh: component.nameZh,
    source: component.source,
    category: categoryMap[component.category] ?? 'business',
    defaultProps: component.defaultProps,
    propSchema: [
      {
        key: 'props',
        id: 'props',
        title: '属性',
        fields: component.editableProps.map((prop) => field(`props.${prop.key}`, prop.label, editorForManifestProp(prop.key, prop.control))),
      },
    ],
    supportedEvents: component.supportedEvents,
    enabled: component.enabled,
    draggable: component.draggable,
    renderKind: component.renderKind,
    description: component.description,
    ...(component.renderKind === 'layout' ? { canHaveChildren: true } : {}),
  };
}

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
  ...muiManifestItems.map((component) => manifestDefinition(component)),
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
  if (definition.type === 'Accordion' || definition.type === 'MuiAccordion') {
    const schemas = apiSchemaToPropSchema(muiAccordionApiSchema, definition.type);
    return {
      ...definition,
      apiSchema: muiAccordionApiSchema,
      propSchema: schemas.propSchema,
      interactionSchema: schemas.interactionSchema,
      description: '本地化复用 MUI Material UI Accordion API，以中文手风琴组件展示。',
    };
  }
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
  if (definition.type === 'Table' || definition.type === 'MuiTable') {
    return { ...definition, defaultProps: { ...definition.defaultProps }, defaultData: { rows: definition.defaultProps.rows ?? [] }, dataSchema: [tableRowsGroup] };
  }
  if (definition.type === 'Select' || definition.type === 'Radio' || definition.type === 'Checkbox' || definition.type === 'ListBox') {
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

const definitions = [...new Map([...normalizedDefinitions, ...heavyComponentDefinitions, ...floatButtonDefinitions].map((definition) => [definition.type, withGenerationCapabilities(withS21Schemas(definition))])).values()];
const registry = new Map(definitions.map((definition) => [definition.type, definition]));

export function listComponentDefinitions(): ComponentDefinition[] {
  return definitions.map((definition) => structuredClone(definition));
}

export function listFoundationComponentDefinitions(): ComponentDefinition[] {
  return definitions.filter((definition) => definition.generationRole === 'foundation').map((definition) => structuredClone(definition));
}

export function isFoundationNode(type: string): boolean {
  return registry.get(type)?.generationRole === 'foundation';
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
