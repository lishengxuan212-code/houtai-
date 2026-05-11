import { Button, Empty, List, Space, Tag, Tooltip, Typography } from 'antd';
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

const kindLabels = {
  antDesignComponent: 'Ant Design',
  proComponent: 'ProComponents',
  prototypeWidget: '原型组件',
  userComponent: '用户组件',
  componentPreset: '组件预设',
  componentTemplate: '组件模板',
  groupTemplate: '组合模板',
  pageTemplate: '页面模板',
};

function componentLabel(sourceId: string): string {
  const key = sourceId.startsWith('pro.') ? sourceId.slice(4) : sourceId;
  const descriptor = antdLibraryManifest.find((item) => item.key === key && (sourceId.startsWith('pro.') ? item.source === 'pro-components' : item.source !== 'pro-components'));
  return descriptor?.nameZh ?? sourceId;
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
      <List
        size="small"
        dataSource={items}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Tooltip key="favorite" title={item.favorite ? '取消收藏' : '收藏'}>
                <Button
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
              </Tooltip>,
              <Button key="reuse" size="small" onClick={() => reuse(item)}>
                使用
              </Button>,
            ]}
          >
            <Space direction="vertical" size={2}>
              <Typography.Text strong>{item.name}</Typography.Text>
              <Space size={4} wrap>
                <Tag>{kindLabels[item.kind]}</Tag>
                {item.category ? <Tag>{item.category}</Tag> : null}
                <Typography.Text type="secondary">使用 {item.useCount} 次</Typography.Text>
                {item.favorite ? <Typography.Text type="secondary">已收藏</Typography.Text> : null}
              </Space>
            </Space>
          </List.Item>
        )}
      />
    </div>
  );
}
