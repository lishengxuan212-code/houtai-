# Quality Gates

## Required Gates

- UX Workflow Gate
- QA Gate
- Architecture Gate

## S4 UX Workflow Gate

PASS only if the product works like a continuous Axure-style backoffice prototype editor:

- Holding Space pans the canvas.
- Canvas panning feels natural and does not move components.
- Single click, double click, and right click match expected editor behavior.
- New components appear on the highest layer.
- Layer panel can manage ordering and state.
- Components can be brought front, sent back, moved forward, and moved backward.
- Components can be locked and hidden.
- Templates can be saved and reused after refresh.
- Recent Used includes system components, ProComponents, prototype widgets, presets, templates, and user-created assets.
- Show/hide and enable/disable interactions execute in preview.
- Common operations do not require raw project editing.

FAIL if Space pan, template reuse, controllable layers, preview show/hide interactions, or recent custom asset recording does not work.

## S4 QA Gate

PASS only if:

- `pnpm typecheck` passes.
- `pnpm test` passes.
- `pnpm build` passes.
- `pnpm lint` passes when configured.
- Tests cover Space pan, middle mouse pan, focus-safe shortcuts, show/hide/toggle visibility, initial hidden state, enable/disable, template save/insert/id remap, Recent Used, zIndex ordering, highest-layer inserts, lock/hide, group/ungroup, shortcuts, undo/redo, and PRD sync.

## S4 Architecture Gate

PASS only if:

- Canvas viewport state is not written to Project JSON.
- `canvas.zIndex` is stored as serializable project data.
- Editor visibility and runtime initial visibility are separate.
- Runtime show/hide actions only affect runtime state.
- Template data is independent from project instance data.
- Template insertion remaps node, interaction, and data ids correctly.
- Recent Used data is stored independently from project data.
- Core operations flow through operations or store actions and are history-ready.
- No arbitrary JavaScript execution is introduced.
- Preview and edit modes read the same component configuration.
- PRD does not output coordinates, zIndex, or internal implementation vocabulary.

## S3 UX Latency Gate

PASS only if frequent editor operations feel immediate and close to Axure:

- Dragging components has no obvious stutter.
- Zooming and panning the canvas have no obvious stutter.
- Single click selection responds immediately.
- Multi-select and box-select remain acceptable on large pages.
- Copy and paste do not freeze the canvas.
- Right-click menu opens immediately.
- Component library search has no obvious delay.
- Inspector opening and selected-node switching have no obvious delay.
- Text, table column, and table row edits do not visibly block.
- Preview switching does not freeze for a long period.

Core fail conditions: obvious drag lag, obvious selection lag, obvious component library search lag, or obvious inspector lag.

## S3 QA Performance Gate

PASS only if:

- `pnpm typecheck` passes.
- `pnpm test` passes.
- `pnpm build` passes.
- `pnpm lint` passes when configured.
- 300-node pages remain draggable.
- 500-node pages remain selectable.
- 1000-node pages use viewport culling.
- Dragging does not write full Project JSON during pointer movement.
- Drag end commits one move operation.
- Component library search uses debounce, caching, virtualization, or visible rendering limits.
- Autosave is debounced or idle-scheduled.
- History stores operation entries, not full snapshot piles.
- Heavy components use lightweight edit renderers and real preview renderers.

## S3 Architecture Gate

PASS only if:

- Hot editor state and cold project state are separated.
- Drag state does not pollute Project JSON.
- Node renderers use selectors, memoization, or equivalent rerender isolation.
- Inspector updates do not rerender the whole canvas.
- Component library updates do not rerender the canvas.
- DesignRenderer and RuntimeRenderer responsibilities are clear.
- PRD, AI, and dependency analysis do not block editor hot paths.
- Project JSON remains the reliable serializable source.
- Edit, preview, and PRD export read consistent data.

## S2.3 UX Product Gate

PASS only if the product feels like an Axure-style backoffice prototype canvas:

- Users can place components anywhere inside a page frame without first creating a structure container.
- Users can drag, resize, copy, paste, delete, lock, hide, group, ungroup, align, distribute, and reorder canvas objects.
- Users can double-click text widgets to edit visible text.
- Text widgets expose visual controls for font size, color, weight, line height, alignment, background, border, radius, and padding.
- Dropdown menu items are editable without raw project editing.
- Select, Menu, Tabs, Steps, Table, ProTable, EditableProTable, Form, and ProForm expose their important internal content or display data through visual editors.
- Preview renders the selected page frame without grid, guides, selection boxes, or resize handles.
- PRD export describes pages, modules, fields, buttons, data, and interaction results in business language.

## S2.3 QA Gate

PASS only if:

- `pnpm typecheck` passes.
- `pnpm test` passes.
- `pnpm build` passes.
- `pnpm lint` passes when configured.
- Tests cover prototype text widgets, canvas layout serialization, Dropdown data editing, Table row data editing, copy/paste new id generation, preview synchronization, and PRD semantic output.

## S2.3 Architecture Gate

PASS only if:

- Canvas nodes are serializable project data.
- Component configuration separates `props`, `content`, `data`, `events`, `canvas`, and `semantic` responsibilities.
- Component editors persist to the shared project model, not isolated React component state.
- Preview reads the same project data as the editor.
- Common edits do not require users to edit raw project data.
- Copy and paste always generate new ids and never mutate the original component.
- The canvas pivot does not break the Ant Design / ProComponents registry and renderer mapping.
- Arbitrary JavaScript execution from user configuration remains forbidden.

## S2.3 Gate Result

- UX Product Gate: PASS
- QA Gate: PASS
- Architecture Gate: PASS

Non-blocking follow-ups:

- Improve box-select and multi-select ergonomics beyond the current store support.
- Add user-facing page frame create/rename management.
- Add deeper interaction retargeting when cloning complex grouped nodes.
- Expand RTL persistence tests for every collection editor.
- Move default frame creation closer to project creation/store invariants.

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
