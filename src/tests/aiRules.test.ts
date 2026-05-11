import { describe, expect, it } from 'vitest';
import { runAiRules, runAiRulesForPage } from '../ai/rules';
import type { Project } from '../domain/types';
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

  it('can scope rule checks to the current page', () => {
    const project: Project = {
      id: 'project_page_scope',
      name: 'Page scope',
      version: 1,
      createdAt: '2026-05-11T00:00:00.000Z',
      updatedAt: '2026-05-11T00:00:00.000Z',
      variables: [],
      dataSources: [],
      interactions: [],
      pages: [
        {
          id: 'page_a',
          name: 'A',
          route: '/a',
          rootNodeId: 'root_a',
          nodes: {
            root_a: { id: 'root_a', type: 'PageContainer', name: 'A root', props: {}, children: ['button_a'] },
            button_a: { id: 'button_a', type: 'Button', name: 'A button', props: { text: 'A' } },
          },
        },
        {
          id: 'page_b',
          name: 'B',
          route: '/b',
          rootNodeId: 'root_b',
          nodes: {
            root_b: { id: 'root_b', type: 'PageContainer', name: 'B root', props: {}, children: ['button_b'] },
            button_b: { id: 'button_b', type: 'Button', name: 'B button', props: { text: 'B' } },
          },
        },
      ],
    };

    const suggestions = runAiRulesForPage(project, 'page_a');

    expect(suggestions.some((item) => item.affectedNodeIds?.includes('button_a'))).toBe(true);
    expect(suggestions.some((item) => item.affectedNodeIds?.includes('button_b'))).toBe(false);
  });
});
