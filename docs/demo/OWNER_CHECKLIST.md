# OWNER_CHECKLIST.md — Demo V1 (S1) decisions and approvals still open

| | |
|---|---|
| Status | **Proposal, documentation only.** A summary of the checkpoints in [`CONTENT_DECK.md`](CONTENT_DECK.md), [`FIXTURES_SPEC.md`](FIXTURES_SPEC.md) and [`TEST_PLAN.md`](TEST_PLAN.md) for the product owner. It grants no approval, and every box is unchecked. An agent never ticks a box; the owner records a decision in the PR thread or by editing this file. |
| Already decided | DV-DEC-01 to DV-DEC-09 defaults were accepted on 2026-11-07 ([plan section 18.1](DEMO_V1_PLAN.md)). That record does not approve any value, name, string or test below. |
| Rule for defaults | An unanswered question keeps its listed default as the working assumption, and each PR says so. A default is **not** approval of the proposed fixture values, names or Hebrew text. |
| Gate | The first code PR (PR-1) must not start until every item marked **before PR-1** is closed. |
| Repository facts (2026-11-07) | PR #36 (N1) merged as `e47b961` and PR #38 (Demo V1 plan, wireframes) merged as `5c3b385`, both by the owner. A2 is **not** merged. These are facts about `main`; they are not any approval below. |

## A. Fixture values and structure (before PR-1)

| Done | ID | Decision | Default if unanswered |
|---|---|---|---|
| [ ] | FX-RC-01 | Types, ids, units and conventions (FIXTURES_SPEC sections 3 and 4) | Accept as written |
| [ ] | FX-RC-02 | Entity lists, counts and relationships: 6 customers, 8 assets, 10 work orders, 3 procedures, 1 scenario (section 5) | Accept as written |
| [ ] | FX-RC-03 | **Scripted `su` readings**: Option 1 (matches wireframes), Option 2 (opaque), or the owner's own values; confirm they carry no nominal, target or tolerance (section 6.3, FX-Q1) | Option 1, but only after you record it |
| [ ] | FX-RC-06 | The 15 fixture guards, and who keeps the denylist of real names and where (FX-Q5) | Owner keeps it in a reviewed file outside the published docs |
| [ ] | FX-RC-07 | Proposed isolation marker and sentinel names, as input to the separate gate review (section 10) | The exact diff is approved on its own PR (R5) |
| [ ] | FX-Q2, Q3, Q4, Q6 | Class labels A/B/C; fifth status "On hold"; Received work orders reviewable but not startable; run counter ids after an abort | As written in the spec |

## B. Fictional names (before PR-1)

| Done | ID | Decision | Default |
|---|---|---|---|
| [ ] | FX-RC-04 / CD-RC-06 | Names are generic and obviously fictional: "Synthetic customer 001..006", "Synthetic site 001..006", "Synthetic instrument class A/B/C", "Synthetic scripted/draft/retired procedure", ids `SYN-`, `SIM-`, `DEMO-`. Checked for trademark and look-alike risk (Q-08, MI-01) | Accept; contacts stay "not provided" |

## C. Bilingual content (before PR-2 and PR-3)

| Done | ID | Decision | Default |
|---|---|---|---|
| [ ] | CD-RC-01 | English wording of the deck (sections 2 to 9) accepted or amended | Accept as written |
| [ ] | CD-RC-03 | The protected disclaimers (section 10), including the English constants shown beside Hebrew | Accept exactly as written |
| [ ] | CD-RC-04 / TP-RC-02 | English and Hebrew lexicon lists and the allow-list (deck sections 12.3 and 13) | Accept; Hebrew list stays a proposal until the linguist reviews it |
| [ ] | CD-RC-05 | Open questions CD-Q1 to Q7: dashboard title ("Operations dashboard" vs "Lab overview"), "None need attention", the Hebrew match phrase, the term for the standards role, the wording of "Confirm", English under the Hebrew negations, feminine run-state forms | Defaults as listed in deck section 16 |
| [ ] | CD-RC-02 | **Hebrew terminology and text reviewed by a human linguist** (H-8). Every value stays `needs_review` until a named human changes it | Stays `needs_review` and visible; this may be deferred, not skipped |

## D. Test plan (before PR-1)

| Done | ID | Decision | Default |
|---|---|---|---|
| [ ] | TP-RC-01 | The test plan is the basis for PR-1 to PR-3 | Accept as written |
| [ ] | TP-RC-04 | Browser scope: Chromium automated; Edge, Firefox and Safari manual or by another work package (TP-Q1) | Chromium plus manual |
| [ ] | TP-RC-05 | Stop-ship rules S0 to S3 (section 15) | Accept as written |
| [ ] | TP-Q2, Q3, Q4 | Who keeps the Hebrew banned-stem list; repeat count for stateful runs; no screenshot baseline | Linguist with your approval; at least 10 runs; no baseline |

## E. Manual reviews (assign a named person and a date; unassigned means not verified)

| Done | ID | Review | Person | Needed by |
|---|---|---|---|---|
| [ ] | TC-MAN-08 | Hebrew read-through by a native reader and the linguist | | Before the demo is shown in Hebrew |
| [ ] | TC-MAN-01 to 03 | Screen readers: NVDA, JAWS, VoiceOver | | Before any accessibility claim |
| [ ] | TC-MAN-04 to 06 | Windows High Contrast, 200 and 400 percent zoom, display scaling | | Before any accessibility claim |
| [ ] | TC-MAN-07 | Edge, Firefox, Safari | | Before any cross-browser claim |
| [ ] | TC-MAN-09 | Stakeholder walk-through by someone who did not build it; record whether anyone read it as a real calibration | | Before showing the demo outside the team |
| [ ] | TC-MAN-10 | Print preview and "save as PDF" of the report page (not a supported feature; record what appears) | | Before the demo is shared |
| [ ] | TP-RC-03 | The assignment of the manual cases above is recorded | | Before PR-3 |

## F. Remaining approvals and gates (none is given by this document)

| Done | Item | Source |
|---|---|---|
| [ ] | A named **independent reviewer** for each tier (R1 fixtures and model, R2 widgets, R3 integration exact-SHA review), and human approval | DV-DEC-09, H-7, TP-RC-06 |
| [ ] | The owner's explicit assignment of each work package (PR-1, PR-2, PR-3) | H-1 style, plan section 18 |
| [ ] | The exact diff for the demo sentinel in `tools/check_frontend_bundle.mjs`, approved on its own PR | DV-DEC-05, R5 |
| [ ] | PR #36 (N1) is merged. Still unrecorded in the repository: owner acknowledgement of the forced-colors deviation P36-03 and the real Windows High Contrast review (both listed as open in `docs/wp-1a-1d/N1_EVIDENCE.md`); whether an independent audit and human approval preceded the merge is not shown by the PR (no GitHub review is recorded) | `N1_EVIDENCE.md`, H-7 |
| [ ] | A2: the owner assigns it, records D-A2-1 to D-A2-3 and H-4a, a named independent reviewer, then A2 is merged. Under P0 this comes before PR-1 as well as PR-3, unless the owner records a reviewed sequence change (P1) | SEQUENCE_AND_A2, plan section 13.3 |
| [ ] | This documentation PR (#39) merged by the owner after review. Merging #39 does not approve any value, name or string above | PR #39 |
| [ ] | Optional: redraw wireframes 01 and 02 with the seed values and five status bars | FIXTURES_SPEC section 12 |

Not part of Demo V1 and **unchanged**: Gate A0, H-2/GA0-16, the Builder, and every class C item (station, instruments, safety, metrology, authentication, signing, Production).
