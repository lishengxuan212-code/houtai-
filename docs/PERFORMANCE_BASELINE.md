# Performance Baseline

Phase: `V1.1-S3-performance-and-canvas-interaction-hardening`

Status: initial baseline and first hardening slice recorded.

## Metrics To Capture

| Metric | Current Result | Target Budget |
| --- | --- | --- |
| Current page node count | Pending | Reported in debug panel |
| Visible node count | Pending | Reported in debug panel |
| Selected node count | Pending | Reported in debug panel |
| Canvas render count per selection | Pending | No whole-canvas rerender for single selection |
| Node render count per selection | Pending | Selected node and affected adorners only |
| Store update count during drag | Initial issue found: pointermove previously called `apply()` | Drag store only during pointer movement |
| Persistence writes during drag | Initial issue found: `apply()` previously called synchronous `saveProject()` | 0 |
| History entries during drag | No operation-history stack existed before S3 | 0 until pointerup |
| Drag frame smoothness at 300 nodes | Pending | No obvious stutter |
| Selection latency at 300 nodes | Pending | < 100 ms |
| Inspector open or switch latency | Pending | < 150 ms |
| Component library search latency | Pending | < 200 ms |
| Preview switch latency | Pending | Acceptable, no long freeze |
| Autosave duration | Pending | Idle or debounced, not in hot path |

## Initial Audit Questions

- Does pointermove commit project data, history, persistence, PRD generation, AI checks, or dependency analysis? Initial finding: drag and resize pointermove committed `updateNodeCanvas`; fixed in first S3 slice so pointermove updates temporary canvas interaction state and pointerup commits once.
- Does selection subscribe node components to whole-project data?
- Does inspector switching rerender the whole canvas or component library? Pending deeper audit.
- Does component library search mount real Ant Design or ProComponents previews for every result? Initial finding: library cards mounted preview renderers; fixed in first S3 slice with static previews, debounced search, and visible-result limiting.
- Does preview render non-active Page Frames or edit-mode assistance layers?
- Does history store full project snapshots instead of operations? Initial operation-based `HistoryEntry` model added; full undo/redo stack integration remains pending.

## First S3 Slice Notes

- Added performance counters and a dev-only Performance Debug panel.
- Added `useCanvasInteractionStore` for temporary drag/resize state.
- Added `useCanvasViewportStore` for zoom state.
- Added viewport culling helpers and wired canvas rendering to visible node ids.
- Changed drag and resize so Project JSON is not updated during pointer movement.
- Changed normal project `apply()` persistence to scheduled persistence instead of synchronous localStorage writes.
- Added static component library previews and debounced search.
- Added lightweight edit-mode renderers for Table, Form, ProTable, EditableProTable, and ProForm.
- Changed AI checks and PRD export to run only on explicit user action.

## Verification Snapshot

- `pnpm typecheck`: PASS
- `pnpm test`: PASS, 50 files / 141 tests
- `pnpm build`: PASS, Vite still reports a large main chunk
- `pnpm lint`: PASS

## Baseline Command Notes

Run normal correctness checks before and after performance changes:

- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm lint`
