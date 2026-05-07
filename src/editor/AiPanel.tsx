import { Alert, Button, List, Tag } from 'antd';
import { useState } from 'react';
import { runAiRules } from '../ai/rules';
import type { AiSuggestion } from '../domain/types';
import { useProjectStore } from '../store/projectStore';

export function AiPanel() {
  const project = useProjectStore((state) => state.project);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
  return (
    <div>
      <Button type="primary" block onClick={() => setSuggestions(runAiRules(project))}>
        检查当前项目
      </Button>
      <Alert style={{ margin: '12px 0' }} type="info" showIcon message="点击按钮后运行规则检查，编辑过程不会自动触发 AI 检查。" />
      <List
        size="small"
        dataSource={suggestions}
        locale={{ emptyText: '点击按钮运行检查' }}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={
                <>
                  <Tag color={item.severity === 'error' ? 'red' : item.severity === 'warning' ? 'orange' : 'blue'}>{item.severity}</Tag>
                  {item.title}
                </>
              }
              description={item.description}
            />
          </List.Item>
        )}
      />
    </div>
  );
}
