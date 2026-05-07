import { Button, Checkbox, Form, Input, Modal, Radio, Select } from 'antd';
import { useProjectStore } from '../../store/projectStore';
import { createTemplateFromSelection, saveUserTemplate } from '../../templates/templateOperations';
import type { UserTemplateType } from '../../templates/userTemplateTypes';

export function SaveTemplateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const project = useProjectStore((state) => state.project);
  const currentPageId = useProjectStore((state) => state.currentPageId);
  const selectedNodeId = useProjectStore((state) => state.selectedNodeId);
  const [form] = Form.useForm<{
    name: string;
    type: UserTemplateType;
    category: string;
    description?: string;
    includeInteractions: boolean;
    includeDataSources: boolean;
  }>();
  return (
    <Modal title="保存为模板" open={open} onCancel={onClose} footer={null}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{ name: '我的模板', type: 'component', category: '常用', includeInteractions: true, includeDataSources: true }}
        onFinish={(values) => {
          const page = project.pages.find((item) => item.id === currentPageId);
          const rootNodeId = values.type === 'page' ? page?.rootNodeId : selectedNodeId;
          if (!page || !rootNodeId) return;
          saveUserTemplate(createTemplateFromSelection(project, currentPageId, rootNodeId, values));
          onClose();
        }}
      >
        <Form.Item name="name" label="模板名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="type" label="模板类型">
          <Radio.Group options={[{ label: '页面模板', value: 'page' }, { label: '区块模板', value: 'block' }, { label: '组件模板', value: 'component' }]} />
        </Form.Item>
        <Form.Item name="category" label="分类">
          <Select options={['常用', '订单', '表单', '审批', '数据看板', '自定义'].map((value) => ({ value, label: value }))} />
        </Form.Item>
        <Form.Item name="description" label="说明">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="includeInteractions" valuePropName="checked">
          <Checkbox>包含当前选中内容内的交互</Checkbox>
        </Form.Item>
        <Form.Item name="includeDataSources" valuePropName="checked">
          <Checkbox>包含示例数据</Checkbox>
        </Form.Item>
        <div className="modal-actions">
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" htmlType="submit">保存模板</Button>
        </div>
      </Form>
    </Modal>
  );
}
