# ARCHITECTURE.md

## Principles

- Project data is the product state and must be JSON serializable.
- Edit mode and preview mode share the same component registry and renderer mapping.
- AI suggestions produce `Operation[]`; operations are only applied after user intent.
- Interaction execution is a whitelist DSL interpreter, not a JavaScript runtime.
- MVP scope is a closed loop, not a production low-code platform.

## Module Boundaries

- `src/domain`: TypeScript types, Zod schemas, operations, selectors, dependency graph scanning.
- `src/store`: Zustand store, Immer updates, localStorage persistence, default project.
- `src/registry`: component descriptors, default props, node factory, renderer mapping.
- `src/editor`: three-panel editing UI.
- `src/runtime`: preview provider, runtime state, navigation, mock data, runtime renderer.
- `src/interactions`: trigger matching, condition evaluation, action execution, runner.
- `src/ai`: structured rule checks and suggestion application.
- `src/export`: Markdown PRD exporter.
- `src/templates`: built-in admin and interaction templates.

Pure logic modules must not depend on React:
- `src/domain`
- `src/interactions`
- `src/ai`
- `src/export`

## Data Model

The core model uses `Project`, `Page`, `ComponentNode`, `ComponentDescriptor`, `DataSource`, `Variable`, `Interaction`, `AiSuggestion`, and `Operation`.

Pages store nodes as `Record<string, ComponentNode>` with children represented by node id arrays. This keeps the project serializable and makes dependency scanning straightforward.

## Interaction DSL

Supported triggers:
- click
- submit
- change
- rowClick
- search

Supported actions:
- openModal
- closeModal
- navigate
- setVariable
- refreshData
- showMessage
- resetForm
- submitMock

Conditions are structured comparisons over variables, event payload, route state, form values, and data values. The runner must not evaluate arbitrary code.

## AI Suggestions

AI is rule-based in MVP:

```text
Project JSON + Rule Context -> AiSuggestion[]
```

Future real AI integrations should live behind an adapter and still return structured suggestions, not free-text commands.

## Testing Strategy

Unit tests cover:
- dependency graph scanning
- interaction runner
- AI rule generation
- Markdown PRD export

Manual smoke covers:
- default order project
- add component
- edit props
- preview interactions
- AI check
- PRD export
