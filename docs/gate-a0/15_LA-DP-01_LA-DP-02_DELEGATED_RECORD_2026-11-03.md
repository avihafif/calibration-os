# 15 — LA-DP-01 and LA-DP-02: planning decisions recorded for the product owner

| | |
|---|---|
| Decision date | 2026-11-03 |
| Accountable holder | **Avi Hafif** ([@avihafif](https://github.com/avihafif)) — product owner, designated Architecture owner ([11](11_ROLE_DESIGNATION_RECORD.md)) |
| Record type | **User-authorized, assistant-entered.** The assistant's lead-architect review ([PR #19](https://github.com/avihafif/calibration-os/pull/19), `docs/review/lead-architect-2026-11-03/`) asked which decisions to record before WP-1A-1c is assigned. The owner answered, in the active conversation, *"LA-DP-01 ו-02"*. The owner's answer names the two proposals; it was read as "record them as recommended". This file and its Git/PR history are the audit trail. It is **not** a signature, **not** an independent review, and the review it relies on is itself agent-written. |
| Scope | **Planning direction only.** No ADR changes status, no code, workflow, dependency or gate changes. Full Gate A0 stays closed. |

## Recorded outcomes

| ID | Item | Outcome | Conditions and notes |
|---|---|---|---|
| LA-DP-01 | Station delivery model | **Direction adopted for planning; ADR-0011 is NOT ratified by this record** | Plan on the documented baseline: a Windows-service Station Agent installed by an MSI that serves the React build on loopback, opened in Edge/Chrome app-mode. Electron and Tauri stay outside the baseline (`AGENTS.md §12`). A thin WebView2 host is evaluated only in spike SP-6 and, if chosen, by a new ADR. ADR-0011, ADR-0012, ADR-0014 and ADR-0009 remain **Proposed** until a ratification PR follows the spikes SP-1…SP-6 (the review's [04 §3](../review/lead-architect-2026-11-03/04_OFFLINE_STATION_ARCHITECTURE_REVIEW.md)). The frontend must stay host-neutral meanwhile. |
| LA-DP-02 | Re-baseline of the WP-1A-1 remainder | **Adopted** | **1c** form foundation; **1d** read-only data views and the generic findings list; **1e** hash routing, host-status contract, CSP-ready build and Windows/Edge + forced-colors CI. This replaces, **for planning and assignment**, the 1c/1d/1e definitions in [10 §2](10_WP-1A-1_SCOPED_READINESS_AND_APPROVALS.md) and in `docs/autonomy/tasks.json` and prompts (which are not edited here; autonomous development is disabled). The acceptance criteria and the contract for the next Codex PR are in [`02_FRONTEND_ACCEPTANCE_CRITERIA.md`](../review/lead-architect-2026-11-03/02_FRONTEND_ACCEPTANCE_CRITERIA.md) §1–§8 and the plan in [`05_NEXT_THREE_WORK_PACKAGES.md`](../review/lead-architect-2026-11-03/05_NEXT_THREE_WORK_PACKAGES.md). |

The review documents live in PR #19; the relative links above resolve once it is merged. If PR #19 changes materially before merging, the criteria referenced here are those in the merged text; this record adopts the **split and direction**, not any individual wording.

## What this record does **not** do
* It does not approve or assign WP-1A-1c; assignment remains a manual act by the owner, with an independent reviewer named and human GitHub approval before merge.
* It does not decide LA-DP-03 (H-2/GA0-16), LA-DP-04 (ratify or scope ADR-0010/0013/0017/0020), LA-DP-05 (independent review capacity) or LA-DP-06 (spike plans), nor any Builder or station gate.
* It does not touch metrology, safety, trust or identity, fonts, Hebrew terminology review, or Production.
* It does not replace an independent review; the concentration of roles in one person is noted in [11](11_ROLE_DESIGNATION_RECORD.md).
