import { Button, Input, Space, Tree, Typography } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { ArrowDown, ArrowUp, Eye, EyeOff, Lock, PencilLine, SendToBack, Unlock } from 'lucide-react';
import { useMemo, useState, type DragEvent } from 'react';
import { sortNodesByZIndex } from '../../domain/canvas';
import type { ComponentNode } from '../../domain/types';
import { componentLabel } from '../../registry/componentLabels';
import { useProjectStore } from '../../store/projectStore';

function nodeTitle(node: ComponentNode): string {
  return `${node.name} (${componentLabel(node.type)})`;
}

export function PageOutlinePanel() {
  const [query, setQuery] = useState('');
  const [draggedLayerId, setDraggedLayerId] = useState<string | undefined>();
  const project = useProjectStore((state) => state.project);
  const currentPageId = useProjectStore((state) => state.currentPageId);
  const currentFrameId = useProjectStore((state) => state.currentFrameId);
  const selectedNodeId = useProjectStore((state) => state.selectedNodeId);
  const selectNode = useProjectStore((state) => state.selectNode);
  const apply = useProjectStore((state) => state.apply);
  const bringSelectedToFront = useProjectStore((state) => state.bringSelectedToFront);
  const sendSelectedToBack = useProjectStore((state) => state.sendSelectedToBack);
  const moveSelectedForward = useProjectStore((state) => state.moveSelectedForward);
  const moveSelectedBackward = useProjectStore((state) => state.moveSelectedBackward);
  const renameSelectedNode = useProjectStore((state) => state.renameSelectedNode);
  const reorderLayerStack = useProjectStore((state) => state.reorderLayerStack);
  const page = project.pages.find((item) => item.id === currentPageId);
  const frameId =
    currentFrameId ??
    (selectedNodeId ? page?.nodes[selectedNodeId]?.canvas?.parentFrameId : undefined) ??
    Object.values(page?.nodes ?? {}).find((node) => node.canvas?.parentFrameId)?.canvas?.parentFrameId ??
    page?.frames?.[0]?.id;

  const treeData = useMemo<DataNode[]>(() => {
    if (!page) return [];
    const build = (nodeId: string): DataNode | undefined => {
      const node = page.nodes[nodeId];
      if (!node) return undefined;
      const title = nodeTitle(node);
      const children = node.children?.map(build).filter((item): item is DataNode => Boolean(item));
      if (query && !title.toLowerCase().includes(query.toLowerCase()) && !children?.length) return undefined;
      return { key: node.id, title, ...(children?.length ? { children } : {}) };
    };
    const root = build(page.rootNodeId);
    return root ? [root] : [];
  }, [page, query]);

  const layers = useMemo(() => {
    if (!page || !frameId) return [];
    return sortNodesByZIndex(
      Object.values(page.nodes).filter((node) => node.id !== page.rootNodeId && node.canvas?.parentFrameId === frameId),
    ).reverse();
  }, [frameId, page]);

  function setLocked(node: ComponentNode, locked: boolean) {
    if (!page) return;
    apply({ type: 'setNodeCanvasLocked', pageId: page.id, nodeId: node.id, locked });
  }

  function setHidden(node: ComponentNode, hidden: boolean) {
    if (!page) return;
    apply({ type: 'setNodeCanvasHidden', pageId: page.id, nodeId: node.id, hidden });
  }

  function dropLayer(event: DragEvent<HTMLDivElement>, targetNodeId: string) {
    event.preventDefault();
    if (!draggedLayerId || draggedLayerId === targetNodeId || !frameId) return;
    const bottomToTop = [...layers].reverse().map((node) => node.id);
    const withoutDragged = bottomToTop.filter((nodeId) => nodeId !== draggedLayerId);
    const targetIndex = withoutDragged.indexOf(targetNodeId);
    if (targetIndex < 0) return;
    withoutDragged.splice(targetIndex + 1, 0, draggedLayerId);
    reorderLayerStack(withoutDragged, frameId);
    setDraggedLayerId(undefined);
  }

  return (
    <div className="panel-section">
      <Typography.Text strong>组件大纲</Typography.Text>
      <Input.Search allowClear placeholder="搜索组件" value={query} onChange={(event) => setQuery(event.target.value)} />
      <Tree blockNode defaultExpandAll selectedKeys={selectedNodeId ? [selectedNodeId] : []} treeData={treeData} onSelect={(keys) => selectNode(String(keys[0] ?? page?.rootNodeId))} />

      <div className="layer-panel-heading">
        <Typography.Text strong>图层</Typography.Text>
        <Space size={4}>
          <Button aria-label="bring-selected-front" size="small" icon={<ArrowUp size={14} />} onClick={bringSelectedToFront} />
          <Button aria-label="move-selected-forward" size="small" icon={<PencilLine size={14} />} onClick={moveSelectedForward} />
          <Button aria-label="move-selected-backward" size="small" icon={<SendToBack size={14} />} onClick={moveSelectedBackward} />
          <Button aria-label="send-selected-back" size="small" icon={<ArrowDown size={14} />} onClick={sendSelectedToBack} />
        </Space>
      </div>
      <div className="layer-list">
        {layers.map((node) => {
          const locked = Boolean(node.canvas?.locked);
          const hidden = Boolean(node.canvas?.hidden);
          const selected = selectedNodeId === node.id;
          return (
            <div
              key={node.id}
              data-testid={`layer-row-${node.id}`}
              className={`layer-row${selected ? ' active' : ''}${hidden ? ' hidden' : ''}`}
              draggable
              onClick={() => selectNode(node.id)}
              onDragStart={() => setDraggedLayerId(node.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => dropLayer(event, node.id)}
            >
              <Input
                size="small"
                value={node.name}
                aria-label={`rename-layer-${node.id}`}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => {
                  selectNode(node.id);
                  renameSelectedNode(event.target.value);
                }}
              />
              <span className="layer-type">{componentLabel(node.type)}</span>
              <Button
                aria-label={`${locked ? 'unlock' : 'lock'}-layer-${node.id}`}
                size="small"
                icon={locked ? <Unlock size={14} /> : <Lock size={14} />}
                onClick={(event) => {
                  event.stopPropagation();
                  setLocked(node, !locked);
                }}
              />
              <Button
                aria-label={`${hidden ? 'show' : 'hide'}-layer-${node.id}`}
                size="small"
                icon={hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                onClick={(event) => {
                  event.stopPropagation();
                  setHidden(node, !hidden);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
