import { Button, Form, Input, Modal, Radio, Segmented } from 'antd';
import type { BusinessType } from '../../domain/types';
import { useProjectStore } from '../../store/projectStore';

const businessTypes: { label: string; value: BusinessType }[] = [
  { label: '空白后台', value: 'blank' },
  { label: '电商后台', value: 'ecommerce' },
  { label: 'CRM 后台', value: 'crm' },
  { label: '审批后台', value: 'approval' },
  { label: '内容管理后台', value: 'cms' },
  { label: '用户权限后台', value: 'user_permission' },
  { label: '数据看板后台', value: 'dashboard' },
];

export function NewProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createProject = useProjectStore((state) => state.createProject);
  const [form] = Form.useForm<{ name: string; businessType: BusinessType; template: 'blank' | 'builtin' }>();
  return (
    <Modal title="新建项目" open={open} onCancel={onClose} footer={null} width={560}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{ name: '新后台项目', businessType: 'blank', template: 'blank' }}
        onFinish={(values) => {
          createProject(values);
          onClose();
        }}
      >
        <Form.Item label="项目名称" name="name" rules={[{ required: true, message: '请输入项目名称' }]}>
          <Input placeholder="请输入项目名称" />
        </Form.Item>
        <Form.Item label="项目类型" name="businessType">
          <Radio.Group options={businessTypes} />
        </Form.Item>
        <Form.Item label="创建方式" name="template">
          <Segmented options={[{ label: '从空白创建', value: 'blank' }, { label: '从内置模板创建', value: 'builtin' }]} />
        </Form.Item>
        <div className="modal-actions">
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" htmlType="submit">创建项目</Button>
        </div>
      </Form>
    </Modal>
  );
}
