# Lead architect / UX / engineering review — 2026-11-03

| | |
|---|---|
| Status | **Documentation-only recommendations; nothing approved, no gate changed, no code changed.** An agent-written review; it is not an independent human review and does not replace the owner's decisions. |
| Baseline reviewed | `main` @ `b0ccadf`: WP-1A-1a and WP-1A-1b merged; autonomous development disabled |
| Scope | Frontend (`i18n`, `ui-kit`, `apps/web`), planning for WP-1A-1c…1e, Builder readiness (WP-1A-2/3), offline Windows station architecture |
| Method and limits | Source and document reading; test/CI counts quoted from the repository's own records, not re-run here. Real screen-reader, Windows/Edge and hardware behaviour were **not** verified. |

## Documents
| File | Answers |
|---|---|
| [01 Implementation assessment and findings](01_IMPLEMENTATION_ASSESSMENT_AND_FINDINGS.md) | What exists vs prototype vs planned; findings LA-01…LA-18 by severity |
| [02 Frontend requirements and acceptance criteria](02_FRONTEND_ACCEPTANCE_CRITERIA.md) | Form controls, data views, schema-driven boundaries, metadata-editing prerequisites, responsive, en/he RTL, offline-compatible frontend; **the contract for the next Codex PR** |
| [03 Builder readiness and H-2 proposal](03_BUILDER_READINESS_AND_H2_PROPOSAL.md) | Exactly what is open before WP-1A-2/3 (BR-01…BR-12), proposed H-2/GA0-16 resolution, decision proposals LA-DP-01…06 |
| [04 Offline station architecture review](04_OFFLINE_STATION_ARCHITECTURE_REVIEW.md) | Station Agent, Local API, SQLite journal, sync, update: risks ST-01…ST-15, spikes SP-1…SP-6, order of work |
| [05 Next three work packages](05_NEXT_THREE_WORK_PACKAGES.md) | Recommended order and plans for WP-1A-1c, 1d, 1e |

## Summary
**Current state.** A small, well-bounded, non-operational frontend foundation: strict package boundaries, protected TEST/SIMULATION markings, en/he with pseudo-locales, light/dark tokens, an enterprise `AppFrame`. No Critical findings. The Python/station side is a stub; nothing operational exists.

**Highest-priority findings.**
1. **LA-01 / ST-01 (High)** — the product is described as an offline Windows *desktop application*; the only documented delivery is a local web app, and every station ADR except the SQLite journal is still *Proposed*.
2. **LA-02 (High)** — WP-1A-1c is defined three different ways; adopt one split before the next task (proposal: 1c forms, 1d read-only data views, 1e routing + host status + Windows CI).
3. **LA-03 (Medium)** — Ctrl+K command palette fails under a Hebrew keyboard layout (`event.key` vs `event.code`).
4. **LA-04…LA-09 (Medium)** — form primitives are not yet sufficient; dialog, glyph icons vs ADR-0015 B4, 32–36 px targets vs the 44 px station default, no forced-colors support.
5. **ST-02…ST-05 (High)** — Windows SQLite durability, Local API security (the open F-05), offline identity/time, and offline update/rollback need decisions and spikes *before* operational station code.

**Recommended order.** Re-baseline and adopt (0) → WP-1A-1c → 1d → 1e, while decision records (BR-01…BR-10) and spikes (SP-1…SP-6) proceed in parallel as documentation. WP-1A-2/3 start only on the entry conditions in 03 §2. The Builder is not started; H-2/GA0-16 has a concrete proposal (03 §4) awaiting a named decision.

**Explicit blockers.** Builder: BR-01 (H-2/GA0-16), BR-02, BR-03, BR-04, BR-08, BR-10 (and BR-06 if a kind embeds the environment vocabulary), BR-09 for 1A-3. Station: LA-DP-01, Q-06/Q-07, D-25, ADR-0009/0012/0014 ratification. Governance: one person holds the architecture, security and legal designations (BR-12; LA-DP-05).

**Next step requested of the owner:** record outcomes for LA-DP-01/02 (and, when ready, LA-DP-03…06), then assign WP-1A-1c manually using the contract in 02 §8. This review stops here and awaits the next manually assigned task.
