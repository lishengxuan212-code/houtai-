import { Button, Form, InputNumber, Modal, Segmented, Select } from 'antd';
import { useProjectStore } from '../../store/projectStore';
import { listUserTemplates } from '../../templates/templateStorage';
import { WORKBENCH_MODAL_WIDTH } from '../workbench/modalConstants';

type NewProjectForm = {
  template: 'blank' | 'builtin';
  canvasWidth: number;
  canvasHeight: number;
  templateSourceId?: string;
};

export function NewProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createProject = useProjectStore((state) => state.createProject);
  const [form] = Form.useForm<NewProjectForm>();
  const templates = listUserTemplates();
  const selectedTemplateKind = Form.useWatch('template', form);

  return (
    <Modal title="新建项目" open={open} onCancel={onClose} footer={null} width={WORKBENCH_MODAL_WIDTH}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{ template: 'blank', canvasWidth: 1200, canvasHeight: 760 }}
        onFinish={(values) => {
          const selectedTemplate = values.templateSourceId ? templates.find((template) => template.id === values.templateSourceId) : undefined;
          createProject({
            name: selectedTemplate ? `${selectedTemplate.name} 项目` : '新后台项目',
            businessType: 'blank',
            template: values.template,
            canvasWidth: values.canvasWidth,
            canvasHeight: values.canvasHeight,
            ...(values.templateSourceId ? { templateSourceId: values.templateSourceId } : {}),
          });
          onClose();
        }}
      >
        <div className="project-canvas-size-row">
          <Form.Item label="画布宽度" name="canvasWidth" rules={[{ required: true, message: '请输入画布宽度' }]}>
            <InputNumber min={320} max={3840} step={10} addonAfter="px" />
          </Form.Item>
          <Form.Item label="画布高度" name="canvasHeight" rules={[{ required: true, message: '请输入画布高度' }]}>
            <InputNumber min={320} max={2160} step={10} addonAfter="px" />
          </Form.Item>
        </div>
        <Form.Item label="创建方式" name="template">
          <Segmented
            options={[
              { label: '从空白创建', value: 'blank' },
              { label: '从内置模板创建', value: 'builtin', disabled: templates.length === 0 },
            ]}
            onChange={(value) => {
              if (value === 'builtin' && !form.getFieldValue('templateSourceId')) form.setFieldValue('templateSourceId', templates[0]?.id);
            }}
          />
        </Form.Item>
        {selectedTemplateKind === 'builtin' ? (
          <Form.Item label="选择模板" name="templateSourceId" rules={[{ required: true, message: '请选择模板' }]}>
            <Select options={templates.map((template) => ({ label: template.name, value: template.id }))} />
          </Form.Item>
        ) : null}
        <div className="modal-actions">
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" htmlType="submit">创建项目</Button>
        </div>
      </Form>
    </Modal>
  );
}
