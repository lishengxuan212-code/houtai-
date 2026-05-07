import { Button, Space, Tag, Typography } from 'antd';
import { componentLabel } from '../registry/componentLabels';
import { getAllDescriptors } from '../registry/componentRegistry';
import { useProjectStore } from '../store/projectStore';

const categoryLabels: Record<string, string> = {
  layout: '布局',
  data: '数据',
  form: '表单',
  feedback: '反馈',
  navigation: '导航',
  business: '业务',
};

export function ComponentPalette() {
  const addComponent = useProjectStore((state) => state.addComponent);
  const descriptors = getAllDescriptors().filter((descriptor) => descriptor.type !== 'Message');
  return (
    <div className="panel-section">
      <Typography.Text strong>组件库</Typography.Text>
      <Space direction="vertical" size={8} style={{ width: '100%', marginTop: 12 }}>
        {descriptors.map((descriptor) => (
          <Button key={descriptor.type} block onClick={() => addComponent(descriptor.type)} className="palette-button">
            <span>{componentLabel(descriptor.type)}</span>
            <Tag>{categoryLabels[descriptor.category]}</Tag>
          </Button>
        ))}
      </Space>
    </div>
  );
}
