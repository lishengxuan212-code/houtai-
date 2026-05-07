import { Empty, Tabs, Typography } from 'antd';
import { ComponentLibraryPanel } from '../components/ComponentLibraryPanel';
import { TemplateLibraryPanel } from '../templates/TemplateLibraryPanel';

export function LibraryDockPanel() {
  return (
    <div className="workbench-left-bottom">
      <Tabs
        size="small"
        defaultActiveKey="library"
        items={[
          { key: 'library', label: '元件库', children: <ComponentLibraryPanel /> },
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
