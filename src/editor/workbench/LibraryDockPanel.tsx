import { Empty, Tabs, Typography } from 'antd';
import { useLayoutEffect, useRef } from 'react';
import { useWorkbenchUiStore } from '../../store/editorStores';
import { ComponentLibraryPanel } from '../components/ComponentLibraryPanel';
import { RecentLibraryPanel } from '../library/RecentLibraryPanel';
import { TemplateLibraryPanel } from '../templates/TemplateLibraryPanel';

export function LibraryDockPanel() {
  const activeTab = useWorkbenchUiStore((state) => state.libraryTab);
  const scrollTop = useWorkbenchUiStore((state) => state.libraryScrollTop);
  const setActiveTab = useWorkbenchUiStore((state) => state.setLibraryTab);
  const setScrollTop = useWorkbenchUiStore((state) => state.setLibraryScrollTop);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current?.querySelector<HTMLElement>('.ant-tabs-content-holder');
    if (!element) return undefined;
    element.scrollTop = scrollTop;
    const handleScroll = () => setScrollTop(element.scrollTop);
    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => element.removeEventListener('scroll', handleScroll);
  }, [activeTab, scrollTop, setScrollTop]);

  return (
    <div className="workbench-left-bottom" ref={ref}>
      <Tabs
        size="small"
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'library', label: '组件库', children: <ComponentLibraryPanel /> },
          { key: 'recent', label: '最近使用', children: <RecentLibraryPanel /> },
          {
            key: 'masters',
            label: '母版',
            children: (
              <div className="panel-section">
                <Typography.Text strong>母版</Typography.Text>
                <Empty description="本阶段作为可复用模板处理" />
              </div>
            ),
          },
          { key: 'templates', label: '模板', children: <TemplateLibraryPanel /> },
        ]}
      />
    </div>
  );
}
