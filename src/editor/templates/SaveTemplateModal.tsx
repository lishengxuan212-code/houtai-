import { Button, Checkbox, Form, Input, Modal, Radio, Select } from 'antd';
import { useEffect } from 'react';
import { recordRecentLibraryItem } from '../../store/componentLibraryStore';
import { useProjectStore } from '../../store/projectStore';
import { createTemplateFromSelection, saveUserTemplate } from '../../templates/templateOperations';
import type { UserTemplate, UserTemplateType } from '../../templates/userTemplateTypes';

type TemplateFormValues = {
  name: string;
  type: UserTemplateType;
  category: string;
  description?: string;
  includeProps: boolean;
  includeContent: boolean;
  includeData: boolean;
  includeInternalInteractions: boolean;
  includeExternalReferences: boolean;
};

function recentKindForTemplate(type: UserTemplateType) {
  if (type === 'page' || type === 'pageFrame' || type === 'canvasBoard') return 'pageTemplate' as const;
  if (type === 'group') return 'groupTemplate' as const;
  if (type === 'componentPreset') return 'componentPreset' as const;
  return 'componentTemplate' as const;
}

export function SaveTemplateModal({ open, onClose, templateToUpdate }: { open: boolean; onClose: () => void; templateToUpdate?: UserTemplate }) {
  const project = useProjectStore((state) => state.project);
  const currentPageId = useProjectStore((state) => state.currentPageId);
  const currentFrameId = useProjectStore((state) => state.currentFrameId);
  const selectedNodeId = useProjectStore((state) => state.selectedNodeId);
  const [form] = Form.useForm<TemplateFormValues>();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      name: templateToUpdate?.name ?? '我的模板',
      type: templateToUpdate?.type ?? 'component',
      category: templateToUpdate?.category ?? '常用',
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
          const rootNodeId = values.type === 'page' ? page?.rootNodeId : values.type === 'pageFrame' || values.type === 'canvasBoard' ? page?.rootNodeId : selectedNodeId;
          if (!page || !rootNodeId) return;
          const template = createTemplateFromSelection(project, currentPageId, rootNodeId, { ...values, ...(currentFrameId ? { frameId: currentFrameId } : {}) });
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
              { label: '页面画板', value: 'pageFrame' },
              { label: '区块模板', value: 'block' },
              { label: '组合模板', value: 'group' },
              { label: '组件模板', value: 'component' },
              { label: '组件预设', value: 'componentPreset' },
            ]}
          />
        </Form.Item>
        <Form.Item name="category" label="分类">
          <Select options={['常用', '订单', '表单', '审批', '数据看板', '自定义'].map((value) => ({ value, label: value }))} />
        </Form.Item>
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
