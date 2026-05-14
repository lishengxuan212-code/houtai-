import { Tabs } from 'antd';
import { useWorkbenchUiStore } from '../../store/editorStores';
import { DataPanel } from '../DataPanel';
import { InteractionPanel } from '../InteractionPanel';
import { PropertyPanel } from '../PropertyPanel';

export function RightInspectorPanel() {
  const activeTab = useWorkbenchUiStore((state) => state.rightInspectorTab);
  const setActiveTab = useWorkbenchUiStore((state) => state.setRightInspectorTab);
  const items = [
    { key: 'props', label: '属性', children: <PropertyPanel showState={false} /> },
    { key: 'interactions', label: '交互', children: <InteractionPanel /> },
    { key: 'data', label: '数据', children: <DataPanel /> },
  ];
  const activeKey = items.some((item) => item.key === activeTab) ? activeTab : 'props';
  return (
    <aside className="workbench-right">
      <Tabs
        size="small"
        activeKey={activeKey}
        onChange={setActiveTab}
        items={items}
      />
    </aside>
  );
}
