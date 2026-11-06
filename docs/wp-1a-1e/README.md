# WP-1A-1e — specification package

**Status: proposed specification (documentation only).** It describes work for a future, manually assigned Codex PR. It contains no application code, changes no workflow, ADR status or governance record, and approves nothing. Autonomous development remains disabled.

| File | Purpose |
|---|---|
| [`SPECIFICATION.md`](SPECIFICATION.md) | Scope, deviations from the review plan, measured baseline, and the criteria (RO, KB, HS, CS, WE, FS, PS, SR, AB) with verification |
| [`TASKS_AND_TESTS.md`](TASKS_AND_TESTS.md) | PR split, tasks T0–T10 with allowed paths, test inventory, normative tables, manual checklist, evidence template |
| [`HUMAN_APPROVALS.md`](HUMAN_APPROVALS.md) | Every approval a human must give (workflow edit, gate edit, router, Edge source), decisions with defaults, and the proposed workflow job as text |
| [`CODEX_HANDOFF.md`](CODEX_HANDOFF.md) | The prompt to paste when the owner assigns the package |

The implementing PR adds its own `EVIDENCE.md` here; it does not edit these files except to correct an error it can show.

## GO / NO-GO recommendation for the next development stage

| Question | Recommendation |
|---|---|
| Adopt this specification as the basis for WP-1A-1e? | **GO**, after the owner answers or accepts the defaults in `HUMAN_APPROVALS.md` §2. |
| Assign WP-1A-1e to Codex? | **Conditional GO**: only after WP-1A-1d (PR #25) is human-approved and merged by the owner. The independent review of PR #25 found no open Blocker or High finding at `207599a`; the owner's approval and merge are still required. |
| Edit the Windows/Edge workflow? | **NO-GO until H-3** (and H-5) are given in the PR thread. The code PR (A) does not depend on it. |
| Edit the bundle gate for relative asset URLs? | **NO-GO until H-4**. Without it, drop the sub-path requirement (RO-09) and record the deviation. |
| Add `react-router`? | **NO-GO** by default; the in-house router needs no dependency. |
| Anything involving a real host adapter, `fetch`, storage, the Station Agent, schemas, a Finding or HostStatus contract, Builder screens, authentication or instruments? | **NO-GO.** Out of scope for this package and gated elsewhere. |

A GO here is a planning recommendation. It is not a safety, security, metrology or operational approval, and it is not a substitute for independent review and human GitHub approval of the implementing PR.
