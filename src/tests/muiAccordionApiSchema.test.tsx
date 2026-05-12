import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getComponentDefinition } from '../registry/componentDefinitionRegistry';
import { createNode } from '../registry/createNode';
import { RenderNode } from '../registry/renderers';

function fieldPaths(type: string): string[] {
  const definition = getComponentDefinition(type);
  return [
    ...(definition?.propSchema ?? []),
    ...(definition?.contentSchema ?? []),
    ...(definition?.interactionSchema ?? []),
    ...(definition?.slotSchema ?? []),
  ].flatMap((group) => group.fields.map((field) => field.path));
}

describe('MUI Accordion API schema', () => {
  it('registers the complete MUI Accordion API with Chinese labels', () => {
    const definition = getComponentDefinition('Accordion');

    expect(definition?.source).toBe('antd');
    expect(definition?.nameZh).toBe('手风琴');
    expect(definition?.apiSchema?.sourceUrl).toBe('https://mui.com/material-ui/api/accordion/');
    expect(definition?.apiSchema?.sections[0]?.props.map((prop) => prop.name)).toEqual([
      'children',
      'classes',
      'defaultExpanded',
      'disabled',
      'disableGutters',
      'expanded',
      'onChange',
      'slotProps',
      'slots',
      'sx',
      'component',
      'elevation',
      'square',
      'variant',
      'TransitionComponent',
      'TransitionProps',
    ]);
    expect(definition?.apiSchema?.sections[0]?.props.map((prop) => prop.labelZh)).toEqual(
      expect.arrayContaining(['内容', '默认展开', '禁用', '禁用内边距', '展开状态', '切换后执行', '插槽属性', '插槽组件', '样式扩展']),
    );
    expect(fieldPaths('Accordion')).toEqual(
      expect.arrayContaining([
        'props.children',
        'props.classes',
        'props.defaultExpanded',
        'props.disabled',
        'props.disableGutters',
        'props.expanded',
        'props.slotProps',
        'props.slots',
        'props.sx',
        'props.component',
        'props.elevation',
        'props.square',
        'props.variant',
        'props.TransitionComponent',
        'props.TransitionProps',
        'events.onChange',
      ]),
    );
  });

  it('creates localized defaults and renders generated JSON as a component', () => {
    const node = createNode('Accordion', {
      summary: '活动规则',
      details: '用户完成任务后发放奖励。',
      defaultExpanded: true,
      disabled: false,
      disableGutters: false,
      elevation: 2,
      variant: 'outlined',
    });
    const dispatch = vi.fn();

    render(<RenderNode node={node} context={{ mode: 'edit', dispatch }} />);

    expect(screen.getByText('活动规则')).toBeInTheDocument();
    expect(screen.getByText('用户完成任务后发放奖励。')).toBeInTheDocument();
    expect(createNode('Accordion').props).toMatchObject({
      summary: '折叠标题',
      details: '折叠内容',
      defaultExpanded: false,
      disabled: false,
      disableGutters: false,
      elevation: 1,
      square: false,
      variant: 'elevation',
    });
  });
});
