# AGENTS.md

## Project

This repository builds Admin Prototype Studio, a browser-based Canvas-first Backoffice Prototype Editor.

The product is not a production low-code platform. It is an MVP for assembling backoffice prototypes on an Axure-style infinite canvas, configuring component content and interactions, previewing them, and exporting PRD documentation.

## Product Boundaries

Do:
- Build a frontend-only MVP.
- Use an infinite canvas with required Page Frames for real pages.
- Let users freely place, move, resize, align, copy, group, lock, hide, right-click, and double-click-edit prototype objects.
- Use a component registry and schema-driven rendering.
- Keep all project data serializable as JSON.
- Separate component configuration into props, content, data, events, canvas placement, and business semantics.
- Support edit mode and preview/runtime mode.
- Support interaction DSL execution.
- Support localStorage persistence.
- Support rule-based AI suggestions first, with an API adapter left for future real AI calls.
- Support Markdown PRD export.
- Keep PRD output based on pages and business modules, not canvas coordinates.

Do not:
- Add real database integration.
- Add production deployment generation.
- Add multiplayer collaboration.
- Add auth or enterprise RBAC.
- Add arbitrary JavaScript execution from user configuration.
- Add server-side features unless explicitly required.
- Force users to create structure containers before placing normal components.

## Tech Stack

Use:
- React
- TypeScript
- Vite
- Zustand
- Immer
- Zod
- @dnd-kit
- Ant Design
- Vitest
- React Testing Library

## Commands

Use these commands:
- Install: `pnpm install`
- Dev server: `pnpm dev`
- Type check: `pnpm typecheck`
- Test: `pnpm test`
- Lint: `pnpm lint`
- Build: `pnpm build`

## Architecture Rules

Core modules:
- `src/domain`: serializable product models, schemas, operations.
- `src/store`: Zustand store and persistence.
- `src/registry`: component descriptors and component renderer mapping.
- `src/editor`: editing shell, panels, infinite canvas UI, selection, inspector, and outline.
- `src/runtime`: preview renderer and runtime context.
- `src/interactions`: interaction DSL and runner.
- `src/ai`: rule-based assistant, suggestion generation, operation application.
- `src/export`: Markdown PRD export.
- `src/templates`: built-in admin templates.
- `src/tests` or colocated `*.test.ts`: tests.

Canvas rules:
- Every real page must have a Page Frame.
- Frame content may use freeform absolute canvas placement.
- Components outside Page Frames are drafts, notes, or flow annotations and are excluded from normal preview and PRD export unless explicitly included later.
- Preview renders the active Page Frame and hides grid, guides, selection boxes, and resize handles.
- PRD must describe page modules and business behavior, not x/y coordinates.

## Coding Rules

- Use strict TypeScript.
- Keep domain logic framework-light where possible.
- Prefer pure functions for schema validation, interaction execution, dependency analysis, canvas operations, and PRD export.
- Avoid large components. Split UI components by responsibility.
- Do not hardcode behavior inside visual components if it belongs to the interaction engine or canvas operation layer.
- Do not use `any` unless there is a clear comment explaining why.
- Keep configuration JSON serializable.
- Do not make common edits depend on raw JSON editing.

## Done Means

A task is done only when:
- Relevant code is implemented.
- TypeScript passes.
- Unit tests are added or updated for domain/runtime/canvas logic.
- The app can still run.
- The final response names changed files and verification commands.

## Active Phase

Current active phase:
`V1.1-S4-canvas-actions-layer-template-workflow`

The product should now close the editor workflow: Space-pan canvas navigation, layer management, template save/reuse, Recent Used assets, runtime show/hide and enable/disable interactions, context menus, shortcuts, undo/redo, inspector state controls, preview execution, and business-readable PRD sync. Do not expand component quantity during this phase.

## Plain PRD Rule

PRD must be written for product managers, business users, and developers reading business requirements.

PRD must describe pages, modules, displayed content, fields, buttons, operation results, page jumps, popups, form submissions, success prompts, failure prompts, and empty states.

PRD must not mention:
- JSON
- DSL
- schema
- runtime
- mock
- operation
- node
- component tree
- store
- Zustand
- Zod
- renderer
- Interaction Runner
- DataSource
