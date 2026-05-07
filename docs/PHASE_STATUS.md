# Phase Status

Active phase: `V1.1-S4-canvas-actions-layer-template-workflow`

Status: active, planning complete and baseline checks pending.

Product target: Canvas-first Backoffice Prototype Editor.

Goal: complete Axure-style canvas operation logic, layer management, template save/reuse, recent assets, and runtime show/hide/enable/disable interactions so users can continuously build and preview backoffice prototypes.

## S3 Completion Carryover

- S3 first hardening slice is implemented and verified.
- `pnpm typecheck`: PASS
- `pnpm test`: PASS, 50 files / 141 tests
- `pnpm build`: PASS, with existing Vite large chunk warning
- `pnpm lint`: PASS
- Key hot-path fixes are in place: drag/resize pointermove no longer commits Project JSON, normal project persistence is debounced, component library cards use static previews, heavy edit-mode components use lightweight design renderers, and PRD/AI checks are explicit actions.

## S4 Scope

- Add space-hold and middle-mouse canvas panning without writing Project JSON.
- Add Home/Fit View and preserve Ctrl/Cmd + wheel zoom behavior.
- Add runtime interaction actions for show, hide, toggle visibility, enable, disable, toggle disabled, open/close modal/drawer, navigate, message, set prop, set form value, reset form, refresh data, select tab, and scroll to node.
- Separate editor visibility, runtime initial visibility, and runtime interaction state.
- Make template saving and insertion real for page, frame, block, group, component, and preset workflows.
- Add Recent Used and favorites in the component/library workflow.
- Add layer management for zIndex, top/bottom/forward/backward, drag reorder, lock, hide, show, rename, group, and ungroup.
- Complete context menus and shortcuts for common Axure-like operations.
- Add inspector fields for X, Y, W, H, zIndex, lock, editor visible, runtime initial visible, runtime initial enabled, and component name.
- Keep PRD output business-readable and free of coordinates, zIndex, and implementation vocabulary.

## Required Gates

UX_WORKFLOW_GATE_RESULT: pending

QA_GATE_RESULT: pending

ARCHITECTURE_GATE_RESULT: pending

## Hard Non-goals

- Do not expand component count during S4.
- Do not add real backend APIs.
- Do not add multiplayer collaboration.
- Do not add AI full-page generation.
- Do not add complex permission systems.
- Do not require raw project editing for common operations.

## S4 Completion Criteria

- Space pan works and does not conflict with text or inspector inputs.
- New components and pasted/template components default to the highest layer.
- Layer panel can manage zIndex, lock, hide, show, rename, group, and ungroup.
- Templates save, persist, insert, and remap ids correctly.
- Recent Used records system, ProComponents, prototype widgets, presets, and templates without duplicates.
- Runtime show/hide and enable/disable interactions execute in preview.
- Core operations are undoable/redoable.
- Edit mode, preview mode, templates, recent assets, and PRD all read consistent project data.
