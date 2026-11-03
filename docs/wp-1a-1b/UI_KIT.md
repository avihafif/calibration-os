# WP-1A-1b shared UI Kit and AppFrame

The stacked implementation PR creates `packages/ts/ui-kit`, an approved
React/TypeScript workspace package below `apps/web`. It depends only on React
and the platform `i18n` package. The application composition root supplies
locale, theme, deployment kind, navigation labels and workspace content.
There is no runtime API call, browser storage, cloud SDK, instrument access,
operational control or model-specific screen. This shape is compatible with
a future locally hosted Windows desktop frontend and injected host ports;
the Station Agent, local API/SQLite and sync remain separate work.

## Components

- Light and dark approved semantic tokens, system-font stacks, spacing and
  focus rules. The token gate checks 24 text/control contrast pairs and exact
  protected safety/status colors.
- Reusable `Button`, `Input`, `Select`, `Badge`, `Card`, `Notification` and
  keyboard-trapped `Dialog` primitives, all strictly typed.
- `AppFrame` with logical-direction sidebar, topbar, content workspace,
  status footer, mobile navigation and Ctrl/Cmd+K navigation palette. Its
  controlled theme state lives only in React memory.
- `ProtectedMarkings` and the content error boundary moved to `ui-kit`. The
  build-time HTML/CSS fallback remains outside React and survives disabled
  JavaScript. Test and Production Rehearsal builds retain distinct labels.

The shell uses simple in-page anchors in this milestone. Full routing,
Builder workspaces, accounts, local host adapters and operational actions are
outside WP-1A-1b. Hebrew terminology remains `needs_review` under MI-31.

## Review evidence

The browser suite checks English/Hebrew × light/dark × 320/768/1440 px,
including no horizontal clipping and computed protected colors. It also
checks mobile drawer focus return, Ctrl+K, the no-JavaScript fallback, axe
accessibility for the four desktop combinations, and the original RTL and
pseudo-locale behaviors. Unit tests cover form semantics, icon + text status,
disabled controls and dialog focus. Screenshots from the real app are
[`en light`](frame-en-light.png), [`he light`](frame-he-light.png),
[`en dark`](frame-en-dark.png), [`he dark`](frame-he-dark.png),
[`en mobile`](frame-en-mobile.png) and [`he mobile`](frame-he-mobile.png).

Local run on 2026-11-03: 24 unit tests, five browser tests, 77 negative
architecture probes, 24 contrast pairs, all strict TypeScript and formatting
gates, Test/Production Rehearsal build checks, 228-component CycloneDX
licence/OSV inventory with zero advisories, and `pnpm audit` clean. The
inherited Python suite passed 35 core and 14 security tests, Ruff, mypy and
four import contracts. The PR's Linux CI run is the independent repeat.

Run from the repository root with Node 22.22.2+ and pnpm 11.25.0:

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm --filter @calos/web dev --host 127.0.0.1
pnpm check:ts
pnpm lint:ts
pnpm lint:logical-css
pnpm test:design-tokens
pnpm test:ts-boundary
pnpm test:frontend
pnpm build:web
node tools/check_frontend_bundle.mjs
pnpm test:e2e
```

The static Vite preview and Compose stacks are non-operational rehearsal
artifacts, not approved desktop packaging or external deployment. **F-05
remains open:** no CSP response headers or browser enforcement test exists.
Full Gate A0 and the GA0-16 hint vocabulary remain closed. A documented
independent review is required before this implementation PR merges.
