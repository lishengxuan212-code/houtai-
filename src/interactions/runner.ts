import type { Interaction, Project } from '../domain/types';
import type { RuntimeState } from '../runtime/runtimeState';
import { executeAction, type RuntimeEvent } from './actions';
import { conditionsPass } from './conditions';

export function matchInteractions(interactions: Interaction[], event: RuntimeEvent): Interaction[] {
  return interactions.filter(
    (interaction) =>
      interaction.enabled &&
      interaction.trigger.componentId === event.componentId &&
      interaction.trigger.event === event.event,
  );
}

export function runInteraction(project: Project, state: RuntimeState, event: RuntimeEvent): RuntimeState {
  let next: RuntimeState = { ...state };
  if (event.payload?.row && typeof event.payload.row === 'object' && !Array.isArray(event.payload.row)) {
    next = { ...next, currentRow: event.payload.row };
  }
  const matches = matchInteractions(project.interactions, event);
  if (matches.length === 0 && event.event === 'click' && state.openNodes.includes(event.componentId)) {
    const page = project.pages.find((item) => item.id === state.currentPageId);
    const node = page?.nodes[event.componentId];
    if (node?.type === 'Modal' || node?.type === 'Drawer') {
      return { ...next, openNodes: next.openNodes.filter((nodeId) => nodeId !== event.componentId) };
    }
  }
  for (const interaction of matches) {
    if (!conditionsPass(interaction.conditions, { state: next, event: event.payload })) continue;
    for (const action of interaction.actions) {
      next = executeAction(project, next, action, event);
    }
  }
  return next;
}
