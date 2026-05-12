import { Alert, Badge, Button, Card, Checkbox, DatePicker, Empty, Input, Progress, Rate, Select, Slider, Space, Switch, Table, Tag } from 'antd';
import type { LibraryComponentDescriptor } from './antdManifest';

export function AntdComponentStaticPreview({ component }: { component: LibraryComponentDescriptor }) {
  if (!component.enabled) return <div className="component-preview-disabled">{component.disabledReason}</div>;
  const label = component.nameZh || component.nameEn;
  const key = component.key;
  if (component.source === 'pro-components') return <div className="axure-preview axure-preview-panel"><span /><span /></div>;
  if (component.renderKind === 'system') return <div className="axure-preview axure-preview-system"><span /></div>;
  if (component.renderKind === 'iconPicker') return <div className="axure-preview axure-preview-icon"><span /></div>;
  if (['Rectangle', 'VisualBlock', 'WhitePanel'].includes(key)) return <div className="axure-preview axure-preview-rect" />;
  if (key === 'Circle') return <div className="axure-preview axure-preview-circle" />;
  if (key === 'ImageWidget' || key === 'Image' || key === 'MuiImageList') return <div className="axure-preview axure-preview-image"><span /></div>;
  if (key === 'Placeholder') return <div className="axure-preview axure-preview-placeholder"><span /><span /></div>;
  if (key === 'Line' || key === 'DividerWidget' || key === 'Divider' || key === 'MuiDivider') return <div className="axure-preview axure-preview-line" />;
  if (key === 'HotZone') return <div className="axure-preview axure-preview-hotzone"><span /></div>;
  if (key === 'H1' || key === 'PageTitle') return <div className="axure-preview axure-preview-heading h1">H1</div>;
  if (key === 'H2' || key === 'ModuleTitle') return <div className="axure-preview axure-preview-heading h2">H2</div>;
  if (key === 'H3') return <div className="axure-preview axure-preview-heading h3">H3</div>;
  if (['BodyText', 'HelperText', 'StatusLabel', 'AmountText', 'NumericText', 'TimeText', 'Typography', 'MuiTypography'].includes(key)) return <div className="axure-preview axure-preview-text"><b>A</b><span /></div>;
  if (['Input', 'MuiTextField', 'TextareaAutosize', 'MuiTextareaAutosize', 'InputNumber'].includes(key)) return <div className="axure-preview axure-preview-input" />;
  if (['Select', 'MuiSelect', 'ListBox', 'TreeSelect', 'Cascader', 'AutoComplete', 'MuiAutocomplete'].includes(key)) return <div className="axure-preview axure-preview-select"><span /></div>;
  if (['Checkbox', 'MuiCheckbox'].includes(key)) return <div className="axure-preview axure-preview-check" />;
  if (['Radio', 'MuiRadioGroup'].includes(key)) return <div className="axure-preview axure-preview-radio" />;
  if (['Switch', 'MuiSwitch', 'Slider', 'MuiSlider', 'Rate', 'MuiRating'].includes(key)) return <div className="axure-preview axure-preview-control"><span /></div>;
  if (['Menu', 'MuiMenu', 'Tabs', 'MuiTabs', 'Breadcrumb', 'MuiBreadcrumbs', 'Steps', 'MuiStepper', 'Pagination', 'MuiPagination'].includes(key)) return <div className="axure-preview axure-preview-menu"><span /><span /><span /></div>;
  if (['Card', 'MuiCard', 'Accordion', 'MuiAccordion', 'Collapse', 'PageContainer', 'Section', 'MuiPaper', 'MuiBox', 'MuiContainer'].includes(key)) return <div className="axure-preview axure-preview-panel"><span /><span /></div>;
  if (['Modal', 'MuiModal', 'MuiDialog', 'Drawer', 'MuiDrawer', 'Popover', 'MuiPopover', 'MuiPopper'].includes(key)) return <div className="axure-preview axure-preview-window"><span /></div>;
  if (['Alert', 'MuiAlert', 'Message', 'Notification', 'MuiSnackbar', 'Progress', 'MuiProgress', 'Skeleton', 'MuiSkeleton', 'Spin', 'Result'].includes(key)) return <div className="axure-preview axure-preview-feedback"><span /></div>;
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
      return <div className="axure-preview axure-preview-generic">{label.slice(0, 2)}</div>;
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
