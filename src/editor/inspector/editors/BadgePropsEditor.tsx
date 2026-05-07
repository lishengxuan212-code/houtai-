import { InputNumber, Space, Switch } from 'antd';
import type { JsonRecord, JsonValue } from '../../../domain/types';

function toBadge(value: JsonValue | undefined): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : {};
}

export function BadgePropsEditor({ value, onChange }: { value: JsonValue | undefined; onChange: (value: JsonRecord) => void }) {
  const badge = toBadge(value);
  const enabled = typeof badge.enabled === 'boolean' ? badge.enabled : false;
  const count = typeof badge.count === 'number' ? badge.count : 0;
  const dot = typeof badge.dot === 'boolean' ? badge.dot : false;
  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Switch checked={enabled} checkedChildren="显示" unCheckedChildren="隐藏" onChange={(next) => onChange({ ...badge, enabled: next })} />
      <InputNumber aria-label="徽标数字" min={0} value={count} onChange={(next) => onChange({ ...badge, count: next ?? 0 })} />
      <Switch checked={dot} checkedChildren="小红点" unCheckedChildren="数字" onChange={(next) => onChange({ ...badge, dot: next })} />
    </Space>
  );
}
