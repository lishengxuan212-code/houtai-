# S3 Performance and Canvas Interaction Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make frequent canvas editor operations smooth before adding S4 interaction features.

**Architecture:** Measure first, then move high-frequency visual state out of the persisted project hot path. Keep Project JSON as the serializable source of truth, but isolate drag, viewport, selection, inspector, library, persistence, history, preview, PRD, and AI work so unrelated UI does not rerender or block pointer/input operations.

**Tech Stack:** React, TypeScript, Vite, Zustand, Immer, Ant Design, ProComponents, Vitest, React Testing Library.

---

## File Structure

- Modify: `docs/PERFORMANCE_BASELINE.md` for measured baseline results and bottleneck notes.
- Modify: `docs/PERFORMANCE_BUDGET.md` for accepted budgets and gate thresholds.
- Modify: `docs/PERFORMANCE_DECISION_LOG.md` for optimization decisions and rejected approaches.
- Create: `src/editor/performance/performanceMetrics.ts` for counters and timing helpers.
- Create: `src/editor/performance/PerformanceDebugPanel.tsx` for development performance counters.
- Create: `src/store/editorStores.ts` for hot UI stores: viewport, selection, drag, inspector, library, runtime, and history metadata.
- Modify: `src/store/projectStore.ts` to keep cold project data and project mutations away from drag, selection, viewport, and library search.
- Modify: `src/store/persistence.ts` to add debounce or idle-scheduled persistence.
- Modify: `src/editor/AssemblyCanvas.tsx` to use drag state, requestAnimationFrame transforms, viewport culling, and node-level rendering boundaries.
- Modify: `src/editor/editor.css` to support transform-based drag and culling-friendly node styles.
- Modify: `src/editor/components/ComponentLibraryPanel.tsx`, `src/editor/components/ComponentCard.tsx`, and `src/editor/components/ComponentSearch.tsx` for lightweight previews and debounced search.
- Modify: `src/registry/renderers/index.tsx`, `src/registry/renderers/rendererTypes.ts`, and heavy renderer files for edit-mode DesignRenderer versus preview RuntimeRenderer behavior.
- Modify: `src/runtime/*` preview entry files so preview renders only the active Page Frame and uses runtime renderers.
- Test: add or update `src/tests/canvasPerformance.test.tsx`, `src/tests/storeSubscriptionPerformance.test.ts`, `src/tests/componentLibraryPerformance.test.tsx`, `src/tests/heavyComponentRendererPerformance.test.tsx`, `src/tests/persistenceHistoryPerformance.test.ts`, and `src/tests/previewPerformance.test.tsx`.

### Task 1: Baseline Instrumentation And Documentation

**Files:**
- Create: `src/editor/performance/performanceMetrics.ts`
- Create: `src/editor/performance/PerformanceDebugPanel.tsx`
- Modify: `src/editor/EditorShell.tsx`
- Modify: `docs/PERFORMANCE_BASELINE.md`

- [x] **Step 1: Write tests for timing and counters**

Create `src/tests/performanceMetrics.test.ts` with tests for incrementing named counters, timing operations, resetting metrics, and reading snapshots without mutating state.

- [x] **Step 2: Implement metrics helper**

Implement a small framework-light module with `incrementMetric(name)`, `measureMetric(name, fn)`, `recordDuration(name, ms)`, `resetMetrics()`, and `getMetricSnapshot()`. Keep values serializable and testable.

- [x] **Step 3: Add debug panel behind a dev-only guard**

Add `PerformanceDebugPanel` and mount it from `EditorShell.tsx` only when `import.meta.env.DEV` is true. Show page node count, visible node count, selected node count, recent operation duration, canvas render count, node render count, store update count, and persistence write count.

- [x] **Step 4: Update baseline document**

Record the first measured findings in `docs/PERFORMANCE_BASELINE.md`, especially whether drag writes project data, persistence, and history during pointer movement.

- [x] **Step 5: Verify**

Run: `pnpm test -- src/tests/performanceMetrics.test.ts`

Expected: PASS.

### Task 2: Drag And Resize Hot Path

**Files:**
- Modify: `src/editor/AssemblyCanvas.tsx`
- Modify: `src/editor/editor.css`
- Modify: `src/store/projectStore.ts`
- Test: `src/tests/canvasEditor.test.tsx`
- Test: `src/tests/canvasPerformance.test.tsx`

- [x] **Step 1: Add failing drag performance test**

Add a test that simulates multiple mousemove events while dragging one canvas node and asserts no persisted project canvas update is committed until mouseup.

- [x] **Step 2: Add drag state to hot UI store**

Store active drag metadata separately from project data: node id, start pointer, start canvas, latest delta, and final patch. Do not persist this state.

- [x] **Step 3: Move pointermove to requestAnimationFrame**

During mousemove, update only drag state and apply visual position with `transform: translate(...)`. Do not call `apply()` from pointermove.

- [x] **Step 4: Commit one operation on pointerup**

On mouseup, calculate final `x` and `y`, clear drag state, then call one `updateNodeCanvas` operation.

- [x] **Step 5: Apply same rule to resize**

Resize handles should visually update through temporary state and commit width, height, x, and y once on pointerup.

- [x] **Step 6: Verify**

Run: `pnpm test -- src/tests/canvasEditor.test.tsx src/tests/canvasPerformance.test.tsx`

Expected: PASS.

### Task 3: Store Subscription Boundaries

**Files:**
- Create: `src/store/editorStores.ts`
- Modify: `src/store/projectStore.ts`
- Modify: `src/editor/AssemblyCanvas.tsx`
- Modify: `src/editor/PropertyPanel.tsx`
- Modify: `src/editor/PageTree.tsx`
- Modify: `src/editor/components/ComponentLibraryPanel.tsx`
- Test: `src/tests/storeSubscriptionPerformance.test.ts`

- [x] **Step 1: Add selector isolation tests**

Test that viewport changes do not notify inspector subscribers, library search changes do not notify canvas subscribers, and selection changes do not require project subscribers.

- [x] **Step 2: Create hot editor stores**

Move selection, selected ids, viewport zoom/pan, drag state, inspector tab/open state, library query/category, runtime mode, and lightweight history metadata into focused Zustand stores.

- [ ] **Step 3: Keep projectStore cold**

Keep `projectStore` focused on `project`, `currentPageId`, `currentFrameId`, and serializable project operations. Project mutations may still select new nodes after add/paste, but should delegate selection to the hot selection store.

- [ ] **Step 4: Update editor subscriptions**

Update canvas, inspector, outline, and library components to use narrow selectors and shallow comparison where needed.

- [x] **Step 5: Verify**

Run: `pnpm test -- src/tests/storeSubscriptionPerformance.test.ts src/tests/canvasEditor.test.tsx src/tests/generatedInspector.test.tsx`

Expected: PASS.

### Task 4: Viewport Culling

**Files:**
- Create: `src/domain/canvasViewport.ts`
- Modify: `src/editor/AssemblyCanvas.tsx`
- Test: `src/tests/canvasPerformance.test.tsx`

- [x] **Step 1: Add bbox intersection tests**

Test viewport and node bounding box intersection, including partially visible nodes, offscreen nodes, selected offscreen nodes, dragged nodes, and edited nodes.

- [x] **Step 2: Implement pure culling helpers**

Add pure helpers that return visible canvas node ids from frame entries, viewport bounds, selected ids, dragging id, and editing id.

- [x] **Step 3: Wire culling into canvas render**

Render real `CanvasNodeFrame` only for visible, selected, dragged, or edited nodes. Keep counts visible in the debug panel.

- [ ] **Step 4: Add large node scenarios**

Add generated 300, 500, and 1000 node test fixtures for selection and culling checks.

- [x] **Step 5: Verify**

Run: `pnpm test -- src/tests/canvasPerformance.test.tsx`

Expected: PASS.

### Task 5: Heavy Component Design Renderers

**Files:**
- Modify: `src/registry/renderers/rendererTypes.ts`
- Modify: `src/registry/renderers/index.tsx`
- Modify: `src/registry/renderers/TableRenderer.tsx`
- Modify: `src/registry/renderers/FormRenderer.tsx`
- Modify: `src/registry/proComponents/proComponentAdapters.tsx`
- Test: `src/tests/heavyComponentRendererPerformance.test.tsx`
- Test: `src/tests/proComponentsRender.test.tsx`

- [x] **Step 1: Add mode-specific renderer tests**

Test that edit mode uses lightweight design rendering for Table, ProTable, EditableProTable, Form, ProForm, and layout-like ProComponents, while preview mode uses runtime rendering.

- [x] **Step 2: Extend renderer context**

Add an explicit render surface or renderer mode field that distinguishes edit design rendering from preview runtime rendering.

- [x] **Step 3: Implement lightweight design renderers**

For edit mode, show titles, fields, column headers, first few rows, row actions, and form field labels without mounting expensive full behavior.

- [x] **Step 4: Preserve runtime renderers**

Ensure preview keeps real component behavior and still reads the same `props`, `content`, `data`, and `events`.

- [x] **Step 5: Verify**

Run: `pnpm test -- src/tests/heavyComponentRendererPerformance.test.tsx src/tests/proComponentsRender.test.tsx src/tests/runtimePreviewRender.test.tsx`

Expected: PASS.

### Task 6: Component Library Performance

**Files:**
- Modify: `src/editor/components/ComponentLibraryPanel.tsx`
- Modify: `src/editor/components/ComponentCard.tsx`
- Modify: `src/editor/components/ComponentSearch.tsx`
- Modify: `src/store/componentLibraryStore.ts`
- Test: `src/tests/componentLibraryPerformance.test.tsx`
- Test: `src/tests/antdComponentLibrary.test.ts`

- [x] **Step 1: Add search and preview rendering tests**

Test search debounce/caching behavior and assert library cards use lightweight static previews instead of mounting full heavy renderers for every card.

- [ ] **Step 2: Debounce and cache search**

Store the raw query and debounced query separately. Cache normalized search results by query and category.

- [x] **Step 3: Limit visible card rendering**

Render only visible categories or use a simple virtual result window for search results. Keep card sizes stable.

- [x] **Step 4: Replace heavy previews**

Use static metadata previews for ProComponents and heavy Ant Design cards. Avoid complete ProComponents mounting in the library.

- [x] **Step 5: Verify**

Run: `pnpm test -- src/tests/componentLibraryPerformance.test.tsx src/tests/antdComponentLibrary.test.ts`

Expected: PASS.

### Task 7: Persistence And History

**Files:**
- Modify: `src/store/persistence.ts`
- Modify: `src/store/projectStore.ts`
- Create: `src/domain/history.ts`
- Test: `src/tests/persistenceHistoryPerformance.test.ts`
- Test: `src/tests/axureOperations.test.ts`

- [x] **Step 1: Add persistence debounce tests**

Test that rapid text edits or repeated project applies schedule one persistence write after the debounce or idle period.

- [x] **Step 2: Add operation history tests**

Test history entries store `operations` and `inverseOperations`, not repeated full project snapshots. Include drag end, text edit coalescing, batch paste, and AI suggestion batch application.

- [x] **Step 3: Implement scheduled persistence**

Expose immediate save for explicit save actions and scheduled save for normal project edits. Pointermove should not call either.

- [x] **Step 4: Implement operation history entry model**

Add `HistoryEntry` with `id`, `label`, `operations`, `inverseOperations`, and `createdAt`. Add coalescing rules for text edits and batch operations.

- [x] **Step 5: Verify**

Run: `pnpm test -- src/tests/persistenceHistoryPerformance.test.ts src/tests/axureOperations.test.ts`

Expected: PASS.

### Task 8: Async Analysis And Preview Performance

**Files:**
- Modify: `src/editor/AiPanel.tsx`
- Modify: `src/editor/ExportPanel.tsx`
- Modify: `src/runtime/*`
- Modify: `src/export/*`
- Test: `src/tests/previewPerformance.test.tsx`
- Test: `src/tests/plainPrdCanvasSemantic.test.ts`
- Test: `src/tests/aiRules.test.ts`

- [x] **Step 1: Add non-blocking analysis tests**

Test that PRD generation and AI checks are not invoked by simple selection, drag, viewport, or text input changes.

- [x] **Step 2: Gate PRD generation**

Run PRD export on explicit user export, or idle pre-generation only when explicitly enabled. Do not recompute on every project edit.

- [x] **Step 3: Gate AI checks**

Run AI checks from explicit user action or low-priority idle scheduling. Do not run during drag or text input hot paths.

- [ ] **Step 4: Optimize preview switch**

Preview should render the active Page Frame only, hide editor affordances, and lazy-load heavy runtime components where practical.

- [x] **Step 5: Verify**

Run: `pnpm test -- src/tests/previewPerformance.test.tsx src/tests/plainPrdCanvasSemantic.test.ts src/tests/aiRules.test.ts`

Expected: PASS.

### Task 9: Final Gates

**Files:**
- Modify: `docs/PERFORMANCE_BASELINE.md`
- Modify: `docs/PERFORMANCE_DECISION_LOG.md`
- Modify: `docs/PHASE_STATUS.md`
- Modify: `docs/QUALITY_GATES.md`
- Modify: `docs/TEST_MATRIX.md`

- [x] **Step 1: Run full command gate**

Run:

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm lint
```

Expected: all PASS. If lint is configured, it must pass.

- [ ] **Step 2: Manual UX latency pass**

Exercise drag, select, zoom, pan, box-select, copy/paste 50 nodes, right-click, library search, inspector switch, text edit, table edit, and preview switch. Record PASS or FAIL in `docs/PHASE_STATUS.md`.

- [ ] **Step 3: Architecture pass**

Confirm project data remains serializable, edit and preview read the same data, drag state is not stored in Project JSON, and no arbitrary JavaScript execution was introduced.

- [ ] **Step 4: Update docs**

Record final measurements, decisions, remaining risks, and gate results. Keep S4 blocked until S3 gates pass.

## Self-Review

Spec coverage: this plan covers baseline measurement, drag hot path, store splitting, viewport culling, heavy component rendering, component library performance, persistence/history, async PRD/AI/dependency work, preview switching, and final UX/QA/Architecture gates.

Placeholder scan: no task relies on TBD work; each task names files, tests, and expected verification commands.

Type consistency: the plan keeps Project JSON as the serializable source, keeps temporary drag state outside project data, and uses the user's requested `HistoryEntry` operation model.
