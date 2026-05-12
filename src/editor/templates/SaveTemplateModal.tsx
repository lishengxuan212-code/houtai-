import { Button, Checkbox, Form, Input, Modal, Radio, Select } from 'antd';
import { useEffect } from 'react';
import { recordRecentLibraryItem } from '../../store/componentLibraryStore';
import { useProjectStore } from '../../store/projectStore';
import { createTemplateFromSelectedNodes, saveUserTemplate } from '../../templates/templateOperations';
import type { UserTemplate, UserTemplateType } from '../../templates/userTemplateTypes';

type TemplateFormValues = {
  name: string;
  type: UserTemplateType;
  category: string;
  customCategory?: string;
  description?: string;
  includeProps: boolean;
  includeContent: boolean;
  includeData: boolean;
  includeInternalInteractions: boolean;
  includeExternalReferences: boolean;
};

function recentKindForTemplate(type: UserTemplateType) {
  return type === 'page' ? 'pageTemplate' as const : 'componentTemplate' as const;
}

function editableTemplateType(type: UserTemplateType | undefined): UserTemplateType {
  return type === 'page' ? 'page' : 'component';
}

export function SaveTemplateModal({ open, onClose, templateToUpdate }: { open: boolean; onClose: () => void; templateToUpdate?: UserTemplate }) {
  const project = useProjectStore((state) => state.project);
  const currentPageId = useProjectStore((state) => state.currentPageId);
  const currentFrameId = useProjectStore((state) => state.currentFrameId);
  const selectedNodeId = useProjectStore((state) => state.selectedNodeId);
  const selectedNodeIds = useProjectStore((state) => state.selectedNodeIds);
  const [form] = Form.useForm<TemplateFormValues>();
  const category = Form.useWatch('category', form);

  useEffect(() => {
    if (!open) return;
    const sourceCategory = templateToUpdate?.category;
    const knownCategory = sourceCategory && ['客服', '日常', '财务', '自定义'].includes(sourceCategory);
    form.setFieldsValue({
      name: templateToUpdate?.name ?? '我的模板',
      type: editableTemplateType(templateToUpdate?.type),
      category: knownCategory ? sourceCategory : sourceCategory ? '自定义' : '日常',
      ...(sourceCategory && !knownCategory ? { customCategory: sourceCategory } : {}),
      includeProps: templateToUpdate?.saveOptions?.includeProps ?? true,
      includeContent: templateToUpdate?.saveOptions?.includeContent ?? true,
      includeData: templateToUpdate?.saveOptions?.includeData ?? true,
      includeInternalInteractions: templateToUpdate?.saveOptions?.includeInternalInteractions ?? true,
      includeExternalReferences: templateToUpdate?.saveOptions?.includeExternalReferences ?? false,
      ...(templateToUpdate?.description ? { description: templateToUpdate.description } : {}),
    });
  }, [form, open, templateToUpdate]);

  return (
    <Modal title={templateToUpdate ? '更新模板' : '保存为模板'} open={open} onCancel={onClose} footer={null}>
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          const page = project.pages.find((item) => item.id === currentPageId);
          const selectedIds = selectedNodeIds.length ? selectedNodeIds : selectedNodeId ? [selectedNodeId] : [];
          if (!page || (values.type !== 'page' && selectedIds.filter((nodeId) => nodeId !== page.rootNodeId).length === 0)) return;
          const resolvedCategory = values.category === '自定义' ? values.customCategory?.trim() || '自定义' : values.category;
          const template = createTemplateFromSelectedNodes(project, currentPageId, selectedIds, { ...values, category: resolvedCategory, ...(currentFrameId ? { frameId: currentFrameId } : {}) });
          saveUserTemplate(
            templateToUpdate
              ? {
                  ...template,
                  id: templateToUpdate.id,
                  createdAt: templateToUpdate.createdAt,
                  version: templateToUpdate.version + 1,
                }
              : template,
          );
          recordRecentLibraryItem({
            kind: recentKindForTemplate(template.type),
            sourceId: templateToUpdate?.id ?? template.id,
            name: template.name,
            category: template.category,
            description: template.description,
            usedAt: template.updatedAt,
          });
          onClose();
        }}
      >
        <Form.Item name="name" label="模板名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="type" label="模板类型">
          <Radio.Group
            options={[
              { label: '页面模板', value: 'page' },
              { label: '组件模板', value: 'component' },
            ]}
          />
        </Form.Item>
        <Form.Item name="category" label="分类">
          <Select options={['客服', '日常', '财务', '自定义'].map((value) => ({ value, label: value }))} />
        </Form.Item>
        {category === '自定义' ? (
          <Form.Item name="customCategory" label="自定义分类" rules={[{ required: true, message: '请输入自定义分类' }]}>
            <Input placeholder="请输入自定义分类" />
          </Form.Item>
        ) : null}
        <Form.Item name="description" label="说明">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="includeProps" valuePropName="checked">
          <Checkbox>包含属性配置</Checkbox>
        </Form.Item>
        <Form.Item name="includeContent" valuePropName="checked">
          <Checkbox>包含内容配置</Checkbox>
        </Form.Item>
        <Form.Item name="includeData" valuePropName="checked">
          <Checkbox>包含节点数据和示例数据</Checkbox>
        </Form.Item>
        <Form.Item name="includeInternalInteractions" valuePropName="checked">
          <Checkbox>包含模板内部交互</Checkbox>
        </Form.Item>
        <Form.Item name="includeExternalReferences" valuePropName="checked">
          <Checkbox>保留跳转、变量等外部引用</Checkbox>
        </Form.Item>
        <div className="modal-actions">
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" htmlType="submit">{templateToUpdate ? '更新模板' : '保存模板'}</Button>
        </div>
      </Form>
    </Modal>
  );
}
