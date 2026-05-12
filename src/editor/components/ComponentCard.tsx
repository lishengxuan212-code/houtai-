import { Tooltip, Typography } from 'antd';
import type { DragEvent } from 'react';
import type { LibraryComponentDescriptor } from '../../registry/antdManifest';
import { AntdComponentStaticPreview } from '../../registry/antdPreviewRenderers';
import { getComponentDisplayName, recordRecentLibraryItem } from '../../store/componentLibraryStore';

function componentTypeOf(component: LibraryComponentDescriptor): string {
  return component.source === 'pro-components' ? `pro.${component.key}` : component.key;
}

function recentKind(component: LibraryComponentDescriptor) {
  if (component.source === 'pro-components') return 'proComponent' as const;
  if (component.source === 'system') return 'prototypeWidget' as const;
  return 'antDesignComponent' as const;
}

export function ComponentCard({ component, onAdd, onInspect }: { component: LibraryComponentDescriptor; onAdd: (type: string) => void; onInspect?: (component: LibraryComponentDescriptor) => void }) {
  const disabled = !component.draggable || !component.enabled;
  const componentType = componentTypeOf(component);
  const displayName = getComponentDisplayName(componentType, component.nameZh);
  const recordUse = () =>
    recordRecentLibraryItem({
      kind: recentKind(component),
      sourceId: componentType,
      name: displayName,
      category: component.category,
      description: component.description,
    });
  const addComponent = () => {
    if (disabled) return;
    recordUse();
    onAdd(componentType);
  };
  const startDrag = (event: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    recordUse();
    event.dataTransfer.setData('application/x-admin-component', componentType);
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      className={disabled ? 'component-card axure-tile disabled' : 'component-card axure-tile'}
      role="button"
      tabIndex={disabled ? -1 : 0}
      draggable={!disabled}
      aria-disabled={disabled || undefined}
      aria-label={`添加${displayName}`}
      onClick={() => {
        onInspect?.(component);
        addComponent();
      }}
      onDragStart={startDrag}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        onInspect?.(component);
        addComponent();
      }}
    >
      <Tooltip title={`${displayName} / ${component.nameEn}`}>
        <div className="component-card-preview axure-tile-preview">
          <AntdComponentStaticPreview component={component} />
        </div>
      </Tooltip>
      <div className="component-card-title">
        <Typography.Text>{displayName}</Typography.Text>
      </div>
    </div>
  );
}
