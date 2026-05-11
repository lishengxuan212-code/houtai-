# Decision Log

## V1.1-S1

- Use localStorage for multi-project and template persistence in this phase.
- Show Pro Components as disabled entries unless `@ant-design/pro-components` is installed later.
- Treat master components as reusable templates in S1; synchronized master instances are deferred.
- Initial direction kept structured page assembly and did not introduce an infinite canvas.

## V1.1-S2

- Promote visual editing into a reusable component schema layer instead of adding one-off inspectors.
- Keep system component definitions immutable; user default props live in overrides and reusable assets live in presets.
- Treat ProComponents as heavy admin assets with adapter-based rendering and schema-driven property editing.
- Keep raw project editing as an advanced debug view while normal editing uses generated visual controls.
- Install `@ant-design/pro-components`, but render S2 heavy components through stable local adapters while the package peer dependency targets Ant Design 4/5 and this app uses Ant Design 6.

## V1.1-S2.1

- Add contentSchema, dataSchema, and slotSchema beside propSchema so collection contents, display data, and container regions do not get forced into generic raw editing.
- Prioritize Dropdown and table-family row data because these are the clearest gaps between a component preview and a usable admin prototype element.

## V1.1-S2.2

- Introduce Component API Schema as the contract between official component APIs, generated prop editors, preview rendering, and PRD export.
- Represent FloatButton, FloatButton.Group, and FloatButton.BackTop as separate draggable variants because their official API sections differ.
- Map function-like API props to the existing interaction model and runtime dispatch events instead of storing JavaScript functions.
- Treat API coverage as explicit product metadata so partial component API support is visible rather than implicit.

## V1.1-S2.3

- Pivot the product target to Canvas-first Backoffice Prototype Editor.
- Replace the central structured assembly operation model with an Axure-style infinite canvas built around page frames.
- Preserve Ant Design / ProComponents component registry, visual editors, preview rendering, and plain business PRD export.
- Require component configuration to separate props, content, data, events, canvas placement, and business semantics.
- Require free placement, drag, resize, selection, multi-selection, copy, paste, context menu, grouping, alignment, guides, rulers, lock, hide, and page-frame preview.
- Require PRD generation from pages and business modules, not coordinates or internal implementation structures.

## V1.1-S3

- Stop adding feature breadth until canvas and editor hot paths are hardened.
- Treat drag, select, zoom, pan, copy, paste, inspector switching, component library search, and preview switching as the core product experience.
- Measure performance before optimizing and keep baseline, budget, and decision documents for this phase.
- During drag and other high-frequency pointer movement, update temporary visual state only and commit one project operation at the end.
- Split hot UI state from cold serializable project state.
- Use viewport culling for large canvases.
- Use lightweight design renderers for heavy edit-mode components and full runtime renderers for preview.
- Keep PRD, AI, dependency analysis, autosave, and history work out of editor hot paths.

## V1.1-S4

- Enter canvas actions, layering, template workflow, and interaction behavior work after S3 hot-path hardening.
- Confirm active phase as `V1.1-S4-canvas-actions-layer-template-workflow` before implementation and require a clean baseline before feature work.
- Do not expand component count in S4; improve continuous editor workflows instead.
- Treat Space pan, layer management, template reuse, Recent Used, and runtime show/hide/enable/disable as the phase-critical product loop.
- Separate editor visibility from runtime initial visibility and runtime interaction state.
- Store template assets and recent assets independently from project instance data.
- Require template insertion to remap ids and preserve internal references.
- Commit template insertion through history-preserving project commits so template reuse can be undone.
- Use a realistic Vitest timeout for Ant Design/jsdom integration tests because S4 UI tests now cover heavier workflows.
- Keep interaction behaviors declarative and forbid arbitrary JavaScript.
- Keep PRD output business-facing and exclude coordinates, zIndex, and internal implementation terms.
