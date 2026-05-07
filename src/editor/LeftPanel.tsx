import { Button, Tabs, Tooltip } from 'antd';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { ComponentPalette } from './ComponentPalette';
import { PageTree } from './PageTree';

type LeftPanelProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function LeftPanel({ collapsed, onToggle }: LeftPanelProps) {
  if (collapsed) {
    return (
      <aside className="left-panel floating-panel collapsed-panel">
        <Tooltip title="展开左侧面板" placement="right">
          <Button type="primary" icon={<PanelLeftOpen size={16} />} onClick={onToggle} />
        </Tooltip>
      </aside>
    );
  }

  return (
    <aside className="left-panel floating-panel">
      <div className="floating-panel-header">
        <span>工作区</span>
        <Tooltip title="收起左侧面板">
          <Button size="small" icon={<PanelLeftClose size={15} />} onClick={onToggle} />
        </Tooltip>
      </div>
      <Tabs
        defaultActiveKey="pages"
        items={[
          { key: 'pages', label: '项目', children: <PageTree /> },
          { key: 'components', label: '组件', children: <ComponentPalette /> },
          { key: 'templates', label: '模板', children: <ComponentPalette /> },
        ]}
      />
    </aside>
  );
}
