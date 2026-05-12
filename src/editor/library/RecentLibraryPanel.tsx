import { Button, Empty, Tooltip, Typography } from 'antd';
import { useState, type DragEvent } from 'react';
import { antdLibraryManifest } from '../../registry/antdManifest';
import {
  clearRecentLibraryItems,
  getComponentDisplayName,
  listComponentPresets,
  listRecentLibraryItems,
  recordRecentLibraryItem,
  toggleRecentLibraryFavorite,
} from '../../store/componentLibraryStore';
import { listUserTemplates } from '../../templates/templateStorage';
import { AntdComponentStaticPreview } from '../../registry/antdPreviewRenderers';

function isComponentRecentKind(kind: (ReturnType<typeof listRecentLibraryItems>)[number]['kind']) {
  return kind === 'antDesignComponent' || kind === 'proComponent' || kind === 'prototypeWidget' || kind === 'userComponent';
}

function componentLabel(sourceId: string): string {
  const key = sourceId.startsWith('pro.') ? sourceId.slice(4) : sourceId;
  const descriptor = antdLibraryManifest.find((item) => item.key === key && (sourceId.startsWith('pro.') ? item.source === 'pro-components' : item.source !== 'pro-components'));
  return getComponentDisplayName(sourceId, descriptor?.nameZh ?? sourceId);
}

function componentDescriptor(sourceId: string) {
  const key = sourceId.startsWith('pro.') ? sourceId.slice(4) : sourceId;
  return antdLibraryManifest.find((item) => item.key === key && (sourceId.startsWith('pro.') ? item.source === 'pro-components' : item.source !== 'pro-components'));
}

export function RecentLibraryPanel() {
  const [refreshKey, setRefreshKey] = useState(0);
  const items = listRecentLibraryItems();
  const templates = listUserTemplates();
  const presets = listComponentPresets();
  const refresh = () => setRefreshKey((value) => value + 1);
  void refreshKey;

  const recentItemName = (item: (typeof items)[number]) => {
    if (isComponentRecentKind(item.kind)) return componentLabel(item.sourceId);
    const template = templates.find((candidate) => candidate.id === item.sourceId);
    if (template) return template.name;
    const preset = presets.find((candidate) => candidate.id === item.sourceId);
    if (preset) return preset.name;
    return item.name;
  };

  const startDrag = (item: (typeof items)[number]) => (event: DragEvent<HTMLDivElement>) => {
    if (!isComponentRecentKind(item.kind)) return;
    recordRecentLibraryItem({ kind: item.kind, sourceId: item.sourceId, name: recentItemName(item), category: item.category, description: item.description });
    event.dataTransfer.setData('application/x-admin-component', item.sourceId);
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="panel-section">
      <div className="panel-heading">
        <Typography.Text strong>最近使用</Typography.Text>
        <Button
          size="small"
          disabled={items.length === 0}
          onClick={() => {
            clearRecentLibraryItems();
            refresh();
          }}
        >
          清空
        </Button>
      </div>
      {items.length === 0 ? <Empty description="暂无最近使用" /> : null}
      <div className="recent-icon-grid">
        {items.map((item) => {
          const descriptor = componentDescriptor(item.sourceId);
          const draggable = isComponentRecentKind(item.kind);
          const displayName = recentItemName(item);
          return (
            <div className="recent-icon-tile" draggable={draggable} key={item.id} onDragEnd={refresh} onDragStart={startDrag(item)}>
              <Tooltip title={item.favorite ? '取消收藏' : '收藏'}>
                <Button
                  className="recent-favorite"
                  size="small"
                  type="text"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleRecentLibraryFavorite(item.id);
                    refresh();
                  }}
                >
                  {item.favorite ? '★' : '☆'}
                </Button>
              </Tooltip>
              <button className="recent-preview-button" type="button" aria-label={`${displayName}，拖动添加`}>
                {descriptor ? <AntdComponentStaticPreview component={descriptor} /> : <div className="axure-preview axure-preview-panel"><span /><span /></div>}
              </button>
              <Typography.Text className="recent-icon-title">{displayName}</Typography.Text>
            </div>
          );
        })}
      </div>
    </div>
  );
}
