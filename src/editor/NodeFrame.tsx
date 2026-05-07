import type { MouseEvent, ReactNode } from 'react';
import { useRef } from 'react';
import { Button, Space, Tag } from 'antd';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import type { ComponentNode } from '../domain/types';
import { componentLabel } from '../registry/componentLabels';
import { useProjectStore } from '../store/projectStore';

type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';

const RESIZE_MIN_WIDTH = 80;
const RESIZE_MIN_HEIGHT = 44;

export function NodeFrame({ node, children }: { node: ComponentNode; children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const selectedNodeId = useProjectStore((state) => state.selectedNodeId);
  const currentPageId = useProjectStore((state) => state.currentPageId);
  const apply = useProjectStore((state) => state.apply);
  const selectNode = useProjectStore((state) => state.selectNode);
  const deleteSelectedNode = useProjectStore((state) => state.deleteSelectedNode);
  const moveSelectedNode = useProjectStore((state) => state.moveSelectedNode);
  const reorderNode = useProjectStore((state) => state.reorderNode);
  const selected = selectedNodeId === node.id;
  const compact = !node.children && (node.type === 'Button' || node.type === 'Input' || node.type === 'Select' || node.type === 'Message');

  const startResize = (corner: ResizeCorner) => (event: MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = rect.width;
    const startHeight = rect.height;

    const onMove = (moveEvent: globalThis.MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const width = corner.includes('w') ? startWidth - deltaX : startWidth + deltaX;
      const height = corner.includes('n') ? startHeight - deltaY : startHeight + deltaY;

      apply({
        type: 'updateNodeLayout',
        pageId: currentPageId,
        nodeId: node.id,
        layout: {
          ...node.layout,
          width: Math.max(RESIZE_MIN_WIDTH, Math.round(width)),
          height: Math.max(RESIZE_MIN_HEIGHT, Math.round(height)),
        },
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp, { once: true });
  };

  return (
    <div
      ref={frameRef}
      data-node-id={node.id}
      className={`node-frame${selected ? ' selected' : ''}${compact ? ' compact' : ''}`}
      style={{
        width: node.layout?.width,
        minHeight: node.layout?.height,
      }}
      onClick={(event) => {
        event.stopPropagation();
        selectNode(node.id);
      }}
      draggable
      onDragStart={(event) => {
        event.stopPropagation();
        event.dataTransfer.setData('application/x-node-id', node.id);
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const draggedNodeId = event.dataTransfer.getData('application/x-node-id');
        if (!draggedNodeId) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const parentStyle = window.getComputedStyle(event.currentTarget.parentElement ?? event.currentTarget);
        const isRowLike = parentStyle.display === 'flex' && parentStyle.flexDirection.startsWith('row');
        const position = isRowLike
          ? event.clientX > rect.left + rect.width / 2
            ? 'after'
            : 'before'
          : event.clientY > rect.top + rect.height / 2
            ? 'after'
            : 'before';
        reorderNode(draggedNodeId, node.id, position);
      }}
    >
      <div className="node-toolbar">
        <Space size={6}>
          <Tag color={selected ? 'blue' : 'default'}>{componentLabel(node.type)}</Tag>
          <span>{node.name}</span>
        </Space>
        {selected ? (
          <Space size={4}>
            <Button size="small" icon={<ArrowUp size={14} />} onClick={() => moveSelectedNode('up')} />
            <Button size="small" icon={<ArrowDown size={14} />} onClick={() => moveSelectedNode('down')} />
            <Button size="small" danger icon={<Trash2 size={14} />} onClick={deleteSelectedNode} />
          </Space>
        ) : null}
      </div>
      {children}
      {selected
        ? (['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
            <span
              aria-label={`resize-${corner}`}
              className={`resize-handle ${corner}`}
              key={corner}
              onMouseDown={startResize(corner)}
            />
          ))
        : null}
    </div>
  );
}
