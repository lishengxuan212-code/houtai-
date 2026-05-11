import { Alert, Button, Input, Space, Typography } from 'antd';
import { useState } from 'react';
import type { JsonRecord } from '../../domain/types';

function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function AdvancedJsonEditor({ value, onApply }: { value: JsonRecord; onApply: (props: JsonRecord) => void }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | undefined>();

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Typography.Text type="secondary">高级 / 调试 JSON</Typography.Text>
      <Input.TextArea rows={8} value={text} onChange={(event) => setText(event.target.value)} />
      {error ? <Alert type="error" message={error} showIcon /> : null}
      <Button
        onClick={() => {
          try {
            const parsed: unknown = JSON.parse(text);
            if (!isJsonRecord(parsed)) {
              setError('JSON 必须是对象。');
              return;
            }
            setError(undefined);
            onApply(parsed);
          } catch (caught) {
          setError(caught instanceof Error ? caught.message : '无效 JSON。');
          }
        }}
      >
        应用 JSON
      </Button>
    </Space>
  );
}
