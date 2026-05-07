import { Button, Input, Popconfirm, Tree, Typography } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { Trash2 } from 'lucide-react';
import { componentLabel } from '../registry/componentLabels';
import { useProjectStore } from '../store/projectStore';
import { InlineTextEditor } from './inlineEdit';

export function PageTree() {
  const project = useProjectStore((state) => state.project);
  const currentPageId = useProjectStore((state) => state.currentPageId);
  const selectedNodeId = useProjectStore((state) => state.selectedNodeId);
  const selectPage = useProjectStore((state) => state.selectPage);
  const selectNode = useProjectStore((state) => state.selectNode);
  const addPage = useProjectStore((state) => state.addPage);
  const renameProject = useProjectStore((state) => state.renameProject);
  const deletePage = useProjectStore((state) => state.deletePage);
  const moveNodeToParent = useProjectStore((state) => state.moveNodeToParent);
  const apply = useProjectStore((state) => state.apply);

  const page = project.pages.find((item) => item.id === currentPageId);
  const canDeletePage = project.pages.length > 1;

  const buildTree = (nodeId: string): DataNode => {
    const node = page?.nodes[nodeId];
    const children = node?.children?.map(buildTree);
    return {
      key: nodeId,
      title: node ? (
        <span className="tree-node-title">
          <InlineTextEditor
            value={node.name}
            stopPropagation={false}
            onCommit={(name) => apply({ type: 'updateNodeName', pageId: currentPageId, nodeId: node.id, name })}
          />
          <span>（{componentLabel(node.type)}）</span>
        </span>
      ) : (
        nodeId
      ),
      ...(children ? { children } : {}),
    };
  };

  return (
    <div className="panel-section">
      <section className="project-settings">
        <Typography.Text strong>项目设置</Typography.Text>
        <Input value={project.name} onChange={(event) => renameProject(event.target.value)} placeholder="项目名称" />
      </section>

      <div className="panel-heading">
        <Typography.Text strong>页面</Typography.Text>
        <Button size="small" onClick={addPage}>
          新建
        </Button>
      </div>
      <div className="page-list">
        {project.pages.map((item) => (
          <div key={item.id} className={item.id === currentPageId ? 'page-row active' : 'page-row'}>
            <button className="page-item" onClick={() => selectPage(item.id)}>
              {item.name}
            </button>
            <Popconfirm
              title="删除当前页面？"
              description="删除后会同时移除该页面中的组件和相关交互。"
              okText="删除"
              cancelText="取消"
              disabled={!canDeletePage}
              onConfirm={() => deletePage(item.id)}
            >
              <Button
                className="page-delete-button"
                size="small"
                danger
                disabled={!canDeletePage}
                icon={<Trash2 size={14} />}
                onClick={(event) => event.stopPropagation()}
              />
            </Popconfirm>
          </div>
        ))}
      </div>
      <Typography.Text strong>结构</Typography.Text>
      {page ? (
        <Tree
          draggable
          blockNode
          selectedKeys={selectedNodeId ? [selectedNodeId] : []}
          defaultExpandAll
          treeData={[buildTree(page.rootNodeId)]}
          onSelect={(keys) => selectNode(String(keys[0] ?? page.rootNodeId))}
          onDrop={(info) => {
            const draggedNodeId = String(info.dragNode.key);
            const targetNodeId = String(info.node.key);
            moveNodeToParent(draggedNodeId, targetNodeId);
            selectNode(draggedNodeId);
          }}
        />
      ) : null}
    </div>
  );
}
