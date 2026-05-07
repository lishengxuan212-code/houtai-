import {
  Affix,
  Alert,
  Anchor,
  Avatar,
  Badge,
  Breadcrumb,
  Calendar,
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

function collectionItems(value: JsonValue | undefined) {
  return asArray<string | { key?: string; label?: string; title?: string; value?: string; children?: unknown }>(value, []).map((item, index) => {
    if (typeof item === 'string') return { key: item, label: item };
    const label = item.label ?? item.title ?? item.value ?? `Item ${index + 1}`;
    return { key: item.key ?? item.value ?? label, label, title: label, children: item.children };
  });
}

export function GenericAntdRenderer({ node, children, context }: Props) {
  const title = String(node.props.title ?? node.props.text ?? componentLabel(node.type));
  switch (node.type) {
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
      return <Breadcrumb items={[{ title: '首页' }, { title }]} />;
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
      return <Cascader placeholder="请选择" options={[{ value: 'a', label: '选项', children: [{ value: 'b', label: '子项' }] }]} />;
    case 'Checkbox':
      return <Checkbox checked>{title}</Checkbox>;
    case 'ColorPicker':
      return <ColorPicker defaultValue="#1677ff" />;
    case 'DatePicker':
      return <DatePicker />;
    case 'InputNumber':
      return <InputNumber defaultValue={10} />;
    case 'Mentions':
      return <Mentions placeholder="@用户" />;
    case 'Radio':
      return <Radio.Group value="a" options={[{ value: 'a', label: title }, { value: 'b', label: '选项' }]} />;
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
      return <TreeSelect value="a" treeData={[{ value: 'a', title }]} />;
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
