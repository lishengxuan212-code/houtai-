import { Button, Empty, Input, Modal, Select, Space, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { sortNodesByZIndex } from '../../domain/canvas';
import type { ComponentNode } from '../../domain/types';
import { RenderNode } from '../../registry/renderers';
import type { RendererContext } from '../../registry/renderers/rendererTypes';
import { deleteUserTemplate, duplicateUserTemplate, listUserTemplates, renameUserTemplate } from '../../templates/templateOperations';
import type { UserTemplate } from '../../templates/userTemplateTypes';
import { SaveTemplateModal } from './SaveTemplateModal';
import { TemplateCard } from './TemplateCard';
import { useTemplateActions } from './useTemplateActions';

const templateTypes = [
  { label: '全部类型', value: 'all' },
  { label: '组件模板', value: 'component' },
  { label: '页面模板', value: 'page' },
];

const templateCategories = ['全部分类', '客服', '日常', '财务', '自定义'];

function normalizedTemplateType(template: UserTemplate) {
  return template.type === 'page' ? 'page' : 'component';
}

const previewContext: RendererContext = { mode: 'preview' };

function TemplatePreviewNode({ node, nodes }: { node: ComponentNode; nodes: Record<string, ComponentNode> }) {
  const children = sortNodesByZIndex(node.children?.map((childId) => nodes[childId]).filter((child): child is ComponentNode => Boolean(child)) ?? []).map((child) => (
    <TemplatePreviewNode key={child.id} node={child} nodes={nodes} />
  ));
  return (
    <RenderNode node={node} context={previewContext}>
      {children}
    </RenderNode>
  );
}

function TemplatePreview({ template }: { template: UserTemplate }) {
  const nodes = template.content.nodes;
  const root = nodes[template.content.rootNodeId];
  const rootIds = root?.children?.length && root.type === 'PageContainer' && template.type !== 'page' ? root.children : [template.content.rootNodeId];
  const roots = sortNodesByZIndex(rootIds.map((id) => nodes[id]).filter((node): node is ComponentNode => Boolean(node)));
  const canvases = roots.map((node) => node.canvas).filter(Boolean);
  const minX = Math.min(0, ...canvases.map((canvas) => canvas?.x ?? 0));
  const minY = Math.min(0, ...canvases.map((canvas) => canvas?.y ?? 0));
  return (
    <div style={{ minHeight: 420, overflow: 'auto', background: '#f3f6fa', border: '1px solid #e5e7eb', borderRadius: 8, padding: 24 }}>
      <div style={{ position: 'relative', minHeight: 360, background: '#fff', border: '1px solid #dbe4f0' }}>
        {roots.map((node, index) => {
          const canvas = node.canvas;
          return (
            <div
              key={node.id}
              style={{
                position: canvas ? 'absolute' : 'relative',
                left: canvas ? canvas.x - minX : undefined,
                top: canvas ? canvas.y - minY : undefined,
                width: canvas?.width,
                height: canvas?.height,
                zIndex: canvas?.zIndex ?? index,
                margin: canvas ? undefined : 12,
              }}
            >
              <TemplatePreviewNode node={node} nodes={nodes} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TemplateLibraryPanel() {
  const [saveOpen, setSaveOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [renaming, setRenaming] = useState<UserTemplate | undefined>();
  const [renameValue, setRenameValue] = useState('');
  const [updating, setUpdating] = useState<UserTemplate | undefined>();
  const [previewing, setPreviewing] = useState<UserTemplate | undefined>();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('全部分类');
  const { useTemplate } = useTemplateActions();
  const templates: UserTemplate[] = listUserTemplates();
  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return templates.filter((template) => {
      if (typeFilter !== 'all' && normalizedTemplateType(template) !== typeFilter) return false;
      if (categoryFilter !== '全部分类' && template.category !== categoryFilter) return false;
      if (!normalizedQuery) return true;
      return [template.name, template.description ?? '', template.category].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [categoryFilter, query, templates, typeFilter]);
  const refresh = () => setRefreshKey((value) => value + 1);
  void refreshKey;

  return (
    <div className="panel-section">
      <div className="panel-heading">
        <Typography.Text strong>模板库</Typography.Text>
        <Button size="small" onClick={() => setSaveOpen(true)}>保存模板</Button>
      </div>
      <Space direction="vertical" size={8} style={{ width: '100%', marginBottom: 8 }}>
        <Input.Search allowClear placeholder="搜索模板名称、说明或分类" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Space.Compact style={{ width: '100%' }}>
          <Select style={{ width: '50%' }} value={typeFilter} options={templateTypes} onChange={setTypeFilter} />
          <Select style={{ width: '50%' }} value={categoryFilter} options={templateCategories.map((value) => ({ label: value, value }))} onChange={setCategoryFilter} />
        </Space.Compact>
      </Space>
      {templates.length === 0 ? <Empty description="暂无用户模板" /> : null}
      {templates.length > 0 && filteredTemplates.length === 0 ? <Empty description="没有匹配的模板" /> : null}
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onUse={useTemplate}
            onRename={(item) => {
              setRenaming(item);
              setRenameValue(item.name);
            }}
            onDelete={(item) => {
              deleteUserTemplate(item.id);
              refresh();
            }}
            onDuplicate={(item) => {
              duplicateUserTemplate(item.id);
              refresh();
            }}
            onUpdate={(item) => setUpdating(item)}
            onPreview={(item) => setPreviewing(item)}
          />
        ))}
      </Space>
      <SaveTemplateModal open={saveOpen} onClose={() => { setSaveOpen(false); refresh(); }} />
      {updating ? <SaveTemplateModal open templateToUpdate={updating} onClose={() => { setUpdating(undefined); refresh(); }} /> : null}
      <Modal
        title="重命名模板"
        open={Boolean(renaming)}
        onCancel={() => setRenaming(undefined)}
        onOk={() => {
          if (renaming && renameValue.trim()) renameUserTemplate(renaming.id, renameValue.trim());
          setRenaming(undefined);
          refresh();
        }}
      >
        <Input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} />
      </Modal>
      <Modal title={previewing ? `预览：${previewing.name}` : '模板预览'} open={Boolean(previewing)} onCancel={() => setPreviewing(undefined)} footer={null} width={900}>
        {previewing ? <TemplatePreview template={previewing} /> : null}
      </Modal>
    </div>
  );
}
