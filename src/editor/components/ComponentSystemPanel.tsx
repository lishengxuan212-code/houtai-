import { Button, Card, Empty, Input, Select, Space, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import type { LibraryComponentDescriptor, LibrarySource } from '../../registry/antdManifest';
import { antdLibraryManifest } from '../../registry/antdManifest';
import { AntdComponentStaticPreview } from '../../registry/antdPreviewRenderers';
import { getComponentDisplayName, getComponentNameOverrides, restoreComponentNameOverride, saveComponentNameOverride } from '../../store/componentLibraryStore';

function componentTypeOf(component: LibraryComponentDescriptor): string {
  return component.source === 'pro-components' ? `pro.${component.key}` : component.key;
}

const sourceLabels: Record<LibrarySource, string> = {
  system: '基础元件',
  antd: 'Ant Design',
  'ant-design-icons': '图标',
  'pro-components': 'Pro Components',
  mui: 'MUI v7',
};

function sourceLabel(source: LibrarySource) {
  return sourceLabels[source] ?? source;
}

function componentDisplayName(component: LibraryComponentDescriptor, overrides: Record<string, string>) {
  return overrides[componentTypeOf(component)] || getComponentDisplayName(componentTypeOf(component), component.nameZh);
}

export function ComponentSystemPanel() {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [enabled, setEnabled] = useState<string>('all');
  const [overrides, setOverrides] = useState<Record<string, string>>(() => getComponentNameOverrides());
  const [draftNames, setDraftNames] = useState<Record<string, string>>(() => getComponentNameOverrides());

  const components = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return antdLibraryManifest.filter((component) => {
      const type = componentTypeOf(component);
      const displayName = componentDisplayName(component, overrides);
      if (source !== 'all' && component.source !== source) return false;
      if (category !== 'all' && component.category !== category) return false;
      if (enabled !== 'all' && String(component.enabled) !== enabled) return false;
      if (!normalizedQuery) return true;
      return [displayName, component.nameZh, component.nameEn, type].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [category, enabled, overrides, query, source]);

  const sourceStats = useMemo(() => {
    const entries = antdLibraryManifest.reduce<Record<string, number>>((result, component) => {
      const label = sourceLabel(component.source);
      result[label] = (result[label] ?? 0) + 1;
      return result;
    }, {});
    return [{ label: '全部', value: 'all', count: antdLibraryManifest.length }, ...Object.entries(entries).map(([label, count]) => ({ label, value: label, count }))];
  }, []);

  const sourceOptions = [{ label: '全部来源', value: 'all' }, ...Array.from(new Set(antdLibraryManifest.map((item) => item.source))).map((item) => ({ label: sourceLabel(item), value: item }))];
  const categoryOptions = [{ label: '全部分类', value: 'all' }, ...Array.from(new Set(antdLibraryManifest.map((item) => item.category))).map((item) => ({ label: item, value: item }))];
  const enabledOptions = [
    { label: '全部状态', value: 'all' },
    { label: '可使用', value: 'true' },
    { label: '不可使用', value: 'false' },
  ];

  const persistName = (component: LibraryComponentDescriptor) => {
    const type = componentTypeOf(component);
    const nextName = (draftNames[type] ?? component.nameZh).trim();
    saveComponentNameOverride(type, nextName && nextName !== component.nameZh ? nextName : '');
    const nextOverrides = getComponentNameOverrides();
    setOverrides(nextOverrides);
    setDraftNames(nextOverrides);
  };

  const resetName = (component: LibraryComponentDescriptor) => {
    const type = componentTypeOf(component);
    restoreComponentNameOverride(type);
    const nextOverrides = getComponentNameOverrides();
    setOverrides(nextOverrides);
    setDraftNames(nextOverrides);
  };

  return (
    <div className="component-system-panel">
      <div className="component-system-filters">
        <Input placeholder="搜索组件名称 / 英文 / 类型" value={query} onChange={(event) => setQuery(event.target.value)} allowClear />
        <Select value={source} options={sourceOptions} onChange={setSource} />
        <Select value={category} options={categoryOptions} onChange={setCategory} />
        <Select value={enabled} options={enabledOptions} onChange={setEnabled} />
      </div>
      <div className="component-system-body">
        <aside className="component-system-sidebar">
          {sourceStats.map((item) => (
            <button
              className={item.value === 'all' ? 'active' : sourceLabel(source as LibrarySource) === item.value ? 'active' : ''}
              key={item.label}
              type="button"
              onClick={() => setSource(item.value === 'all' ? 'all' : (Object.entries(sourceLabels).find(([, label]) => label === item.value)?.[0] ?? 'all'))}
            >
              <span>{item.label}</span>
              <span>{item.count}</span>
            </button>
          ))}
        </aside>
        <main className="component-system-list">
          {components.length === 0 ? <Empty description="没有找到组件" /> : null}
          {components.map((component) => {
            const type = componentTypeOf(component);
            const displayName = componentDisplayName(component, overrides);
            const draftName = draftNames[type] ?? displayName;
            const changed = draftName.trim() !== displayName;
            return (
              <Card className="component-system-card" key={`${component.source}-${component.key}`}>
                <div className="component-system-card-preview">
                  <AntdComponentStaticPreview component={component} />
                </div>
                <div className="component-system-card-main">
                  <Space size={6} wrap>
                    <Typography.Text strong>{displayName}</Typography.Text>
                    <Tag>{sourceLabel(component.source)}</Tag>
                    <Tag>{component.category}</Tag>
                    {!component.enabled ? <Tag color="red">不可用</Tag> : null}
                  </Space>
                  <Typography.Text type="secondary">{component.nameEn} / {type}</Typography.Text>
                  <Input
                    value={draftName}
                    onChange={(event) => setDraftNames((current) => ({ ...current, [type]: event.target.value }))}
                    onPressEnter={() => persistName(component)}
                    aria-label={`${displayName}名称`}
                  />
                  <Space>
                    <Button size="small" type="primary" disabled={!changed} onClick={() => persistName(component)}>
                      保存名称
                    </Button>
                    <Button size="small" disabled={!overrides[type]} onClick={() => resetName(component)}>
                      恢复默认
                    </Button>
                  </Space>
                </div>
              </Card>
            );
          })}
        </main>
      </div>
    </div>
  );
}
