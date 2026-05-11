# Visual-First Workbench Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a project home screen, canvas size creation, isolated canvas zoom, current-page AI checks, and a task-oriented component library layout.

**Architecture:** Keep the app frontend-only and preserve the existing Zustand project store. The home screen becomes a lightweight route state in `App.tsx`; project canvas size is stored on the first Page Frame; AI rules gain a page-scoped entry point; component library grouping is a presentation layer over the existing manifest.

**Tech Stack:** React, TypeScript, Vite, Zustand, Ant Design, Vitest, React Testing Library.

---

### Task 1: Project Creation Canvas Size

**Files:**
- Modify: `src/project/ProjectManager.ts`
- Modify: `src/project/projectTemplates.ts`
- Modify: `src/project/projectStorage.ts`
- Modify: `src/domain/types.ts`
- Test: `src/tests/projectManager.test.ts`

- [x] Add `canvasWidth` and `canvasHeight` to create project options.
- [x] Create the first page frame using the requested size.
- [x] Include optional canvas size metadata in project summaries for home cards.

### Task 2: Home Screen

**Files:**
- Create: `src/project/ProjectHome.tsx`
- Modify: `src/App.tsx`
- Modify: `src/editor/workbench/WorkbenchShell.tsx`
- Test: `src/tests/projectHome.test.tsx`

- [x] Render project summaries as thumbnail cards before entering the editor.
- [x] Open an existing project by clicking its card.
- [x] Create a new project from the home screen and enter the editor.

### Task 3: Current Page AI Check

**Files:**
- Modify: `src/ai/rules.ts`
- Modify: `src/editor/workbench/TopToolbar.tsx`
- Test: `src/tests/aiRules.test.ts`
- Test: `src/tests/workbenchLayout.test.ts`

- [x] Add `runAiRulesForPage(project, pageId)`.
- [x] Make the top toolbar AI button open a modal with current-page rule results.

### Task 4: Component Library Layout

**Files:**
- Modify: `src/editor/components/ComponentLibraryPanel.tsx`
- Modify: `src/editor/workbench/WorkbenchLayout.css`
- Test: `src/tests/componentLibraryEditor.test.tsx`

- [x] Present categories vertically as task-oriented groups.
- [x] Show detailed components as a vertical list for the selected group.

### Task 5: Canvas Zoom Isolation

**Files:**
- Modify: `src/editor/AssemblyCanvas.tsx`
- Modify: `src/editor/editor.css`
- Test: `src/tests/canvasEditor.test.tsx`

- [x] Keep zoom state scoped to the scrollable canvas viewport.
- [x] Use an inner scaled surface with stable dimensions so workbench chrome is not scaled.
