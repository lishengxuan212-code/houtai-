import { Button, Tabs, Tooltip } from 'antd';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { AiPanel } from './AiPanel';
import { DataPanel } from './DataPanel';
import { ExportPanel } from './ExportPanel';
import { InteractionPanel } from './InteractionPanel';
import { PropertyPanel } from './PropertyPanel';

type RightPanelProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function RightPanel({ collapsed, onToggle }: RightPanelProps) {
  if (collapsed) {
    return (
      <aside className="right-panel floating-panel collapsed-panel">
        <Tooltip title="展开右侧面板" placement="left">
          <Button type="primary" icon={<PanelRightOpen size={16} />} onClick={onToggle} />
        </Tooltip>
      </aside>
    );
  }

  return (
    <aside className="right-panel floating-panel">
      <div className="floating-panel-header">
        <span>配置面板</span>
        <Tooltip title="收起右侧面板">
          <Button size="small" icon={<PanelRightClose size={15} />} onClick={onToggle} />
        </Tooltip>
      </div>
      <Tabs
        defaultActiveKey="props"
        items={[
          { key: 'props', label: '属性', children: <PropertyPanel /> },
          { key: 'interactions', label: '交互', children: <InteractionPanel /> },
          { key: 'data', label: '数据', children: <DataPanel /> },
          { key: 'ai', label: 'AI', children: <AiPanel /> },
          { key: 'export', label: '导出', children: <ExportPanel /> },
        ]}
      />
    </aside>
  );
}
