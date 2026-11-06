# WP-1A-1e — human approvals and decisions

Nothing in this PR or in the specification grants any of these. Agents (including the reviewer of this document) cannot approve them. Each approval must be given by the owner **in the pull-request thread**, quoting what is approved, and applies only to that PR.

## 1. Approvals required (explicitly flagged)

| ID | Approval | Who | Needed before | Notes |
|---|---|---|---|---|
| H-1 | **Assign WP-1A-1e** to Codex (manual) and name the independent reviewer | Product owner | any code | Requires WP-1A-1d (PR #25) merged first; the owner, not an agent, merges. |
| H-2 | **Router choice** D-E1: in-house hash router (default) or `react-router@8.5.0` | Architecture owner, Security reviewer | T2 | The in-house default needs no approval beyond H-1. The library option changes `package.json` and `pnpm-lock.yaml`, needs the ADR-0026 evidence re-run at install time (audit, OSV, SBOM, licence, library-mode constraints, lint forbidding `ScrollRestoration`, loaders, actions, `<Form>`, `useFetcher`) and a reviewer who checks the lockfile diff. |
| **H-3** | **Workflow edit: `.github/workflows/phase0a.yml`** adds one `windows-latest` + Edge Playwright job | Product owner (workflows are governance-controlled) | the workflow commit | Approve the **exact diff** in §3. No other workflow line may change. Whether the job becomes a *required* status check is a repository setting only the owner can change; that is a separate decision. |
| H-4 | **Bundle-gate edit** `tools/check_frontend_bundle.mjs`: relative stylesheet link, failure on root-absolute `src`/`href`, third sentinel, inline-script/style scan | Architecture owner | the gate commit | AGENTS.md §8 requires a human before a CI gate is weakened. The edit is intended to be strictly stronger, but it replaces the literal `href="/status.css"` check, so the owner confirms it is not a weakening. If declined, record the deviation from OF-02 and drop RO-09. |
| H-5 | **Edge acquisition**: use the preinstalled Edge on `windows-latest` only | Security reviewer | the workflow commit | `playwright install msedge` downloads a second browser and is **not** covered by ADR-0026 §5 (which allows the pinned Chromium download only). The job must fail if Edge is missing rather than download it. |
| H-6 | **Visual-baseline policy**: no pixel-baseline assertions in this package | Architecture owner | EVIDENCE sign-off | Default recommended; a future Linux-only baseline policy would be a separate docs decision. |
| H-7 | Independent review (not the author's agent) and **human GitHub approval** for each PR | Owner, reviewer | merge | Agent reviews are not approvals. |
| H-8 | Hebrew strings stay `needs_review` | Human linguist (MI-31/Q-15) | any claim of reviewed terminology | No agent may mark Hebrew reviewed. |
| H-9 | Any change to the strict-CSP policy string | Security reviewer | change | The test constant must equal OF-09; do not relax it to make a test pass. |

Nothing here touches ADR statuses, Gate A0, authentication, instrument communication, metrology, safety, trust roots, signing keys, Production, or the Station Agent.

## 2. Decisions, with defaults

If the owner does not answer, the recommended option is the working assumption and the PR says so.

| ID | Decision | Recommended | Alternative | Effect of the alternative |
|---|---|---|---|---|
| D-E1 | Router | In-house hash router | `react-router@8.5.0`, library mode only | H-2 evidence and lockfile review; lint forbids the storage/network APIs |
| D-E2 | PR split | Two PRs (A then B) | One PR | One larger review; the Windows job approval (H-3) can block everything |
| D-E3 | Relative asset URLs and the gate edit | Yes (`base: "./"`) | Keep absolute URLs and record a deviation from OF-02 | No sub-path test; embedding under a path prefix stays impossible |
| D-E4 | Windows job required check | Not required in the first PR | Required from the start | A flaky runner would block merges |
| D-E5 | Route set | overview, technical, forms, data, host | exactly the three routes in 05 §4 | Drops `technical` and `host`; host-status states would need another home |
| D-E6 | F6 target | Region container | First focusable child | Faster entry, risk of unintended activation; needs a different KB-02 |
| D-E7 | Host simulator route | Test-only `#/host` page | Controls on an existing page | Same sentinel rules apply |

## 3. Proposed workflow job (text only; **not applied** by this PR and **unverified** on a runner)

To be added to `.github/workflows/phase0a.yml` only after H-3, H-4 and H-5 are answered. It reuses the same pinned actions and Node version file as the existing `frontend-browser` job; it adds `permissions: contents: read`, which is stricter than the file's default. No secrets, no new actions, no `playwright install`.

```yaml
  frontend-browser-windows-edge:
    runs-on: windows-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11.25.0
      - uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: pnpm
      - run: pnpm install --frozen-lockfile --ignore-scripts
      - run: pnpm build:web
      - name: Require the preinstalled Microsoft Edge and print its version
        shell: pwsh
        run: |
          $edge = Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'
          if (-not (Test-Path $edge)) { throw 'EDGE_NOT_PREINSTALLED' }
          (Get-Item $edge).VersionInfo.ProductVersion
      - run: pnpm test:e2e:edge
      - name: Upload Windows/Edge screenshots
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: wp-1a-1e-edge-screenshots
          path: artifacts/screenshots/
          if-no-files-found: warn
```

Open points the first run must settle: whether Edge is preinstalled at that path on the current runner image, whether the pnpm cache behaves on Windows, and the total run time against the 10-minute target. Do not run Prettier's full-tree check on this job: Windows checkouts convert line endings, and the Linux `typescript` job remains the authoritative format gate.

## 4. Evidence the owner should expect before approving

The criterion-to-test table; the Edge job log (after H-3); the CSP run showing 0 violations **and** the negative controls firing; the host-status screenshots in en and he; the list of what was **not** verified (real screen readers, real High Contrast themes, real display scaling, browser `F6` precedence, Station Agent header delivery).
