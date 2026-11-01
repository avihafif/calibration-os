# ADR-0011: Station UI delivered as a local web app

Status: Proposed

## Context
Operators need a full UI with no network. The baseline is React + TypeScript; Electron/Tauri are not in the baseline.

## Decision
The Station Agent serves the **same React build** (Operator shell + UI runtime) from `127.0.0.1` on a random-but-persisted port with a per-session token; the OS launches a browser in app/kiosk mode (Edge/Chrome). The UI talks only to the Local API. No remote content, strict CSP (no `unsafe-eval`), `Host`/`Origin` allow-list (DNS-rebinding defense), cookies `SameSite=Strict`, token-bound sessions.

## Options
Electron (bundles Chromium, larger patch surface, new stack), Tauri (Rust toolchain), native WinUI (violates stack). **Local web app** chosen.

## Consequences
+ One UI codebase; offline; simple updates (UI ships with agent version). − Depends on an installed Chromium-based browser (Edge ships with Windows 10/11); kiosk hardening is IT-owned.
