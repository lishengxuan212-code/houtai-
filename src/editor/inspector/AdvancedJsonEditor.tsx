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
      <Typography.Text type="secondary">Advanced / Debug JSON</Typography.Text>
      <Input.TextArea rows={8} value={text} onChange={(event) => setText(event.target.value)} />
      {error ? <Alert type="error" message={error} showIcon /> : null}
      <Button
        onClick={() => {
          try {
            const parsed: unknown = JSON.parse(text);
            if (!isJsonRecord(parsed)) {
              setError('JSON must be an object.');
              return;
            }
            setError(undefined);
            onApply(parsed);
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Invalid JSON.');
          }
        }}
      >
        Apply JSON
      </Button>
    </Space>
  );
}
