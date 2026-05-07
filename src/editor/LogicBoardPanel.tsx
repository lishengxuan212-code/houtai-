import { Empty, Typography } from 'antd';
import { useProjectStore } from '../store/projectStore';
import { nodeName, resultText, triggerText } from './interactionSummary';

export function LogicBoardPanel() {
  const project = useProjectStore((state) => state.project);
  const interactions = project.interactions.filter((interaction) => interaction.enabled);

  if (interactions.length === 0) return <Empty description="暂无已配置的逻辑" />;

  return (
    <div className="logic-board">
      {interactions.map((interaction) => (
        <div className="logic-card" key={interaction.id}>
          <Typography.Text strong>
            {nodeName(project, interaction.trigger.componentId)} {triggerText(interaction.trigger.event)}
          </Typography.Text>
          <div className="logic-flow simple">
            {interaction.actions.map((action, index) => (
              <span key={`${interaction.id}_${index}`}>{resultText(project, action)}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
