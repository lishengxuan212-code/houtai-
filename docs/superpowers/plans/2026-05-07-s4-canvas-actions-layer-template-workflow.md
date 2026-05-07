# S4 Canvas Actions, Layering, Template Workflow and Interaction Behaviors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users continuously operate an Axure-like backoffice prototype editor: pan the canvas, manage layers, save and reuse templates, use recent assets, configure basic runtime interactions, and preview the result.

**Architecture:** Extend existing serializable project data and runtime runner instead of adding ad hoc React-local behavior. Keep viewport and transient runtime state outside Project JSON, keep template/recent assets in independent localStorage stores, route project-changing editor commands through operations/store actions, and keep interactions declarative with no arbitrary JavaScript.

**Tech Stack:** React, TypeScript, Vite, Zustand, Immer, Zod, Ant Design, @dnd-kit, Vitest, React Testing Library.

---

## File Structure

- Modify: `docs/PHASE_STATUS.md`, `docs/QUALITY_GATES.md`, `docs/UX_ACCEPTANCE.md`, `docs/TEST_MATRIX.md`, `docs/DECISION_LOG.md` for S4 status and gates.
- Modify: `src/domain/types.ts` to add visibility/interactivity fields and new interaction action variants.
- Modify: `src/domain/schemas.ts` to validate new action and node-state fields.
- Modify: `src/domain/operations.ts` and `src/domain/canvas.ts` for zIndex, layer, visibility, interactivity, and template insertion operations.
- Modify: `src/domain/history.ts` to support S4 operation entries and inverse operations.
- Modify: `src/store/editorStores.ts` for pan mode, viewport pan offsets, shortcut state, and layer panel UI state.
- Modify: `src/store/projectStore.ts` for layer, visibility, interactivity, undo/redo, template insert, and selection commands.
- Modify: `src/editor/AssemblyCanvas.tsx` for Space pan, middle-mouse pan, Fit View, Shift-click, box-select, context menu additions, and shortcut routing.
- Modify: `src/editor/PageTree.tsx` or `src/editor/workbench/PageOutlinePanel.tsx` into a layer-aware panel.
- Modify: `src/editor/PropertyPanel.tsx` and inspector components for X/Y/W/H/zIndex/lock/visibility/interactivity/name controls.
- Modify: `src/interactions/actions.ts`, `src/interactions/runner.ts`, and `src/runtime/runtimeState.ts` for runtime visibility and interactivity.
- Modify: `src/runtime/RuntimeProvider.tsx`, `src/runtime/RuntimeRenderer.tsx`, and renderer context to honor runtime hidden/disabled state.
- Modify: `src/templates/userTemplateTypes.ts`, `src/templates/userTemplateSchema.ts`, `src/templates/templateOperations.ts`, `src/templates/templateStorage.ts`, and editor template panels for full template workflow.
- Create: `src/library/recentLibrary.ts` and `src/library/recentLibraryStorage.ts` for Recent Used and favorites.
- Modify: `src/editor/components/ComponentLibraryPanel.tsx`, `src/editor/components/ComponentCard.tsx`, template panels, and preset flows to record recent usage.
- Modify: `src/export/plainPrd.ts` and/or `src/export/markdownPrd.ts` to describe groups/templates/interactions in business language.
- Test: add or update `src/tests/canvasPanShortcut.test.tsx`, `src/tests/runtimeVisibilityActions.test.tsx`, `src/tests/interactionActionsS4.test.ts`, `src/tests/templateWorkflowS4.test.ts`, `src/tests/recentLibrary.test.ts`, `src/tests/layerManager.test.ts`, `src/tests/groupSelectionS4.test.tsx`, `src/tests/contextMenuShortcuts.test.tsx`, `src/tests/inspectorStateS4.test.tsx`, and `src/tests/prdS4Workflow.test.ts`.

### Task 1: Baseline Checks

**Files:**
- No code files changed.

- [ ] **Step 1: Run command gate before implementation**

Run:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm lint
```

Expected: all PASS. If any command fails, fix the failure before adding S4 behavior.

### Task 2: Canvas Pan And View Shortcuts

**Files:**
- Modify: `src/store/editorStores.ts`
- Modify: `src/editor/AssemblyCanvas.tsx`
- Modify: `src/editor/editor.css`
- Test: `src/tests/canvasPanShortcut.test.tsx`

- [ ] **Step 1: Write tests**

Add tests that verify holding Space and dragging changes scroll/viewport state but does not change node canvas x/y, middle mouse pans, Space inside inputs does not pan, and Home/Fit View recenters the active page frame.

- [ ] **Step 2: Add pan state**

Add `isSpacePanning`, `isPanning`, `panStart`, and viewport scroll helpers to `src/store/editorStores.ts`. Keep all of this out of Project JSON.

- [ ] **Step 3: Wire keyboard guards**

In `AssemblyCanvas`, ignore Space shortcuts when `event.target` is inside `input`, `textarea`, `[contenteditable]`, `.inline-edit-input`, Ant Design select/dropdown, or inspector editors.

- [ ] **Step 4: Implement pan behavior**

Space + left mouse drag and middle mouse drag should call scroll APIs on the canvas scroller. Component drag must remain disabled while pan mode is active.

- [ ] **Step 5: Implement Fit View**

Home/Fit View should scroll the active Page Frame into view and choose a zoom level that keeps the frame visible without writing project data.

- [ ] **Step 6: Verify**

Run:

```bash
pnpm test -- src/tests/canvasPanShortcut.test.tsx src/tests/canvasPerformance.test.tsx
```

Expected: PASS.

### Task 3: Runtime Visibility And Interactivity State

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/domain/schemas.ts`
- Modify: `src/runtime/runtimeState.ts`
- Modify: `src/runtime/runtimeContext.ts`
- Modify: `src/runtime/RuntimeProvider.tsx`
- Modify: `src/runtime/RuntimeRenderer.tsx`
- Modify: renderer context types in `src/registry/renderers/rendererTypes.ts`
- Test: `src/tests/runtimeVisibilityActions.test.tsx`

- [ ] **Step 1: Write tests**

Test `runtimeInitialVisible: false` hides a node on preview start, `showNode` displays it, `hideNode` hides it, `toggleNodeVisibility` toggles it, and disabled state prevents click dispatch.

- [ ] **Step 2: Add node state fields**

Extend `ComponentNode` with optional:

```ts
visibility?: {
  editorVisible?: boolean;
  runtimeInitialVisible?: boolean;
};
interactivity?: {
  runtimeInitialDisabled?: boolean;
};
```

Keep legacy `canvas.hidden` as editor hide compatibility until migrated.

- [ ] **Step 3: Initialize runtime state**

Add `visibleNodes: Record<string, boolean>` and `disabledNodes: Record<string, boolean>` to `RuntimeState`, initialized from project nodes.

- [ ] **Step 4: Honor state during preview**

`RuntimeRenderer` should skip runtime-hidden nodes and pass disabled state through `RendererContext`.

- [ ] **Step 5: Verify**

Run:

```bash
pnpm test -- src/tests/runtimeVisibilityActions.test.tsx src/tests/runtimePreviewRender.test.tsx
```

Expected: PASS.

### Task 4: S4 Interaction Actions

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/domain/schemas.ts`
- Modify: `src/interactions/actions.ts`
- Modify: `src/interactions/runner.ts`
- Modify: `src/editor/inspector/editors/InteractionEventEditor.tsx`
- Test: `src/tests/interactionActionsS4.test.ts`

- [ ] **Step 1: Write action tests**

Cover `showNode`, `hideNode`, `toggleNodeVisibility`, `enableNode`, `disableNode`, `toggleNodeDisabled`, `openDrawer`, `closeDrawer`, `navigateToPage`, `setNodeProp`, `setFormValue`, `resetForm`, `refreshData`, `selectTab`, `scrollToNode`, and multiple ordered actions.

- [ ] **Step 2: Extend action union**

Add declarative action variants to `Action` and schemas. Preserve legacy `navigate`, `openModal`, `closeModal`, `refreshData`, `showMessage`, and `resetForm` compatibility.

- [ ] **Step 3: Implement runner behavior**

Update `executeAction` to update runtime state only for visibility/interactivity and to keep project data unchanged in preview.

- [ ] **Step 4: Update interaction editor options**

Expose the new actions through visual controls. Do not introduce user-authored JavaScript or raw JSON as the normal path.

- [ ] **Step 5: Verify**

Run:

```bash
pnpm test -- src/tests/interactionActionsS4.test.ts src/tests/interactionRunner.test.ts
```

Expected: PASS.

### Task 5: Layer Manager And Z-index Operations

**Files:**
- Modify: `src/domain/canvas.ts`
- Modify: `src/domain/operations.ts`
- Modify: `src/store/projectStore.ts`
- Modify: `src/editor/workbench/PageOutlinePanel.tsx`
- Modify: `src/editor/AssemblyCanvas.tsx`
- Test: `src/tests/layerManager.test.ts`

- [ ] **Step 1: Write layer tests**

Test highest-layer insert, copy/paste at highest layer, bring front, send back, move forward, move backward, lock, unlock, hide, show, rename, and DOM/render ordering by zIndex.

- [ ] **Step 2: Add layer operations**

Add operations or store commands for `bringToFront`, `sendToBack`, `moveForward`, `moveBackward`, `setEditorVisible`, and `updateNodeName`.

- [ ] **Step 3: Ensure highest-layer inserts**

Update add component, paste, and template insertion to calculate `maxZ + 1`; for template groups, offset all inserted zIndex values above current max while preserving relative order.

- [ ] **Step 4: Convert outline into layer panel behavior**

Show active frame nodes sorted by zIndex with highest layer visually clear. Include lock, hide/show, rename, and selection sync.

- [ ] **Step 5: Verify**

Run:

```bash
pnpm test -- src/tests/layerManager.test.ts src/tests/canvasEditor.test.tsx
```

Expected: PASS.

### Task 6: Template Workflow

**Files:**
- Modify: `src/templates/userTemplateTypes.ts`
- Modify: `src/templates/userTemplateSchema.ts`
- Modify: `src/templates/templateOperations.ts`
- Modify: `src/templates/templateStorage.ts`
- Modify: `src/editor/templates/SaveTemplateModal.tsx`
- Modify: `src/editor/templates/TemplateLibraryPanel.tsx`
- Modify: `src/editor/templates/TemplateCard.tsx`
- Test: `src/tests/templateWorkflowS4.test.ts`

- [ ] **Step 1: Write template tests**

Cover page, frame, block, group, component, and preset template save; persistence after reload; insert with new node ids; internal interaction id and target remapping; rename; delete; update; and instance independence.

- [ ] **Step 2: Expand template types**

Change template type union to:

```ts
'page' | 'frame' | 'block' | 'group' | 'component'
```

Add `rootNodeIds`, `useCount`, optional `sourceProjectId`, and optional `sourcePageId`, while preserving migration from the current single `rootNodeId` shape.

- [ ] **Step 3: Implement selection save options**

Support include props/content/data/internal interactions/external refs options. Keep external references excluded by default.

- [ ] **Step 4: Implement id remapping**

When inserting, remap node ids, interaction ids, trigger component ids, action target node ids, and data ids where the template owns the referenced item.

- [ ] **Step 5: Wire UI actions**

Make top/template panel and context-menu save flows call the same template operation layer.

- [ ] **Step 6: Verify**

Run:

```bash
pnpm test -- src/tests/templateWorkflowS4.test.ts src/tests/templateLibrary.test.ts
```

Expected: PASS.

### Task 7: Recent Used And Favorites

**Files:**
- Create: `src/library/recentLibrary.ts`
- Create: `src/library/recentLibraryStorage.ts`
- Modify: `src/editor/components/ComponentLibraryPanel.tsx`
- Modify: `src/editor/components/ComponentCard.tsx`
- Modify: `src/editor/templates/useTemplateActions.ts`
- Modify: `src/editor/library/SaveComponentPresetModal.tsx`
- Test: `src/tests/recentLibrary.test.ts`

- [ ] **Step 1: Write recent tests**

Test recording components, ProComponents, prototype widgets, presets, component templates, group templates, and page templates; dedupe; useCount; usedAt; max 50; persistence; clear; and favorites.

- [ ] **Step 2: Add storage model**

Add `RecentLibraryItem` and localStorage helpers independent from project data.

- [ ] **Step 3: Record usage**

Record on component drop/add, template insert, preset insert, saved user component, copy/paste when useful, and context-menu template insert.

- [ ] **Step 4: Add Recent Used UI**

Add component library tabs: Recent Used, Ant Design, ProComponents, prototype widgets, business templates, My Components, and Favorites. Keep existing categories inside Ant Design/Pro tabs.

- [ ] **Step 5: Verify**

Run:

```bash
pnpm test -- src/tests/recentLibrary.test.ts src/tests/componentLibraryPerformance.test.tsx
```

Expected: PASS.

### Task 8: Selection, Grouping, Context Menu, And Shortcuts

**Files:**
- Modify: `src/store/projectStore.ts`
- Modify: `src/editor/AssemblyCanvas.tsx`
- Modify: `src/editor/editor.css`
- Test: `src/tests/groupSelectionS4.test.tsx`
- Test: `src/tests/contextMenuShortcuts.test.tsx`

- [ ] **Step 1: Write tests**

Cover Shift-click add/remove selection, box-select, Esc clear selection, Ctrl/Cmd+G group, Ctrl/Cmd+Shift+G ungroup, Delete, copy/paste, undo/redo, bracket layer shortcuts, input-focus shortcut suppression, and full context menu entries.

- [ ] **Step 2: Implement selection behavior**

Shift-click toggles selection; blank click clears to frame/root; Esc clears selection; box-select computes intersecting node boxes using existing canvas viewport helpers.

- [ ] **Step 3: Implement group movement**

Dragging a group moves child canvas positions consistently or preserves group-relative movement through a single operation, depending on existing group storage.

- [ ] **Step 4: Complete context menu**

Add rename, lock/unlock, hide/show, bring front, send back, move forward, move backward, save as template, group, and ungroup.

- [ ] **Step 5: Implement shortcuts**

Route shortcuts only when focus is not inside text/input/edit controls.

- [ ] **Step 6: Verify**

Run:

```bash
pnpm test -- src/tests/groupSelectionS4.test.tsx src/tests/contextMenuShortcuts.test.tsx
```

Expected: PASS.

### Task 9: Inspector State Controls

**Files:**
- Modify: `src/editor/PropertyPanel.tsx`
- Modify: `src/editor/inspector/GeneratedInspector.tsx`
- Modify: `src/editor/inspector/PropFieldRenderer.tsx`
- Test: `src/tests/inspectorStateS4.test.tsx`

- [ ] **Step 1: Write tests**

Verify inspector edits update X, Y, W, H, zIndex, lock, editor visible, runtime initial visible, runtime initial enabled, and component name; canvas, layer panel, preview, and PRD read the updated values.

- [ ] **Step 2: Add canvas state group**

Add a stable inspector section for canvas placement and layer state, separate from component props/content/data/events.

- [ ] **Step 3: Add runtime initial state group**

Add visual controls for preview initial visible/enabled state and persist them to serializable node fields.

- [ ] **Step 4: Verify**

Run:

```bash
pnpm test -- src/tests/inspectorStateS4.test.tsx src/tests/generatedInspector.test.tsx
```

Expected: PASS.

### Task 10: PRD Sync For S4 Workflows

**Files:**
- Modify: `src/export/plainPrd.ts`
- Modify: `src/export/markdownPrd.ts`
- Test: `src/tests/prdS4Workflow.test.ts`

- [ ] **Step 1: Write PRD tests**

Verify PRD describes group/module names, template-created modules, show/hide interactions, enable/disable interactions, modal/drawer actions, navigation, success/failure messages, and empty states without coordinates, zIndex, or forbidden technical terms.

- [ ] **Step 2: Prefer business names**

Use component name and group/module semantic names before component type.

- [ ] **Step 3: Describe S4 interactions**

Translate declarative actions into plain business requirements, for example "点击删除后显示删除确认弹窗" and "提交成功后关闭弹窗并刷新列表".

- [ ] **Step 4: Verify**

Run:

```bash
pnpm test -- src/tests/prdS4Workflow.test.ts src/tests/plainPrdCanvasSemantic.test.ts
```

Expected: PASS.

### Task 11: Final Gates

**Files:**
- Modify: `docs/PHASE_STATUS.md`
- Modify: `docs/QUALITY_GATES.md`
- Modify: `docs/TEST_MATRIX.md`

- [ ] **Step 1: Run full verification**

Run:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm lint
```

Expected: all PASS.

- [ ] **Step 2: Run UX workflow review**

Manually verify Space pan, layer manager, template save/reuse, Recent Used, runtime show/hide preview, context menu, shortcuts, inspector state controls, and PRD output.

- [ ] **Step 3: Run architecture review**

Confirm viewport state stays out of Project JSON, editor/runtime visibility separation is real, template/recent storage boundaries are clean, ids are remapped, interactions remain declarative, and PRD excludes technical terms.

- [ ] **Step 4: Update phase docs**

Record final gate results and any S5 carryover. S5 should focus on interaction configuration wizards and business flow orchestration after S4 passes.

## Self-Review

Spec coverage: this plan covers Space pan, middle mouse pan, Fit View, runtime visibility/interactivity, all requested S4 action types, template workflow, Recent Used, layer management, selection/grouping, context menus, shortcuts, inspector state controls, PRD sync, and the final UX/QA/Architecture gates.

Placeholder scan: no task uses TBD or vague implementation placeholders; each task names files, tests, and verification commands.

Type consistency: the plan extends existing `ComponentNode`, `Action`, `RuntimeState`, `UserTemplate`, and store/action boundaries without replacing the current architecture.
