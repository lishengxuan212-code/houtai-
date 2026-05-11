import { Collapse, Input, InputNumber, Space, Switch, Typography } from 'antd';
import { ensureNodeCanvas } from '../../domain/canvas';
import type { ComponentNode, NodeCanvasConfig } from '../../domain/types';
import { useProjectStore } from '../../store/projectStore';

type Props = {
  pageId: string;
  node: ComponentNode;
};

type CanvasNumberKey = 'x' | 'y' | 'width' | 'height' | 'zIndex';

function numberValue(value: string | number | null, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function InspectorStatePanel({ pageId, node }: Props) {
  const apply = useProjectStore((state) => state.apply);
  const canvas = ensureNodeCanvas(node).canvas as NodeCanvasConfig;
  const editorVisible = !canvas.hidden;
  const previewInitialVisible = node.runtime?.initialVisible ?? true;
  const previewInitialEnabled = !(node.runtime?.initialDisabled ?? false);

  function updateCanvas(key: CanvasNumberKey, value: string | number | null) {
    apply({ type: 'updateNodeCanvas', pageId, nodeId: node.id, canvas: { [key]: numberValue(value, canvas[key]) } });
  }

  function updateName(name: string) {
    apply({ type: 'updateNodeName', pageId, nodeId: node.id, name });
    apply({ type: 'updateNodeSemantic', pageId, nodeId: node.id, semantic: { moduleName: name } });
  }

  return (
    <Collapse
      size="small"
      defaultActiveKey={['state']}
      items={[
        {
          key: 'state',
          label: '状态',
          children: (
            <Space orientation="vertical" size={12} style={{ width: '100%' }}>
              <label>
                <Typography.Text type="secondary">组件名称</Typography.Text>
                <Input aria-label="inspector-component-name" value={node.name} onChange={(event) => updateName(event.target.value)} />
              </label>
              <Space size={8} wrap style={{ width: '100%' }}>
                <label>
                  <Typography.Text type="secondary">X</Typography.Text>
                  <InputNumber aria-label="inspector-x" value={canvas.x} onChange={(value) => updateCanvas('x', value)} />
                </label>
                <label>
                  <Typography.Text type="secondary">Y</Typography.Text>
                  <InputNumber aria-label="inspector-y" value={canvas.y} onChange={(value) => updateCanvas('y', value)} />
                </label>
                <label>
                  <Typography.Text type="secondary">W</Typography.Text>
                  <InputNumber aria-label="inspector-width" min={1} value={canvas.width} onChange={(value) => updateCanvas('width', value)} />
                </label>
                <label>
                  <Typography.Text type="secondary">H</Typography.Text>
                  <InputNumber aria-label="inspector-height" min={1} value={canvas.height} onChange={(value) => updateCanvas('height', value)} />
                </label>
                <label>
                  <Typography.Text type="secondary">zIndex</Typography.Text>
                  <InputNumber aria-label="inspector-z-index" value={canvas.zIndex} onChange={(value) => updateCanvas('zIndex', value)} />
                </label>
              </Space>
              <Space orientation="vertical" size={8}>
                <Switch
                  aria-label="inspector-locked"
                  checked={Boolean(canvas.locked)}
                  checkedChildren="已锁定"
                  unCheckedChildren="未锁定"
                  onChange={(locked) => apply({ type: 'setNodeCanvasLocked', pageId, nodeId: node.id, locked })}
                />
                <Switch
                  aria-label="inspector-editor-visible"
                  checked={editorVisible}
                  checkedChildren="编辑器可见"
                  unCheckedChildren="编辑器隐藏"
                  onChange={(visible) => apply({ type: 'setNodeCanvasHidden', pageId, nodeId: node.id, hidden: !visible })}
                />
                <Switch
                  aria-label="inspector-preview-initial-visible"
                  checked={previewInitialVisible}
                  checkedChildren="预览可见"
                  unCheckedChildren="预览隐藏"
                  onChange={(initialVisible) => apply({ type: 'updateNodeRuntime', pageId, nodeId: node.id, runtime: { initialVisible } })}
                />
                <Switch
                  aria-label="inspector-preview-initial-enabled"
                  checked={previewInitialEnabled}
                  checkedChildren="预览启用"
                  unCheckedChildren="预览禁用"
                  onChange={(enabled) => apply({ type: 'updateNodeRuntime', pageId, nodeId: node.id, runtime: { initialDisabled: !enabled } })}
                />
              </Space>
            </Space>
          ),
        },
      ]}
    />
  );
}
