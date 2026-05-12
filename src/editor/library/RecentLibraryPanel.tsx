import { Button, Empty, Tooltip, Typography } from 'antd';
import { useState } from 'react';
import { antdLibraryManifest } from '../../registry/antdManifest';
import {
  clearRecentLibraryItems,
  listComponentPresets,
  listRecentLibraryItems,
  recordRecentLibraryItem,
  toggleRecentLibraryFavorite,
} from '../../store/componentLibraryStore';
import { useProjectStore } from '../../store/projectStore';
import { componentPresetToTemplate } from '../../templates/templateOperations';
import { listUserTemplates } from '../../templates/templateStorage';
import { useTemplateActions } from '../templates/useTemplateActions';
import { AntdComponentStaticPreview } from '../../registry/antdPreviewRenderers';

function componentLabel(sourceId: string): string {
  const key = sourceId.startsWith('pro.') ? sourceId.slice(4) : sourceId;
  const descriptor = antdLibraryManifest.find((item) => item.key === key && (sourceId.startsWith('pro.') ? item.source === 'pro-components' : item.source !== 'pro-components'));
  return descriptor?.nameZh ?? sourceId;
}

function componentDescriptor(sourceId: string) {
  const key = sourceId.startsWith('pro.') ? sourceId.slice(4) : sourceId;
  return antdLibraryManifest.find((item) => item.key === key && (sourceId.startsWith('pro.') ? item.source === 'pro-components' : item.source !== 'pro-components'));
}

export function RecentLibraryPanel() {
  const [refreshKey, setRefreshKey] = useState(0);
  const addComponent = useProjectStore((state) => state.addComponent);
  const { useTemplate: applyTemplate } = useTemplateActions();
  const items = listRecentLibraryItems();
  const templates = listUserTemplates();
  const presets = listComponentPresets();
  const refresh = () => setRefreshKey((value) => value + 1);
  void refreshKey;

  const reuse = (item: (typeof items)[number]) => {
    if (item.kind === 'antDesignComponent' || item.kind === 'proComponent' || item.kind === 'prototypeWidget' || item.kind === 'userComponent') {
      recordRecentLibraryItem({ kind: item.kind, sourceId: item.sourceId, name: componentLabel(item.sourceId), category: item.category, description: item.description });
      addComponent(item.sourceId);
      refresh();
      return;
    }
    const template = templates.find((candidate) => candidate.id === item.sourceId);
    if (template) {
      applyTemplate(template);
      refresh();
      return;
    }
    const preset = presets.find((candidate) => candidate.id === item.sourceId);
    if (preset) {
      applyTemplate({ ...componentPresetToTemplate(preset), id: preset.id });
      refresh();
    }
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
          return (
            <div className="recent-icon-tile" key={item.id}>
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
              <button className="recent-preview-button" type="button" onClick={() => reuse(item)}>
                {descriptor ? <AntdComponentStaticPreview component={descriptor} /> : <div className="axure-preview axure-preview-panel"><span /><span /></div>}
              </button>
              <Typography.Text className="recent-icon-title">{item.name}</Typography.Text>
            </div>
          );
        })}
      </div>
    </div>
  );
}
