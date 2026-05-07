# Performance Budget

Phase: `V1.1-S3-performance-and-canvas-interaction-hardening`

## Interaction Budgets

| Interaction | Budget |
| --- | --- |
| 300-node drag | No obvious stutter |
| 300-node click selection | < 100 ms |
| 300-node box-select | Smooth enough for continuous use |
| 50-node copy and paste | No editor freeze |
| Inspector selected-node switch | < 150 ms |
| Component library search | < 200 ms |
| Preview switch | No long main-thread freeze |
| Text input | No blocking from autosave, PRD, AI, or dependency analysis |

## Hot Path Rules

- Pointermove must not commit full Project JSON.
- Pointermove must not write history.
- Pointermove must not write persistence.
- Pointermove must not trigger PRD generation, AI checks, or dependency analysis.
- Drag visuals should use temporary drag state, CSS transform, and requestAnimationFrame throttling.
- Pointerup commits one final move operation.

## Rendering Rules

- Canvas nodes subscribe to their own node data, not the whole project.
- Viewport changes should not rerender inspector or component library.
- Inspector changes should not rerender unrelated canvas nodes.
- Component library state should not rerender the canvas.
- Viewport culling should skip real rendering for offscreen nodes.
- Heavy edit-mode components should use lightweight DesignRenderer.
- Preview mode should use RuntimeRenderer and render the active Page Frame only.

## Persistence And Analysis Rules

- Autosave must be debounced or idle-scheduled.
- History entries should store operations and inverse operations, not repeated full snapshots.
- PRD export should run on demand, or idle only when pre-generation is explicitly needed.
- AI checks should be user-triggered or low-priority idle work.
- Dependency analysis should update incrementally for relevant field, id, and interaction target changes.
