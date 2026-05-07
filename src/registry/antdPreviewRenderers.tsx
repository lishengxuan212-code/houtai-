import { Alert, Badge, Button, Card, Checkbox, DatePicker, Empty, Input, Progress, Rate, Select, Slider, Space, Switch, Table, Tag } from 'antd';
import type { LibraryComponentDescriptor } from './antdManifest';

export function AntdComponentStaticPreview({ component }: { component: LibraryComponentDescriptor }) {
  if (!component.enabled) return <div className="component-preview-disabled">{component.disabledReason}</div>;
  const label = component.nameZh || component.nameEn;
  if (component.source === 'pro-components') return <div className="component-preview-generic pro-preview">{label}</div>;
  switch (component.nameEn) {
    case 'Table':
      return <div className="component-preview-table"><span /><span /><span /></div>;
    case 'Form':
      return <div className="component-preview-form"><span /><span /></div>;
    case 'Select':
    case 'Input':
      return <div className="component-preview-input">{label}</div>;
    case 'Button':
      return <div className="component-preview-button">{label}</div>;
    default:
      return <div className="component-preview-generic">{label}</div>;
  }
}

export function AntdComponentPreview({ component }: { component: LibraryComponentDescriptor }) {
  if (!component.enabled) return <div className="component-preview-disabled">{component.disabledReason}</div>;
  switch (component.nameEn) {
    case 'Button':
      return <Button size="small" type="primary">按钮</Button>;
    case 'Input':
      return <Input size="small" placeholder="请输入" />;
    case 'Select':
      return <Select size="small" value="全部" style={{ width: '100%' }} options={[{ value: '全部', label: '全部' }]} />;
    case 'Table':
      return <Table size="small" pagination={false} columns={[{ title: '名称', dataIndex: 'name' }]} dataSource={[{ key: '1', name: '示例' }]} />;
    case 'Form':
      return <Input size="small" addonBefore="名称" placeholder="表单项" />;
    case 'Card':
      return <Card size="small" title="卡片" styles={{ body: { padding: 8 } }}>内容</Card>;
    case 'Modal':
    case 'Drawer':
      return <div className="component-preview-window">{component.nameZh}</div>;
    case 'Tabs':
      return <Space size={4}><Tag color="blue">全部</Tag><Tag>待处理</Tag></Space>;
    case 'Checkbox':
      return <Checkbox checked>选项</Checkbox>;
    case 'DatePicker':
      return <DatePicker size="small" style={{ width: '100%' }} />;
    case 'Rate':
      return <Rate disabled defaultValue={3} />;
    case 'Slider':
      return <Slider defaultValue={40} />;
    case 'Switch':
      return <Switch size="small" defaultChecked />;
    case 'Badge':
      return <Badge count={5}><span className="component-preview-dot" /></Badge>;
    case 'Alert':
      return <Alert showIcon type="info" message="提示" />;
    case 'Progress':
      return <Progress percent={60} size="small" />;
    case 'Empty':
      return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={false} />;
    default:
      if (component.renderKind === 'feedbackAction') return <Alert type="success" message="动作类" />;
      if (component.renderKind === 'system') return <Tag>系统类</Tag>;
      if (component.renderKind === 'iconPicker') return <Tag color="blue">图标选择器</Tag>;
      return <div className="component-preview-generic">{component.nameZh}</div>;
  }
}
