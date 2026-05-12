import { Checkbox, Form, Input, InputNumber, Select } from 'antd';
import { useEffect } from 'react';
import type { ContainerLayoutConfig, JsonRecord, JsonValue } from '../../domain/types';
import { useProjectStore } from '../../store/projectStore';
import { AdvancedJsonEditor } from './AdvancedJsonEditor';
import type { InspectorProps } from './types';

function usePropForm(nodeProps: JsonRecord, keys: string[]) {
  const [form] = Form.useForm();
  useEffect(() => {
    form.setFieldsValue(Object.fromEntries(keys.map((key) => [key, nodeProps[key]])));
  }, [form, keys, nodeProps]);
  return form;
}

function patchChanged(changed: Record<string, unknown>, updateProps: (props: JsonRecord) => void) {
  const patch: JsonRecord = {};
  for (const [key, value] of Object.entries(changed)) patch[key] = value as JsonValue;
  updateProps(patch);
}

export function ButtonInspector({ node, updateProps, hideTopBarProps }: InspectorProps) {
  const keys = hideTopBarProps ? ['variant', 'danger'] : ['text', 'variant', 'danger'];
  const form = usePropForm(node.props, keys);
  return (
    <div className="inspector-stack">
      <Form form={form} layout="vertical" onValuesChange={(changed) => patchChanged(changed, updateProps)}>
        {!hideTopBarProps ? (
          <Form.Item label="文案" name="text">
            <Input />
          </Form.Item>
        ) : null}
        <Form.Item label="样式" name="variant">
          <Select
            options={[
              { label: '主按钮', value: 'primary' },
              { label: '默认', value: 'default' },
              { label: '链接', value: 'link' },
            ]}
          />
        </Form.Item>
        <Form.Item name="danger" valuePropName="checked">
          <Checkbox>危险操作</Checkbox>
        </Form.Item>
      </Form>
      <AdvancedJsonEditor key={JSON.stringify(node.props)} value={node.props} onApply={updateProps} />
    </div>
  );
}

function TitleInspector({ node, updateProps, label, hideTopBarProps }: InspectorProps & { label: string }) {
  const form = usePropForm(node.props, ['title']);
  if (hideTopBarProps) return <AdvancedJsonEditor key={JSON.stringify(node.props)} value={node.props} onApply={updateProps} />;
  return (
    <div className="inspector-stack">
      <Form form={form} layout="vertical" onValuesChange={(changed) => patchChanged(changed, updateProps)}>
        <Form.Item label={label} name="title">
          <Input />
        </Form.Item>
      </Form>
      <AdvancedJsonEditor key={JSON.stringify(node.props)} value={node.props} onApply={updateProps} />
    </div>
  );
}

const layoutModeOptions = [
  { label: '纵向排列', value: 'stack' },
  { label: '横向排列', value: 'row' },
  { label: '网格', value: 'grid' },
  { label: '自由布局', value: 'free' },
];

const stackAlignOptions = [
  { label: '左侧对齐', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右侧对齐', value: 'right' },
  { label: '拉伸铺满', value: 'stretch' },
];

const verticalAlignOptions = [
  { label: '顶部置顶', value: 'top' },
  { label: '垂直居中', value: 'center' },
  { label: '底部对齐', value: 'bottom' },
  { label: '拉伸铺满', value: 'stretch' },
];

const horizontalJustifyOptions = [
  { label: '左侧对齐', value: 'left' },
  { label: '水平居中', value: 'center' },
  { label: '右侧对齐', value: 'right' },
  { label: '两端分布', value: 'between' },
];

const stackJustifyOptions = [
  { label: '顶部置顶', value: 'top' },
  { label: '垂直居中', value: 'center' },
  { label: '底部对齐', value: 'bottom' },
];

const gridJustifyOptions = [
  { label: '左侧对齐', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右侧对齐', value: 'right' },
  { label: '拉伸铺满', value: 'stretch' },
];

function LayoutInspector({ node }: InspectorProps) {
  const currentPageId = useProjectStore((state) => state.currentPageId);
  const apply = useProjectStore((state) => state.apply);
  const layout = node.containerLayout ?? { mode: 'stack', gap: 12, align: 'left', justify: 'top' };

  function updateLayout(patch: Partial<ContainerLayoutConfig>) {
    const next = { ...layout, ...patch } as ContainerLayoutConfig;
    apply({ type: 'updateContainerLayout', pageId: currentPageId, nodeId: node.id, layout: next });
  }

  return (
    <Form layout="vertical">
      <Form.Item label="布局模式">
        <Select
          value={layout.mode}
          options={layoutModeOptions}
          onChange={(mode: ContainerLayoutConfig['mode']) =>
            updateLayout(
              mode === 'grid'
                ? { mode, columns: 2, align: 'top', justify: 'stretch' }
                : mode === 'row'
                  ? { mode, align: 'top', justify: 'left' }
                  : mode === 'stack'
                    ? { mode, align: 'left', justify: 'top' }
                    : { mode },
            )
          }
        />
      </Form.Item>
      <Form.Item label="间距">
        <InputNumber min={0} max={48} value={layout.gap ?? 12} style={{ width: '100%' }} onChange={(gap) => updateLayout({ gap: gap ?? 12 })} />
      </Form.Item>
      {layout.mode === 'stack' ? (
        <>
          <Form.Item label="水平位置">
            <Select value={layout.align ?? 'left'} options={stackAlignOptions} onChange={(align) => updateLayout({ align })} />
          </Form.Item>
          <Form.Item label="垂直位置">
            <Select value={layout.justify ?? 'top'} options={stackJustifyOptions} onChange={(justify) => updateLayout({ justify })} />
          </Form.Item>
        </>
      ) : null}
      {layout.mode === 'row' ? (
        <>
          <Form.Item label="水平分布">
            <Select value={layout.justify ?? 'left'} options={horizontalJustifyOptions} onChange={(justify) => updateLayout({ justify })} />
          </Form.Item>
          <Form.Item label="垂直位置">
            <Select value={layout.align ?? 'top'} options={verticalAlignOptions} onChange={(align) => updateLayout({ align })} />
          </Form.Item>
        </>
      ) : null}
      {layout.mode === 'grid' ? (
        <>
          <Form.Item label="网格列数">
            <InputNumber min={1} max={12} value={layout.columns} style={{ width: '100%' }} onChange={(columns) => updateLayout({ columns: columns ?? 1 })} />
          </Form.Item>
          <Form.Item label="单元水平位置">
            <Select value={layout.justify ?? 'stretch'} options={gridJustifyOptions} onChange={(justify) => updateLayout({ justify })} />
          </Form.Item>
          <Form.Item label="单元垂直位置">
            <Select value={layout.align ?? 'top'} options={verticalAlignOptions} onChange={(align) => updateLayout({ align })} />
          </Form.Item>
          {Array.from({ length: layout.columns }).map((_, index) => (
            <Form.Item key={index} label={`第 ${index + 1} 列宽度`}>
              <InputNumber
                min={1}
                max={12}
                value={layout.columnWidths?.[index] ?? 1}
                style={{ width: '100%' }}
                onChange={(width) => {
                  const columnWidths = Array.from({ length: layout.columns }, (_item, itemIndex) => layout.columnWidths?.[itemIndex] ?? 1);
                  columnWidths[index] = width ?? 1;
                  updateLayout({ columnWidths });
                }}
              />
            </Form.Item>
          ))}
        </>
      ) : null}
      {layout.mode === 'free' ? (
        <Form.Item label="画布高度">
          <InputNumber min={120} max={1200} value={layout.height ?? 240} style={{ width: '100%' }} onChange={(height) => updateLayout({ height: height ?? 240 })} />
        </Form.Item>
      ) : null}
    </Form>
  );
}

export function SectionInspector(props: InspectorProps) {
  return (
    <div className="inspector-stack">
      <TitleInspector {...props} label="区块标题" />
      <LayoutInspector {...props} />
    </div>
  );
}

export function ModalInspector(props: InspectorProps) {
  return <TitleInspector {...props} label="弹窗标题" />;
}

export function DrawerInspector(props: InspectorProps) {
  return <TitleInspector {...props} label="抽屉标题" />;
}
