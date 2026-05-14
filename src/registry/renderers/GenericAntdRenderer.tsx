import {
  Affix,
  Alert,
  Anchor,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Calendar,
  Card,
  Carousel,
  Cascader,
  Checkbox,
  Collapse,
  ColorPicker,
  DatePicker,
  Descriptions,
  Divider,
  Dropdown,
  Empty,
  Flex,
  FloatButton,
  Image,
  Input,
  InputNumber,
  Layout,
  List,
  Mentions,
  Menu,
  Pagination,
  Popconfirm,
  Popover,
  Progress,
  QRCode,
  Radio,
  Rate,
  Result,
  Segmented,
  Skeleton,
  Slider,
  Space,
  Spin,
  Splitter,
  Statistic,
  Steps,
  Switch,
  Tag,
  Timeline,
  TimePicker,
  Tooltip,
  Transfer,
  Tree,
  TreeSelect,
  Typography,
  Upload,
  Watermark,
} from 'antd';
import type { ComponentNode, JsonValue } from '../../domain/types';
import { componentLabel } from '../componentLabels';
import type { RendererContext } from './rendererTypes';
import { asArray, asBoolean, asString } from './primitive';
import { TableRenderer } from './TableRenderer';

type Props = {
  node: ComponentNode;
  children?: React.ReactNode;
  context: RendererContext;
};

function badgeProps(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const badge = value as Record<string, unknown>;
  if (badge.enabled === false) return undefined;
  return {
    count: typeof badge.count === 'number' ? badge.count : 0,
    dot: typeof badge.dot === 'boolean' ? badge.dot : false,
  };
}

const sampleItems = ['第一项', '第二项', '第三项'];

type RendererCollectionItem = {
  key: string;
  label: string;
  value?: string;
  title?: string;
  children?: unknown;
};

type RendererTreeItem = {
  value: string;
  title: string;
  label: string;
  children?: RendererTreeItem[];
};

function collectionItems(value: JsonValue | undefined): RendererCollectionItem[] {
  return asArray<string | { key?: string; label?: string; title?: string; value?: string; children?: unknown }>(value, []).map((item, index) => {
    if (typeof item === 'string') return { key: item, label: item };
    const label = item.label ?? item.title ?? item.value ?? `Item ${index + 1}`;
    return {
      key: item.key ?? item.value ?? label,
      label,
      title: label,
      ...(item.value !== undefined ? { value: item.value } : {}),
      ...(item.children !== undefined ? { children: item.children } : {}),
    };
  });
}

function treeItems(value: JsonValue | undefined): RendererTreeItem[] {
  return collectionItems(value).map((item) => {
    const children = Array.isArray(item.children) ? treeItems(item.children as JsonValue) : undefined;
    return {
      value: String(item.value ?? item.key),
      title: item.label,
      label: item.label,
      ...(children ? { children } : {}),
    };
  });
}

function boolProp(value: JsonValue | undefined, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function numberProp(value: JsonValue | undefined, fallback: number): number {
  return typeof value === 'number' ? value : fallback;
}

function muiName(type: string) {
  return type.startsWith('Mui') ? type.slice(3) : type;
}

function renderMuiAdapter(node: ComponentNode, children: React.ReactNode, context: RendererContext) {
  const name = muiName(node.type);
  const title = String(node.props.title ?? node.props.text ?? node.props.label ?? componentLabel(node.type));
  const items = collectionItems(node.props.items);
  switch (name) {
    case 'Accordion':
      return (
        <GenericAntdRenderer
          node={{ ...node, type: 'Accordion' }}
          context={context}
        >
          {children}
        </GenericAntdRenderer>
      );
    case 'Autocomplete':
    case 'TextField':
      return <Input placeholder={asString(node.props.placeholder, '请输入')} addonBefore={asString(node.props.label, title)} />;
    case 'TextareaAutosize':
      return <Input.TextArea placeholder={asString(node.props.placeholder, '请输入多行内容')} autoSize={{ minRows: 2, maxRows: 4 }} />;
    case 'Button':
    case 'LoadingButton':
      return (
        <Button type={asString(node.props.variant, 'contained') === 'contained' ? 'primary' : 'default'} loading={asBoolean(node.props.loading)} onClick={() => context.dispatch?.({ componentId: node.id, event: 'click' })}>
          {title}
        </Button>
      );
    case 'ButtonGroup':
      return <Button.Group>{(items.length ? items : collectionItems(['保存', '发布'])).map((item) => <Button key={String(item.key)}>{item.label}</Button>)}</Button.Group>;
    case 'Fab':
    case 'SpeedDial':
      return <Button shape="circle" type="primary" onClick={() => context.dispatch?.({ componentId: node.id, event: 'click' })}>{title.slice(0, 2)}</Button>;
    case 'ToggleButton':
    case 'Chip':
      return <Tag color={asBoolean(node.props.selected) ? 'blue' : 'default'}>{asString(node.props.label, title)}</Tag>;
    case 'Checkbox':
      return <Checkbox checked={asBoolean(node.props.checked, true)}>{asString(node.props.label, title)}</Checkbox>;
    case 'RadioGroup':
      return <Radio.Group value={asString(node.props.value) || (items[0]?.label ?? '选项 A')} options={(items.length ? items : collectionItems(node.props.options)).map((item) => ({ value: item.label, label: item.label }))} />;
    case 'Rating':
      return <Rate defaultValue={numberProp(node.props.value, 3)} />;
    case 'Select':
      return <TreeSelect value={asString(node.props.value) || (items[0]?.label ?? '全部')} treeData={(items.length ? items : collectionItems(node.props.options)).map((item) => ({ value: item.label, title: item.label }))} />;
    case 'Slider':
      return <Slider defaultValue={numberProp(node.props.value, 40)} />;
    case 'Switch':
      return <Switch checked={asBoolean(node.props.checked, true)} />;
    case 'TransferList':
      return <Transfer dataSource={(items.length ? items : sampleItems.map((item) => ({ key: item, label: item }))).map((item) => ({ key: String(item.key), title: String(item.label) }))} targetKeys={[]} render={(item) => item.title ?? ''} />;
    case 'Avatar':
      return <Avatar>{title.slice(0, 1)}</Avatar>;
    case 'Badge':
      return <Badge count={numberProp(node.props.badgeContent, 5)}><Tag>{title}</Tag></Badge>;
    case 'Divider':
      return <Divider>{title}</Divider>;
    case 'Icons':
    case 'MaterialIcons':
      return <Tag color="blue">icon</Tag>;
    case 'List':
      return <List size="small" dataSource={(items.length ? items : collectionItems(node.props.items)).map((item) => item.label)} renderItem={(item) => <List.Item>{item}</List.Item>} />;
    case 'Table':
      return <TableRenderer node={{ ...node, type: 'Table' }} context={context} />;
    case 'Tooltip':
      return <Tooltip title="提示内容"><Tag>{title}</Tag></Tooltip>;
    case 'Typography':
      return <Typography.Title level={4}>{asString(node.props.text, title)}</Typography.Title>;
    case 'Alert':
      return <Alert type="info" showIcon message={title} />;
    case 'Backdrop':
      return <div className="runtime-generic-component" style={{ background: 'rgba(15,23,42,0.18)' }}>{title}</div>;
    case 'Dialog':
    case 'Modal':
      return <Card size="small" title={title}>{children || '弹层内容'}</Card>;
    case 'Progress':
      return <Progress percent={numberProp(node.props.value, 60)} />;
    case 'Skeleton':
      return <Skeleton active paragraph={{ rows: 2 }} />;
    case 'Snackbar':
      return <Alert type="success" message={asString(node.props.text, title)} />;
    case 'AppBar':
      return <Layout.Header style={{ height: 40, lineHeight: '40px', color: '#fff' }}>{title}</Layout.Header>;
    case 'Card':
    case 'Paper':
    case 'Box':
    case 'Container':
      return <Card size="small" title={title}>{children || asString(node.props.text, '内容')}</Card>;
    case 'BottomNavigation':
    case 'Tabs':
      return <Segmented options={(items.length ? items : collectionItems(node.props.items)).map((item) => item.label)} />;
    case 'Breadcrumbs':
      return <Breadcrumb items={[{ title: '首页' }, { title }]} />;
    case 'Drawer':
      return <Card size="small" title={title}>{children || '抽屉内容'}</Card>;
    case 'Link':
      return <Typography.Link onClick={() => context.dispatch?.({ componentId: node.id, event: 'click' })}>{asString(node.props.text, title)}</Typography.Link>;
    case 'Menu':
      return <Menu mode="horizontal" items={(items.length ? items : collectionItems(node.props.items)).map((item) => ({ key: String(item.key), label: item.label }))} />;
    case 'Pagination':
      return <Pagination size="small" total={50} />;
    case 'Stepper':
      return <Steps size="small" current={1} items={(items.length ? items : collectionItems(node.props.items)).map((item) => ({ title: item.label }))} />;
    case 'Grid':
    case 'GridLegacy':
      return <div className="runtime-generic-grid">{children || sampleItems.map((item) => <div key={item}>{item}</div>)}</div>;
    case 'Stack':
      return <Space direction="vertical">{children || sampleItems.map((item) => <Tag key={item}>{item}</Tag>)}</Space>;
    case 'ImageList':
      return <div className="runtime-generic-grid">{(items.length ? items : collectionItems(node.props.items)).map((item) => <div key={String(item.key)}>{item.label}</div>)}</div>;
    case 'Popover':
      return <Popover content="弹出内容"><Tag>{title}</Tag></Popover>;
    case 'Popper':
      return <Tooltip title="定位弹层"><Tag>{title}</Tag></Tooltip>;
    case 'Masonry':
      return <div className="runtime-generic-masonry">{sampleItems.map((item) => <div key={item}>{item}</div>)}</div>;
    case 'Timeline':
      return <Timeline items={(items.length ? items : collectionItems(node.props.items)).map((item) => ({ children: item.label }))} />;
    case 'DateTimePickers':
      return <DatePicker showTime />;
    case 'TreeView':
      return <Tree treeData={(items.length ? items : collectionItems(node.props.items)).map((item) => ({ key: String(item.key), title: item.label }))} />;
    default:
      return <div className="runtime-generic-component">{children || title}</div>;
  }
}

export function GenericAntdRenderer({ node, children, context }: Props) {
  const title = String(node.props.title ?? node.props.text ?? componentLabel(node.type));
  if (node.type.startsWith('Mui')) return renderMuiAdapter(node, children, context);
  switch (node.type) {
    case 'Accordion': {
      const controlledExpanded = typeof node.props.expanded === 'boolean' ? node.props.expanded : undefined;
      const expanded = controlledExpanded ?? boolProp(node.props.defaultExpanded);
      const summary = String(node.props.summary ?? node.props.title ?? '折叠标题');
      const details = String(node.props.details ?? node.props.children ?? '折叠内容');
      const outlined = asString(node.props.variant, 'elevation') === 'outlined';
      const square = boolProp(node.props.square);
      const elevation = numberProp(node.props.elevation, 1);
      const collapseItem = {
        key: 'panel',
        label: summary,
        children: details,
        ...(boolProp(node.props.disabled) ? { collapsible: 'disabled' as const } : {}),
        style: { paddingInline: boolProp(node.props.disableGutters) ? 0 : undefined },
      };
      return (
        <Collapse
          size="small"
          bordered={outlined}
          activeKey={expanded ? ['panel'] : []}
          expandIconPosition="end"
          style={{
            borderRadius: square ? 0 : 8,
            boxShadow: outlined ? undefined : `0 ${Math.max(1, elevation) * 2}px ${Math.max(1, elevation) * 8}px rgba(15,23,42,0.08)`,
          }}
          items={[collapseItem]}
          onChange={(keys) => {
            const nextExpanded = Array.isArray(keys) ? keys.includes('panel') : keys === 'panel';
            context.dispatch?.({ componentId: node.id, event: 'openChange', payload: { expanded: nextExpanded } });
          }}
        />
      );
    }
    case 'FloatButton':
      {
        const badge = badgeProps(node.props.badge);
        return (
          <FloatButton
            description={asString(node.props.content)}
            tooltip={asString(node.props.tooltip)}
            type={asString(node.props.type, 'default') === 'primary' ? 'primary' : 'default'}
            shape={asString(node.props.shape, 'circle') === 'square' ? 'square' : 'circle'}
            htmlType={asString(node.props.htmlType, 'button') as 'button' | 'submit' | 'reset'}
            aria-label={asString(node.props.content) || node.name}
            onClick={() => context.dispatch?.({ componentId: node.id, event: 'click' })}
            {...(badge ? { badge } : {})}
            {...(asString(node.props.href) ? { href: asString(node.props.href), target: asString(node.props.target) || '_self' } : {})}
          />
        );
      }
    case 'FloatButton.Group': {
      const items = Array.isArray(node.props.items) ? (node.props.items as Record<string, unknown>[]) : [];
      return (
        <FloatButton.Group
          shape={asString(node.props.shape, 'circle') === 'square' ? 'square' : 'circle'}
          trigger={asString(node.props.trigger, 'click') === 'hover' ? 'hover' : 'click'}
          open={asBoolean(node.props.open)}
          placement={asString(node.props.placement, 'top') as 'top' | 'left' | 'right' | 'bottom'}
          onOpenChange={(open) => context.dispatch?.({ componentId: node.id, event: 'openChange', payload: { open } })}
          onClick={() => context.dispatch?.({ componentId: node.id, event: 'click' })}
        >
          {items.map((item, index) => (
            <FloatButton
              key={String(item.id ?? index)}
              description={typeof item.content === 'string' ? item.content : undefined}
              type={item.type === 'primary' ? 'primary' : 'default'}
            />
          ))}
        </FloatButton.Group>
      );
    }
    case 'FloatButton.BackTop':
      return (
        <FloatButton.BackTop
          duration={typeof node.props.duration === 'number' ? node.props.duration : 450}
          visibilityHeight={typeof node.props.visibilityHeight === 'number' ? node.props.visibilityHeight : 400}
          onClick={() => context.dispatch?.({ componentId: node.id, event: 'click' })}
        />
      );
    case 'Typography':
      return <Typography.Title level={4}>{String(node.props.text ?? title)}</Typography.Title>;
    case 'Divider':
      return <Divider>{title}</Divider>;
    case 'Flex':
      return <Flex gap={8}>{children || sampleItems.map((item) => <Tag key={item}>{item}</Tag>)}</Flex>;
    case 'Grid':
      return <div className="runtime-generic-grid">{children || sampleItems.map((item) => <div key={item}>{item}</div>)}</div>;
    case 'Layout':
      return <Layout><Layout.Header>顶部</Layout.Header><Layout.Content>{children || title}</Layout.Content></Layout>;
    case 'Masonry':
      return <div className="runtime-generic-masonry">{sampleItems.map((item) => <div key={item}>{item}</div>)}</div>;
    case 'Space':
      return <Space>{children || sampleItems.map((item) => <Tag key={item}>{item}</Tag>)}</Space>;
    case 'Splitter':
      return <Splitter><Splitter.Panel>左侧</Splitter.Panel><Splitter.Panel>右侧</Splitter.Panel></Splitter>;
    case 'Anchor':
      return <Anchor items={[{ key: 'section', href: '#section', title }]} />;
    case 'Breadcrumb':
      return <Breadcrumb items={(collectionItems(node.content?.items ?? node.props.items).length ? collectionItems(node.content?.items ?? node.props.items) : [{ key: 'home', label: '首页' }, { key: 'current', label: title }]).map((item) => ({ title: item.label }))} />;
    case 'Dropdown':
      return <Dropdown menu={{ items: collectionItems(node.content?.menuItems ?? node.props.menuItems) }}><a>{title}</a></Dropdown>;
    case 'Menu':
      return <Menu mode="horizontal" items={collectionItems(node.content?.items ?? node.props.items)} />;
    case 'Pagination':
      return <Pagination size="small" total={50} />;
    case 'Steps':
      return <Steps size="small" current={1} items={collectionItems(node.content?.items ?? node.props.items).map((item) => ({ title: item.label }))} />;
    case 'AutoComplete':
      return <Mentions placeholder="请输入" />;
    case 'Cascader':
      return <Cascader placeholder={asString(node.props.placeholder, '请选择')} options={treeItems(node.content?.options ?? node.props.options)} />;
    case 'Checkbox':
      {
        const options = collectionItems(node.content?.options ?? node.props.options);
        return options.length ? <Checkbox.Group value={options.slice(0, 1).map((item) => item.key)} options={options.map((item) => ({ value: item.key, label: item.label }))} /> : <Checkbox checked={asBoolean(node.props.checked, true)}>{asString(node.props.label, title)}</Checkbox>;
      }
    case 'ColorPicker':
      return <ColorPicker defaultValue="#1677ff" />;
    case 'DatePicker':
      return <DatePicker />;
    case 'TextareaAutosize':
      return <Input.TextArea placeholder={asString(node.props.placeholder, '请输入多行内容')} autoSize={{ minRows: 2, maxRows: 4 }} />;
    case 'ListBox':
      return (
        <List
          size="small"
          bordered
          dataSource={collectionItems(node.content?.options ?? node.props.options).map((item) => item.label)}
          renderItem={(item) => <List.Item>{item}</List.Item>}
        />
      );
    case 'InputNumber':
      return <InputNumber defaultValue={10} />;
    case 'Mentions':
      return <Mentions placeholder="@用户" />;
    case 'Radio':
      {
        const options = collectionItems(node.content?.options ?? node.props.options);
        return <Radio.Group value={asString(node.props.value) || options[0]?.key} options={(options.length ? options : [{ key: 'a', label: title }, { key: 'b', label: '选项' }]).map((item) => ({ value: item.key, label: item.label }))} />;
      }
    case 'Rate':
      return <Rate defaultValue={3} />;
    case 'Slider':
      return <Slider defaultValue={40} />;
    case 'Switch':
      return <Switch defaultChecked />;
    case 'TimePicker':
      return <TimePicker />;
    case 'Transfer':
      return <Transfer dataSource={sampleItems.map((item) => ({ key: item, title: item }))} targetKeys={['第二项']} render={(item) => item.title ?? ''} />;
    case 'TreeSelect':
      {
        const treeData = treeItems(node.content?.treeData ?? node.props.treeData ?? node.content?.options ?? node.props.options);
        return <TreeSelect placeholder={asString(node.props.placeholder, '请选择')} value={asString(node.props.value) || treeData[0]?.value} treeData={treeData.length ? treeData : [{ value: 'a', title, label: title }]} />;
      }
    case 'Upload':
      return <Upload><Tag color="blue">上传文件</Tag></Upload>;
    case 'Avatar':
      return <Avatar>{title.slice(0, 1)}</Avatar>;
    case 'Badge':
      return <Badge count={5}><Tag>{title}</Tag></Badge>;
    case 'Calendar':
      return <Calendar fullscreen={false} />;
    case 'Carousel':
      return <Carousel dots={false}><div><Tag>{title}</Tag></div></Carousel>;
    case 'Collapse':
      return <Collapse items={collectionItems(node.content?.panels ?? node.props.panels).map((item) => ({ key: String(item.key), label: item.label, children: '内容' }))} />;
    case 'Descriptions':
      return <Descriptions size="small" items={[{ key: '1', label: '名称', children: title }]} />;
    case 'Empty':
      return <Empty description={title} />;
    case 'Image':
      return <Image width={96} height={54} src="https://placehold.co/192x108?text=Image" />;
    case 'List':
      return <List size="small" dataSource={sampleItems} renderItem={(item) => <List.Item>{item}</List.Item>} />;
    case 'Popover':
      return <Popover content="气泡内容"><Tag>{title}</Tag></Popover>;
    case 'QRCode':
      return <QRCode value="https://ant.design" size={96} />;
    case 'Segmented':
      return <Segmented options={sampleItems} />;
    case 'Statistic':
      return <Statistic title={title} value={1280} />;
    case 'Tag':
      return <Tag color="blue">{title}</Tag>;
    case 'Timeline':
      return <Timeline items={sampleItems.map((item) => ({ children: item }))} />;
    case 'Tooltip':
      return <Tooltip title="文字提示"><Tag>{title}</Tag></Tooltip>;
    case 'Tour':
      return <Tag>漫游式引导</Tag>;
    case 'Tree':
      return <Tree treeData={[{ key: '1', title, children: [{ key: '2', title: '子项' }] }]} />;
    case 'Alert':
      return <Alert type="info" showIcon message={title} />;
    case 'Popconfirm':
      return <Popconfirm title="确认操作？"><Tag>{title}</Tag></Popconfirm>;
    case 'Progress':
      return <Progress percent={60} />;
    case 'Result':
      return <Result status="success" title={title} />;
    case 'Skeleton':
      return <Skeleton active paragraph={{ rows: 2 }} />;
    case 'Spin':
      return <Spin tip={title}><div style={{ minHeight: 48 }} /></Spin>;
    case 'Watermark':
      return <Watermark content={title}><div style={{ minHeight: 64 }}>{children || '水印内容'}</div></Watermark>;
    case 'Affix':
      return <Affix offsetTop={0}><Tag>{title}</Tag></Affix>;
    default:
      return <div className="runtime-generic-component">{children || title}</div>;
  }
}
