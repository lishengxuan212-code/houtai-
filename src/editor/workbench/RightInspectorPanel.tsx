import { Tabs } from 'antd';
import { AiPanel } from '../AiPanel';
import { DataPanel } from '../DataPanel';
import { InteractionPanel } from '../InteractionPanel';
import { PropertyPanel } from '../PropertyPanel';
import { ExportPanel } from '../ExportPanel';

export function RightInspectorPanel() {
  return (
    <aside className="workbench-right">
      <Tabs
        size="small"
        defaultActiveKey="props"
        items={[
          { key: 'props', label: '属性', children: <PropertyPanel /> },
          { key: 'interactions', label: '交互', children: <InteractionPanel /> },
          { key: 'data', label: '数据', children: <DataPanel /> },
          { key: 'ai', label: 'AI 生成', children: <AiPanel /> },
          { key: 'advanced', label: '导出', children: <ExportPanel /> },
        ]}
      />
    </aside>
  );
}
