# MVP_SPEC.md

## Product

Admin Prototype Studio is a browser-based structured admin prototype assembler for product managers and frontend collaborators. It helps users assemble admin pages from a component registry, configure interactions, preview real runtime behavior with mock data, run rule-based AI checks, and export Markdown PRDs.

## Target User

The first version serves one primary user: a product manager or frontend developer who needs a clickable admin prototype and PRD within 30 minutes.

## MVP Scope

P0 capabilities:
- Create and rename projects.
- Create, delete, rename, and switch pages.
- Add components from a registry into structured containers.
- Select components, delete components, reorder components within a parent, and edit common props.
- Configure and execute interactions for click, submit, change, rowClick, and search.
- Execute actions: openModal, closeModal, navigate, setVariable, refreshData, showMessage, resetForm, submitMock.
- Persist project data to localStorage.
- Run rule-based AI checks.
- Export Markdown PRD.

## Component Scope

MVP component types:
- PageContainer
- Section
- Card
- Button
- Input
- Select
- SearchBar
- Table
- Form
- Modal
- Drawer
- Tabs
- Message placeholder

## Non-goals

- No infinite canvas.
- No real backend or database.
- No production code generation or deployment.
- No multiplayer collaboration.
- No auth or enterprise RBAC.
- No arbitrary JavaScript execution.
- No real AI API calls in MVP.

## Default Demo

The built-in demo project is an ecommerce order admin:
- Order Management: SearchBar, Table, add order Button, add order Modal, export Button, row detail/refund/delete actions.
- Order Detail: Card, product detail Table, back Button.
- Refund Handling: Form with amount, reason, notes, submit and back buttons.

## Acceptance Scenarios

1. User sees the default ecommerce order project on first load.
2. User creates and switches pages.
3. User adds Button, Table, Form, and Modal components.
4. User edits button text, table columns, form fields, and modal title.
5. User toggles preview mode and executes configured interactions.
6. User clicks Add Order and opens a modal.
7. User submits a modal form and sees close, refresh, and success message behavior.
8. User runs AI checks and sees at least five structured findings.
9. User exports a Markdown PRD with project overview, pages, component tree, interactions, data fields, AI risks, and data sources.

## Scope Control

If time is constrained, cut visual polish and drag gestures before cutting the core loop:

```text
assemble page -> configure interaction -> preview runtime -> AI check -> export PRD
```
