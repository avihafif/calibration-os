# Phase 0A status and remaining decisions

Date: 2026-11-02. This document records implementation evidence and gaps; it
does not amend the supplied architecture or approve an ADR.

## Specification review

`AGENTS.md` and `docs/NO_CODE_ARCHITECTURE.md`, `docs/ARCHITECTURE.md`,
`docs/PRODUCT_REQUIREMENTS.md`, the capability matrix, roadmap, schema, API,
security, governance, metrology, builder, station and plugin specifications,
and ADRs were consulted. The 42 supplied files matched the handoff archive
byte for byte before implementation; baseline commit `bf6843a` records them.

Accepted ADRs: 0003, 0022, **0023 (Q-13)**, **0024 (Q-14)**. ADRs 0001–0002,
0004–0021 remain Proposed in their own status lines. Proposed decisions need
owner review before substantive Phase 1 implementation; Phase 0A implements
only a reversible skeleton and does not ratify them.

Open human inputs: **Q-15**, ownership/review of English and Hebrew authored
content; **MI-34**, named LSMA, Safety Officer, Quality Manager and Release
Manager holders and deputies. No names or sign-offs were invented. Real
instrument documentation, test points, limits, uncertainty and AHL content
remain unresolved metrology inputs.

## Acceptance checklist

| Phase 0A check                                         | Status          | Evidence / limit                                                                                                |
| ------------------------------------------------------ | --------------- | --------------------------------------------------------------------------------------------------------------- |
| Tracked specification baseline and modular skeleton    | Pass            | Git baseline and `apps/`, `packages/`, `schemas/`                                                               |
| API and station status routes                          | Local pass      | Loopback HTTP 200; both explicitly non-operational                                                              |
| React shell, generated TS type                         | Local pass      | `pnpm check:ts`, `pnpm build:web`                                                                               |
| Metadata fixture/schema/digest                         | Local pass      | 4 unit tests and `codegen --check`                                                                              |
| Python and TS lint, format, typing, import boundaries  | Local pass      | Ruff, mypy, import-linter, ESLint, Prettier, negative probes                                                    |
| Separate Compose definitions and generated credentials | Static pass     | `check_isolation.py --with-secrets` compares names, paths, bytes, ports, DB names/users, networks, volumes, IDs |
| Clean PostgreSQL migration and RLS                     | CI pending      | No Docker/psql on local host; CI job runs both migrations and RLS probe                                         |
| Both Compose stacks boot                               | CI pending      | No Docker on local host; GitHub Actions job added                                                               |
| Signed config/token rejection                          | Not implemented | No token, config import or signature endpoint exists                                                            |
| Real network isolation                                 | Not proven      | Static declarations only; infrastructure validation remains                                                     |
| Full secret scanning                                   | Partial         | Limited tracked-source patterns; broader scanning remains                                                       |

## Test gaps and safety limits

- P0A-G01: Signature verification, AHL pack loader and safety broker are absent.
  No hazardous or real transport path exists, so there is no bypass.
- P0A-G02: Authentication, authorization, station enrolment and signed
  deployment identity are absent. The identity equality primitive is not a
  security control by itself.
- P0A-G03: No release approval, production import, immutable published
  configuration or result path exists. `production_rehearsal` is a separate
  non-operational deployment, never operational Production.
- P0A-G04: The JSON Schema validator and type generator implement only the
  first closed-object subset. Full Draft 2020-12 conformance is not claimed.
- P0A-G05: PostgreSQL RLS has a migration and probe, but was not executed on
  the initial Windows host because Docker was unavailable.
- P0A-G06: Browser accessibility, RTL visual review, Windows service hosting,
  and real isolation tests are not yet done.

## Next Phase 0B task

Ratify the implementation-critical Proposed ADRs with designated owners,
decide Q-15 and assign MI-34 role holders. Then implement one authenticated,
signed, deployment-bound metadata package **verification-only** path with
tamper and cross-deployment negative tests. Keep it simulator-only and avoid
application authoring or hardware execution until its gates pass.
