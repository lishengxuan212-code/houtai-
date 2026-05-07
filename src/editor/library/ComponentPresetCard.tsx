import { Card, Typography } from 'antd';
import type { ComponentPreset } from '../../registry/types/componentPreset';

export function ComponentPresetCard({ preset }: { preset: ComponentPreset }) {
  return (
    <Card size="small">
      <Typography.Text strong>{preset.name}</Typography.Text>
      <Typography.Paragraph type="secondary">{preset.baseComponentType}</Typography.Paragraph>
    </Card>
  );
}
