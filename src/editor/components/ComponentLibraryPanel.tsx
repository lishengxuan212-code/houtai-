import { Button, Empty, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { LibraryComponentDescriptor } from '../../registry/antdManifest';
import { antdLibraryManifest, filterLibraryComponents } from '../../registry/antdManifest';
import { getActiveComponentLibraryGroupLabel, saveActiveComponentLibraryGroupLabel } from '../../store/componentLibraryStore';
import { useProjectStore } from '../../store/projectStore';
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
  { label: '基本元件', match: (component) => ['Rectangle', 'VisualBlock', 'WhitePanel', 'Circle', 'Button', 'MuiButton', 'H1', 'H2', 'H3', 'PageTitle', 'ModuleTitle', 'StatusLabel', 'BodyText', 'HelperText', 'LinkText', 'DividerWidget', 'Line', 'ImageWidget', 'Placeholder', 'HotZone'].includes(component.key) },
  { label: '表单元件', match: (component) => ['Input', 'MuiTextField', 'TextareaAutosize', 'MuiTextareaAutosize', 'Select', 'MuiSelect', 'ListBox', 'Checkbox', 'MuiCheckbox', 'Radio', 'MuiRadioGroup', 'Switch', 'MuiSwitch', 'InputNumber', 'DatePicker', 'TimePicker', 'MuiDateTimePickers', 'Slider', 'MuiSlider', 'Rate', 'MuiRating', 'Upload', 'TreeSelect', 'Cascader', 'AutoComplete', 'MuiAutocomplete', 'ColorPicker', 'Transfer', 'MuiTransferList', 'Form', 'ProForm'].includes(component.key) },
  { label: '菜单和表格', match: (component) => ['Menu', 'MuiMenu', 'Dropdown', 'Tabs', 'MuiTabs', 'Table', 'MuiTable', 'ProTable', 'EditableProTable', 'List', 'MuiList', 'Tree', 'MuiTreeView', 'Pagination', 'MuiPagination', 'Steps', 'MuiStepper', 'Breadcrumb', 'MuiBreadcrumbs', 'Anchor', 'MuiBottomNavigation', 'MuiSpeedDial'].includes(component.key) },
  { label: '容器和面板', match: (component) => ['Accordion', 'MuiAccordion', 'Card', 'MuiCard', 'PageContainer', 'MuiContainer', 'MuiBox', 'MuiPaper', 'ProCard', 'ProLayout', 'Layout', 'Flex', 'Grid', 'MuiGrid', 'MuiGridLegacy', 'Row', 'Col', 'Space', 'MuiStack', 'Divider', 'Section', 'Collapse', 'Splitter', 'Masonry', 'MuiMasonry', 'ImageList', 'MuiImageList'].includes(component.key) },
  { label: '反馈和弹层', match: (component) => ['Modal', 'MuiModal', 'MuiDialog', 'Drawer', 'MuiDrawer', 'Alert', 'MuiAlert', 'Message', 'Notification', 'MuiSnackbar', 'Popconfirm', 'Popover', 'MuiPopover', 'MuiPopper', 'Tooltip', 'MuiTooltip', 'Result', 'Spin', 'Progress', 'MuiProgress', 'Skeleton', 'MuiSkeleton', 'MuiBackdrop', 'Watermark', 'Tour'].includes(component.key) },
  { label: '数据展示', match: (component) => ['Avatar', 'MuiAvatar', 'Badge', 'MuiBadge', 'BadgePill', 'Tag', 'MuiChip', 'Statistic', 'Descriptions', 'ProDescriptions', 'Timeline', 'MuiTimeline', 'Calendar', 'Carousel', 'Empty', 'Image', 'QRCode', 'Segmented', 'MuiToggleButton', 'Typography', 'MuiTypography', 'AmountText', 'NumericText', 'TimeText'].includes(component.key) },
  { label: '图标和媒体', match: (component) => ['Icon', 'IconWidget', 'MuiIcons', 'MuiMaterialIcons', 'ImageWidget', 'Image', 'MuiImageList', 'QRCode'].includes(component.key) },
  { label: '系统能力', match: (component) => ['Affix', 'BackTop', 'FloatButton', 'FloatButton.Group', 'FloatButton.BackTop', 'MuiFab', 'MuiLoadingButton', 'App', 'MuiAppBar', 'ConfigProvider', 'theme', 'Util', 'MuiClickAwayListener', 'MuiCssBaseline', 'MuiNoSsr', 'MuiPortal', 'MuiTransitions', 'MuiUseMediaQuery'].includes(component.key) },
  { label: 'MUI', match: (component) => component.source === 'mui' },
];

function groupComponents(group: LibraryGroup, components: LibraryComponentDescriptor[]) {
  return components.filter(group.match);
}

export function ComponentLibraryPanel() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [groupLabel, setGroupLabel] = useState(() => {
    const saved = getActiveComponentLibraryGroupLabel();
    return saved && libraryGroups.some((group) => group.label === saved) ? saved : libraryGroups[0]!.label;
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const addComponent = useProjectStore((state) => state.addComponent);
  const allComponents = useMemo(
    () => {
      void refreshKey;
      return measureMetric('componentLibrarySearch', () => filterLibraryComponents(antdLibraryManifest, { query: debouncedQuery }));
    },
    [debouncedQuery, refreshKey],
  );
  const activeGroup = libraryGroups.find((group) => group.label === groupLabel) ?? libraryGroups[0]!;
  const visibleComponents = useMemo(
    () => (debouncedQuery.trim() ? allComponents : groupComponents(activeGroup, allComponents)).slice(0, MAX_VISIBLE_COMPONENTS),
    [activeGroup, allComponents, debouncedQuery],
  );

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const refresh = () => setRefreshKey((value) => value + 1);
    window.addEventListener('component-library-state-change', refresh);
    return () => window.removeEventListener('component-library-state-change', refresh);
  }, []);

  return (
    <div className="component-library-panel">
      <ComponentSearch value={query} onChange={setQuery} />
      <div className="component-library-body vertical">
        <div className="component-library-categories" data-testid="component-library-category-list">
          <Typography.Text type="secondary">组件分类</Typography.Text>
          <div className="component-category-buttons">
            {libraryGroups.map((group) => (
              <Button
                key={group.label}
                block
                aria-label={group.label}
                type={group.label === groupLabel ? 'primary' : 'text'}
                onClick={() => {
                  setGroupLabel(group.label);
                  saveActiveComponentLibraryGroupLabel(group.label);
                }}
              >
                {group.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="component-library-detail-list" data-testid="component-library-detail-list">
          <Typography.Text type="secondary">详细组件</Typography.Text>
          <div className="component-library-grid vertical">
            {visibleComponents.map((component) => (
              <ComponentCard key={`${component.source}-${component.key}`} component={component} onAdd={addComponent} />
            ))}
            {visibleComponents.length === 0 ? <Empty description="没有找到组件" /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
