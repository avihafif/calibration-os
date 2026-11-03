# WP-1A-1c — interactive form controls

Status: Test/Simulation frontend foundation; review pending. No operational
calibration, metadata editing, persistence or publication.

## Implementation

- `@calos/ui-kit` provides controlled TextField, TextArea, NumberTextField,
  Select and Checkbox. Label, help and error IDs are explicit; required,
  disabled, read-only and invalid states are exposed to assistive technology.
- NumberTextField keeps decimal input as text. Its strict decimal check has a
  128-character bound and never converts through a JavaScript number. It is a
  UI-text demonstration, not a metrological quantity or parser.
- The Test AppFrame contains a synthetic local form with localized validation,
  reset and no submit effect. Production Rehearsal does not render or bundle
  the interactive form. There are no new dependencies, host calls or browser
  storage.

## Screenshots

- [English, light](form-en-light.png)
- [Hebrew, dark](form-he-dark.png)

## Local run (PowerShell)

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm --filter @calos/web dev --host 127.0.0.1
```

Open the Vite URL, choose English or Hebrew and a theme in the header, then
use the interactive form in the Test workspace. `pnpm build:web` and
`pnpm test:e2e` use the static preview. The full regression commands are in
the repository README.

## Verification on Windows, 2026-11-03

| Check | Result |
|---|---|
| TypeScript, browser types, ESLint, logical CSS | Passed |
| Changed-file Prettier | Passed |
| Vitest | 32/32 passed |
| Playwright | 6/6 passed; en/he interaction, axe, 12 locale/theme/viewport frame combinations, no-JS marking, network/storage denial |
| Architecture, design tokens, R-4 vectors | 77 negative probes; 24 contrast pairs; all vectors passed |
| Test and Production Rehearsal bundle checks | Passed; form omitted from rehearsal script |
| Python core/security, Ruff, mypy, imports | 35 + 14 tests; all checks passed |
| CycloneDX, licences, OSV, pnpm audit | 228 components; 0 advisories; no known vulnerabilities |

The full-tree Prettier command on this Windows worktree warns on 27 untouched
baseline files because their checkout line endings are CRLF. The changed-file
check passes; Linux CI must confirm the full-tree gate. F-05 CSP response
headers remain unimplemented, so this is not external-deployment readiness.
Hebrew terminology still needs glossary review (MI-31). Full Gate A0 and
GA0-16 remain closed.
