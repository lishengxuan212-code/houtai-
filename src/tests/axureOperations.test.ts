import { describe, expect, it } from 'vitest';
import type { Page } from '../domain/types';
import { cloneNodeSubtree, setNodeHidden, setNodeLocked } from '../domain/operations/axureOperations';

describe('Axure-like operations', () => {
  it('copies a node subtree with new ids and independent props', () => {
    const page: Page = {
      id: 'page_1',
      name: 'Page',
      route: '/page',
      rootNodeId: 'root',
      nodes: {
        root: { id: 'root', type: 'PageContainer', name: 'Root', props: {}, children: ['button_1'] },
        button_1: { id: 'button_1', type: 'Button', name: 'Button', props: { text: '确认' } },
      },
    };

    const cloned = cloneNodeSubtree(page, 'button_1');

    expect(cloned.rootNode.id).not.toBe('button_1');
    expect(cloned.rootNode.props).toEqual({ text: '确认' });
    cloned.rootNode.props.text = '复制按钮';
    expect(page.nodes.button_1?.props.text).toBe('确认');
  });

  it('sets lock and hide metadata without changing props', () => {
    const node = { id: 'button_1', type: 'Button', name: 'Button', props: { text: '确认' } };

    expect(setNodeLocked(node, true).meta?.locked).toBe(true);
    expect(setNodeHidden(node, true).meta?.hiddenInEditor).toBe(true);
  });
});
