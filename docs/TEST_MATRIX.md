# Test Matrix

Active phase: `V1.1-S4-canvas-actions-layer-template-workflow`.

S4 feature work starts only after the baseline verification commands pass.

## Existing Coverage

- `src/tests/antdComponentLibrary.test.ts`: Ant Design component manifest, search, categories, Pro disabled state.
- `src/tests/projectManager.test.ts`: local project create/list/open/rename/delete.
- `src/tests/templateLibrary.test.ts`: page/block/component template save and reuse.
- `src/tests/plainPrd.test.ts`: plain-language PRD content and forbidden vocabulary.
- `src/tests/workbenchLayout.test.ts`: Axure-style workbench shell regions.
- `src/tests/componentSchema.test.ts`: component definitions, overrides, presets, and serializable defaults.
- `src/tests/componentPreset.test.ts`: preset creation and node creation from presets.
- `src/tests/generatedInspector.test.tsx`: schema-driven property editors.
- `src/tests/componentLibraryEditor.test.tsx`: library default editing and preset UX.
- `src/tests/proComponentsRegistry.test.ts`: ProComponents definitions and registry metadata.
- `src/tests/proComponentsRender.test.tsx`: ProComponents adapter rendering.
- `src/tests/inlineEdit.test.tsx`: double-click text editing behavior.
- `src/tests/templatePresetSync.test.ts`: template and preset reuse boundaries.
- `src/tests/componentContentSchema.test.ts`: contentSchema, dataSchema, and slotSchema contracts.
- `src/tests/dropdownMenuEditor.test.tsx`: Dropdown menu item visual editing.
- `src/tests/tableRowsEditor.test.tsx`: Table, ProTable, and EditableProTable row data editing.
- `src/tests/axureOperations.test.ts`: copy, paste, lock, hide, rename operation behavior.
- `src/tests/pageContainerSlots.test.tsx`: PageContainer region controls.
- `src/tests/floatButtonApiSchema.test.ts`: FloatButton API schema and variant registration.
- `src/tests/apiToPropSchema.test.ts`: official API prop type to visual editor mapping.
- `src/tests/apiCoverageReport.test.ts`: API coverage status and missing prop reporting.
- `src/tests/floatButtonEditorRenderPrd.test.tsx`: FloatButton visual editing, preview interaction, and PRD sync.
- `src/tests/canvasDomain.test.ts`: canvas serialization, page frames, filtering, clone-new-id, lock/hide, align, and distribute.
- `src/tests/canvasEditor.test.tsx`: page-frame canvas drop, absolute positioning, drag, resize, hidden exclusion, copy/paste, z-order, context menu, group, and ungroup.
- `src/tests/generatedInspectorSeparation.test.tsx`: contentSchema and dataSchema write to node content/data instead of props.
- `src/tests/prototypeWidgetRegistry.test.ts`: prototype widget registration and editable text/style metadata.
- `src/tests/plainPrdCanvasSemantic.test.ts`: frame-aware semantic PRD export and coordinate/technical-term exclusion.

## S2.3 Required New Or Updated Coverage

- Prototype widget library manifest and visual preview metadata.
- Text widget double-click editing and style persistence.
- Canvas node serialization with `props`, `content`, `data`, `events`, `canvas`, and `semantic` separation.
- Page frame creation, current frame selection, and preview frame filtering.
- Drag, resize, lock, hide, z-order, group, ungroup, align, and distribute operations.
- Copy and paste generate new ids and preserve editable content, data, events, and canvas metadata.
- Dropdown menu editing persists to project data and preview/PRD read the same data.
- Select/Menu/Tabs/Steps collection editors persist item changes.
- Table/ProTable/EditableProTable column, row, and row action editors persist to project data.
- Form/ProForm field/default/validation editors persist to project data.
- Preview mode hides canvas assistance and executes interactions.
- PRD semantic export excludes coordinates and forbidden implementation vocabulary.

## Required Verification Commands

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm lint`

## S4 Required New Or Updated Coverage

- Space pan test verifies holding Space pans canvas viewport without moving nodes or writing Project JSON.
- Input focus test verifies Space does not pan while editing text or inspector fields.
- Middle mouse and Home/Fit View shortcut tests.
- Runtime visibility tests for initial hidden, show node, hide node, and toggle node visibility.
- Runtime interactivity tests for initial disabled, enable node, disable node, and toggle disabled.
- Interaction action tests for modal, drawer, navigation, message, set prop, set form value, reset form, refresh data, select tab, scroll to node, and ordered multi-action execution.
- Template save tests for page, frame, block, group, component, and preset templates.
- Template insertion tests verify node id, interaction id, and data id remapping.
- Recent Used tests verify dedupe, useCount, max 50 entries, persistence, clear, and favorites.
- Layer tests verify highest-layer insert, zIndex ordering, top/bottom/forward/backward, lock, hide, show, rename, and drag reorder.
- Selection and grouping tests verify Shift-click, box-select, Esc, group, ungroup, and group movement.
- Context menu and shortcut tests verify delete, copy, paste, undo, redo, bracket layer commands, group, and ungroup without firing inside inputs.
- Inspector state tests verify X, Y, W, H, zIndex, lock, editor visible, runtime initial visible, runtime initial enabled, and component name sync.
- PRD tests verify groups, templates, layers, and show/hide/enable/disable interactions are described in business language without coordinates or zIndex.

## S3 Required New Or Updated Coverage

- 300-node canvas drag scenario verifies drag state does not commit full project updates during pointer movement.
- 500-node canvas selection scenario verifies selection changes do not rerender every node.
- 1000-node canvas scenario verifies viewport culling limits real rendering to visible nodes plus selected, dragged, and edited nodes.
- Component library search test verifies debounce, cached result reuse, or virtualization-visible result limits.
- Heavy component edit rendering test verifies ProTable, EditableProTable, Form, ProForm, and layout-family components use lightweight DesignRenderer in edit mode.
- Preview rendering test verifies RuntimeRenderer is still used in preview mode for heavy components.
- Autosave test verifies persistence is debounce or idle scheduled and does not run on every character or pointer frame.
- History test verifies drag, text edit, batch copy, and AI suggestion application are compressed into operation-based history entries.
- Async analysis test verifies PRD generation and AI checks are user-triggered or idle-scheduled rather than running on every edit.

## S2.3 Baseline Verification

- `pnpm typecheck`: PASS
- `pnpm test`: PASS, 43 files / 121 tests
- `pnpm build`: PASS, with Vite chunk-size warning for the main bundle
- `pnpm lint`: PASS
