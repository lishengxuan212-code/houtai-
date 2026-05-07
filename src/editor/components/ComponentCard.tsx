import { Button, Tag, Tooltip, Typography } from 'antd';
import type { LibraryComponentDescriptor } from '../../registry/antdManifest';
import { AntdComponentStaticPreview } from '../../registry/antdPreviewRenderers';

export function ComponentCard({ component, onAdd, onInspect }: { component: LibraryComponentDescriptor; onAdd: (type: string) => void; onInspect?: (component: LibraryComponentDescriptor) => void }) {
  const disabled = !component.draggable || !component.enabled;
  const componentType = component.source === 'pro-components' ? `pro.${component.key}` : component.key;
  const status = component.draggable ? '可拖入' : component.renderKind === 'system' ? '系统类' : component.renderKind === 'feedbackAction' ? '动作类' : '不可拖入';
  return (
    <div className={disabled ? 'component-card disabled' : 'component-card'} onClick={() => onInspect?.(component)}>
      <div className="component-card-preview">
        <AntdComponentStaticPreview component={component} />
      </div>
      <div className="component-card-title">
        <Typography.Text strong>{component.nameZh}</Typography.Text>
        <Typography.Text type="secondary">{component.nameEn}</Typography.Text>
      </div>
      <div className="component-card-meta">
        <Tag>{component.category}</Tag>
        <Tooltip title={component.disabledReason ?? component.description}>
          <Tag color={component.draggable ? 'green' : 'default'}>{status}</Tag>
        </Tooltip>
      </div>
      <Button
        size="small"
        block
        disabled={disabled}
        draggable={!disabled}
        onDragStart={(event) => {
          event.dataTransfer.setData('application/x-admin-component', componentType);
          event.dataTransfer.effectAllowed = 'copy';
        }}
        onClick={() => onAdd(componentType)}
      >
        {component.draggable ? '拖入 / 添加' : '添加'}
      </Button>
    </div>
  );
}
