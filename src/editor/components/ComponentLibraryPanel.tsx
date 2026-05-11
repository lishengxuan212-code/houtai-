import { Button, Empty, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { LibraryComponentDescriptor } from '../../registry/antdManifest';
import { antdLibraryManifest, filterLibraryComponents } from '../../registry/antdManifest';
import { useProjectStore } from '../../store/projectStore';
import { LibraryComponentDetailPanel } from '../library/LibraryComponentDetailPanel';
import { measureMetric } from '../performance/performanceMetrics';
import { ComponentCard } from './ComponentCard';
import { ComponentSearch } from './ComponentSearch';

const SEARCH_DEBOUNCE_MS = 180;
const MAX_VISIBLE_COMPONENTS = 80;

type LibraryGroup = {
  label: string;
  match: (component: LibraryComponentDescriptor) => boolean;
};

const libraryGroups: LibraryGroup[] = [
  { label: '表格', match: (component) => ['Table', 'ProTable', 'EditableProTable'].includes(component.key) },
  { label: '按钮', match: (component) => component.key.includes('Button') || component.key === 'Dropdown' },
  { label: '文字', match: (component) => ['Typography', 'H1', 'H2', 'H3', 'BodyText', 'HelperText', 'LinkText', 'PageTitle', 'ModuleTitle', 'StatusLabel', 'AmountText', 'NumericText', 'TimeText'].includes(component.key) },
  { label: '表单', match: (component) => ['Form', 'ProForm', 'Input', 'InputNumber', 'Select', 'DatePicker', 'TimePicker', 'Radio', 'Checkbox', 'Switch', 'Upload', 'TreeSelect', 'Cascader'].includes(component.key) },
  { label: '导航', match: (component) => ['Menu', 'Tabs', 'Breadcrumb', 'Pagination', 'Steps', 'Anchor'].includes(component.key) },
  { label: '反馈', match: (component) => ['Modal', 'Drawer', 'Alert', 'Message', 'Notification', 'Popconfirm', 'Result', 'Spin', 'Progress', 'Skeleton'].includes(component.key) },
  { label: '容器', match: (component) => ['Card', 'PageContainer', 'ProCard', 'ProLayout', 'Layout', 'Flex', 'Grid', 'Row', 'Col', 'Space', 'Divider', 'Section'].includes(component.key) },
  { label: '视觉复刻', match: (component) => ['VisualBlock', 'WhitePanel', 'BadgePill', 'HeaderBar', 'SideNavBlock', 'TableSkeleton', 'Rectangle', 'Circle', 'Line', 'ImageWidget', 'Placeholder'].includes(component.key) },
];

function groupComponents(group: LibraryGroup, components: LibraryComponentDescriptor[]) {
  return components.filter(group.match);
}

export function ComponentLibraryPanel() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [groupLabel, setGroupLabel] = useState(libraryGroups[0]!.label);
  const [selectedComponent, setSelectedComponent] = useState<LibraryComponentDescriptor | undefined>();
  const addComponent = useProjectStore((state) => state.addComponent);
  const allComponents = useMemo(
    () => measureMetric('componentLibrarySearch', () => filterLibraryComponents(antdLibraryManifest, { query: debouncedQuery })),
    [debouncedQuery],
  );
  const activeGroup = libraryGroups.find((group) => group.label === groupLabel) ?? libraryGroups[0]!;
  const visibleComponents = useMemo(() => groupComponents(activeGroup, allComponents).slice(0, MAX_VISIBLE_COMPONENTS), [activeGroup, allComponents]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [query]);

  return (
    <div className="component-library-panel">
      <ComponentSearch value={query} onChange={setQuery} />
      <div className="component-library-body vertical">
        <div className="component-library-categories" data-testid="component-library-category-list">
          <Typography.Text type="secondary">组件分类</Typography.Text>
          <div className="component-category-buttons">
            {libraryGroups.map((group) => (
              <Button key={group.label} block aria-label={group.label} type={group.label === groupLabel ? 'primary' : 'text'} onClick={() => setGroupLabel(group.label)}>
                {group.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="component-library-detail-list" data-testid="component-library-detail-list">
          <Typography.Text type="secondary">详细组件</Typography.Text>
          <div className="component-library-grid vertical">
            {visibleComponents.map((component) => (
              <ComponentCard key={`${component.source}-${component.key}`} component={component} onAdd={addComponent} onInspect={setSelectedComponent} />
            ))}
            {visibleComponents.length === 0 ? <Empty description="没有找到组件" /> : null}
          </div>
          <LibraryComponentDetailPanel component={selectedComponent} />
        </div>
      </div>
    </div>
  );
}
