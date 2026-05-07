import { Input, Tree, Typography } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useMemo, useState } from 'react';
import { componentLabel } from '../../registry/componentLabels';
import { useProjectStore } from '../../store/projectStore';

export function PageOutlinePanel() {
  const [query, setQuery] = useState('');
  const project = useProjectStore((state) => state.project);
  const currentPageId = useProjectStore((state) => state.currentPageId);
  const selectedNodeId = useProjectStore((state) => state.selectedNodeId);
  const selectNode = useProjectStore((state) => state.selectNode);
  const page = project.pages.find((item) => item.id === currentPageId);

  const treeData = useMemo<DataNode[]>(() => {
    if (!page) return [];
    const build = (nodeId: string): DataNode | undefined => {
      const node = page.nodes[nodeId];
      if (!node) return undefined;
      const title = `${node.name}（${componentLabel(node.type)}）`;
      const children = node.children?.map(build).filter((item): item is DataNode => Boolean(item));
      if (query && !title.toLowerCase().includes(query.toLowerCase()) && !children?.length) return undefined;
      return { key: node.id, title, ...(children?.length ? { children } : {}) };
    };
    const root = build(page.rootNodeId);
    return root ? [root] : [];
  }, [page, query]);

  return (
    <div className="panel-section">
      <Typography.Text strong>组件大纲</Typography.Text>
      <Input.Search allowClear placeholder="搜索组件名称" value={query} onChange={(event) => setQuery(event.target.value)} />
      <Tree blockNode defaultExpandAll selectedKeys={selectedNodeId ? [selectedNodeId] : []} treeData={treeData} onSelect={(keys) => selectNode(String(keys[0] ?? page?.rootNodeId))} />
    </div>
  );
}
