# UX Acceptance

## Product Target

The product is a Canvas-first Backoffice Prototype Editor.

Users should feel that they are arranging a backoffice prototype on an Axure-like canvas, not configuring a visible data model.

## S4 Workflow Acceptance

- Holding Space changes the canvas to pan mode; left-drag pans the viewport without selecting or moving components.
- Space typed inside text editing, inspector inputs, tables, and forms remains normal text input and does not pan the canvas.
- Middle mouse pans the canvas.
- Home or Fit View centers the current Page Frame.
- New, pasted, and template-inserted components appear above existing components.
- Layer management supports top, bottom, forward, backward, drag reorder, lock, unlock, hide, show, rename, group, and ungroup.
- Templates can be saved for pages, frames, blocks, groups, components, and presets; saved templates persist after refresh.
- Inserting a template generates new ids and preserves internal interaction references.
- Recent Used records components, ProComponents, prototype widgets, presets, component templates, group templates, and page templates without duplicates.
- Runtime preview can show, hide, toggle visibility, enable, disable, toggle disabled, open/close modal or drawer, navigate, show messages, set text/values, reset forms, refresh tables, select tabs, and scroll to components.
- Common S4 operations are available through visual controls, context menus, shortcuts, inspector fields, or library/template panels without raw project editing.

## S3 Performance Acceptance

- Dragging components feels smooth on a 300-node page.
- Clicking a component on a 300-node page selects it within 100 ms.
- Box-select and multi-select remain responsive on large pages.
- Zooming and panning do not cause visible layout reflow lag.
- Copying and pasting 50 components does not freeze the editor.
- Right-click menus open immediately.
- Inspector switching completes within 150 ms.
- Component library search completes within 200 ms for common Chinese and English terms.
- Text editing, table column editing, and table row editing are not blocked by autosave, PRD generation, AI checks, or dependency analysis.
- Preview switching renders the active Page Frame only and does not show grid, guides, selection boxes, or resize handles.

## Prototype Widget Library

- Component library includes H1, H2, H3, body text, helper text, link text, error text, annotation, sticky note, rectangle, circle, line, arrow, image, icon, placeholder, divider, hot zone, module title, page title, status label, amount text, numeric text, and time text.
- Text widget cards show clear previews such as H1, H2, H3, body text, helper text, link text, error text, status text, and amount text.
- Text widgets support double-click editing on the canvas.
- Text widgets expose visual controls for content, font size, font weight, font color, font family, line height, letter spacing, alignment, underline, strikethrough, background, border, radius, padding, width, height, wrapping, and ellipsis.

## Content And Data Editing

- Dropdown menu items can be added, deleted, renamed, sorted, disabled, marked as dangerous, assigned icons, and connected to click actions.
- Select, Radio, Checkbox, Cascader, TreeSelect, Menu, Tabs, Steps, Collapse, Breadcrumb, Timeline, Carousel, Tree, List, and ProList expose visual item editors.
- Table and ProTable expose visual editors for columns, rows, and row actions.
- EditableProTable exposes visual editors for columns, rows, editable rules, add row behavior, delete row behavior, edit row behavior, and row actions.
- Form and ProForm expose visual editors for fields, default values, validation, layout, and submit buttons.
- Modal and Drawer expose visual editors for title, content, and footer buttons.

## Infinite Canvas

- Users can create and rename page frames.
- Users can place components at arbitrary positions inside a page frame.
- Users do not need to create a section or container before placing ordinary components.
- Users can drag, resize, box-select, multi-select, zoom, pan, align, distribute, copy, paste, delete, lock, hide, group, and ungroup components.
- Users can use grid, snap, guides, and rulers.
- Left outline and canvas selection stay synchronized.
- Context menu includes copy, paste, delete, rename, group, ungroup, lock, hide, bring to front, send to back, and save as template.
- Keyboard shortcuts include Ctrl/Cmd+C, Ctrl/Cmd+V, Delete, Ctrl/Cmd+Z, and Ctrl/Cmd+Shift+Z.

## Preview

- Preview renders the current page frame only.
- Preview does not show grid, guides, rulers, selection boxes, or drag handles.
- Preview uses the same component content, data, and events edited in the canvas.
- In edit mode, clicking selects a component. In preview mode, clicking executes the configured interaction.

## PRD

- PRD does not output coordinates.
- PRD does not output implementation vocabulary or internal model names.
- PRD is organized by page and module.
- PRD describes module purpose, displayed content, fields, buttons, dropdown items, table fields, row actions, form submission results, page jumps, popups, success prompts, failure prompts, and empty states.
