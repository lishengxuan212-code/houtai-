# Admin Prototype Studio

Admin Prototype Studio is a browser-only MVP for assembling structured admin prototypes, configuring interactions, previewing runtime behavior, running rule-based AI checks, and exporting Markdown PRDs.

## Commands

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

## MVP Scope

- Frontend-only React application.
- Structured assembly area, not an infinite canvas.
- Serializable Project/Page/Component/Interaction model.
- localStorage persistence.
- Rule-based AI checks with a future adapter seam for real AI.
- Markdown PRD export.

## Default Demo

The app starts with an ecommerce order admin prototype containing:

- Order management page.
- Order detail page.
- Refund handling page.
- Search, table, modal form, drawer/detail, navigation, and mock submit interactions.

## Non-goals

- Real database.
- Production low-code deployment.
- Multiplayer collaboration.
- Enterprise auth/RBAC.
- Arbitrary user JavaScript.
