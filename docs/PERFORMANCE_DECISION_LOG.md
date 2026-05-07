# Performance Decision Log

Phase: `V1.1-S3-performance-and-canvas-interaction-hardening`

## Decisions

- Enter S3 before adding AI, dependency linkage, more components, or complex interaction configuration.
- Optimize measured editor hot paths first: drag, select, zoom, pan, copy, paste, inspector switching, component library search, preview switching, autosave, and history.
- Treat Project JSON as cold serializable source data and temporary drag or viewport state as hot UI state.
- Do not commit Project JSON, history, persistence, PRD generation, AI checks, or dependency analysis during pointermove.
- Prefer operation-based history entries over full project snapshot piles.
- Use viewport culling for large canvases.
- Use lightweight DesignRenderer for heavy edit-mode components and RuntimeRenderer for preview.
- First implementation slice keeps selection in `projectStore` to limit blast radius, but moves drag/resize and viewport state into dedicated hot stores.
- Normal project mutations now schedule persistence; explicit project save paths still use immediate save.
- Component library cards now use static previews by default instead of mounting Ant Design or ProComponents previews for every card.
- Table, Form, ProTable, EditableProTable, and ProForm use lightweight edit-mode design renderers; preview mode keeps the existing runtime rendering path.
- AI checks and PRD generation are explicit actions, not project-change memoized computations.

## Open Decisions

- Whether remaining selection, inspector, library, runtime, and history state should fully leave `projectStore` in the next slice.
- Whether viewport culling should use a custom intersection helper or a virtualized canvas layer abstraction.
- Whether PRD and AI idle work should remain on the main thread with requestIdleCallback or move to a Web Worker.
- Whether performance debug metrics should be development-only or user-toggleable in the editor.
