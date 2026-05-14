import { Button, Input, Space } from 'antd';
import { useState } from 'react';
import { exportMarkdownPrd } from '../export/markdownPrd';
import { useProjectStore } from '../store/projectStore';

export function ExportPanel() {
  const project = useProjectStore((state) => state.project);
  const [markdown, setMarkdown] = useState('');

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Button onClick={() => setMarkdown(exportMarkdownPrd(project))}>生成 PRD</Button>
      <Button onClick={() => void navigator.clipboard?.writeText(markdown)} disabled={!markdown}>
        复制 Markdown
      </Button>
      <Input.TextArea rows={18} value={markdown} readOnly placeholder="点击生成 PRD 后显示 Markdown" />
    </Space>
  );
}
