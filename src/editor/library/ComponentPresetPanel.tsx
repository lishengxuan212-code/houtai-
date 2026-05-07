import { Empty, List, Typography } from 'antd';
import { listComponentPresets } from '../../store/componentLibraryStore';

export function ComponentPresetPanel() {
  const presets = listComponentPresets();
  if (presets.length === 0) return <Empty description="暂无组件预设" />;
  return <List size="small" dataSource={presets} renderItem={(preset) => <List.Item><Typography.Text>{preset.name}</Typography.Text></List.Item>} />;
}
