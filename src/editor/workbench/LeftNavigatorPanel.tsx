import { Tabs } from 'antd';
import { PageTree } from '../PageTree';
import { PageOutlinePanel } from './PageOutlinePanel';

export function LeftNavigatorPanel() {
  return (
    <div className="workbench-left-top">
      <Tabs
        size="small"
        defaultActiveKey="pages"
        items={[
          { key: 'pages', label: '页面', children: <PageTree /> },
          { key: 'outline', label: '概要', children: <PageOutlinePanel /> },
        ]}
      />
    </div>
  );
}
