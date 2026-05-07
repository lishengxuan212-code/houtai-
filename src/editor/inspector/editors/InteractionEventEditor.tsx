import { Select, Space, Typography } from 'antd';

const actionOptions = [
  { label: '无动作', value: 'none' },
  { label: '打开弹窗', value: 'openModal' },
  { label: '跳转页面', value: 'navigate' },
  { label: '显示提示', value: 'showMessage' },
  { label: '刷新表格', value: 'refreshData' },
  { label: '设置变量', value: 'setVariable' },
];

export function InteractionEventEditor({ label }: { label: string }) {
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Select aria-label={label} value="none" options={actionOptions} />
      <Typography.Text type="secondary">通过交互面板保存为项目交互，不写入组件参数。</Typography.Text>
    </Space>
  );
}
