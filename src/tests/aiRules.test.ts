import { describe, expect, it } from 'vitest';
import { runAiRules } from '../ai/rules';
import { initialProject } from '../store/initialProject';

describe('ai rules', () => {
  it('detects multiple MVP issue categories', () => {
    const suggestions = runAiRules(initialProject);
    expect(suggestions.some((item) => item.title === '删除操作缺少二次确认')).toBe(true);
    expect(suggestions.some((item) => item.title === '引用断链')).toBe(true);
    expect(suggestions.some((item) => item.title === '表格操作未绑定交互')).toBe(true);
  });

  it('detects unbound buttons', () => {
    const suggestions = runAiRules(initialProject);
    expect(suggestions.some((item) => item.id.includes('button_export_orders'))).toBe(false);
  });

  it('detects forms without submit when interaction is removed', () => {
    const project = { ...initialProject, interactions: initialProject.interactions.filter((interaction) => interaction.trigger.componentId !== 'node_add_order_form') };
    const suggestions = runAiRules(project);
    expect(suggestions.some((item) => item.id.includes('node_add_order_form'))).toBe(true);
  });
});
