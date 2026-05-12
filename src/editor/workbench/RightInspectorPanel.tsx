import { Tabs } from 'antd';
import { useWorkbenchUiStore } from '../../store/editorStores';
import { DataPanel } from '../DataPanel';
import { InteractionPanel } from '../InteractionPanel';
import { PropertyPanel } from '../PropertyPanel';
import { ExportPanel } from '../ExportPanel';

export function RightInspectorPanel() {
  const activeTab = useWorkbenchUiStore((state) => state.rightInspectorTab);
  const setActiveTab = useWorkbenchUiStore((state) => state.setRightInspectorTab);
  return (
    <aside className="workbench-right">
      <Tabs
        size="small"
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'props', label: '属性', children: <PropertyPanel /> },
          { key: 'interactions', label: '交互', children: <InteractionPanel /> },
          { key: 'data', label: '数据', children: <DataPanel /> },
          { key: 'advanced', label: '导出', children: <ExportPanel /> },
        ]}
      />
    </aside>
  );
}
