# NO_CODE_CAPABILITY_MATRIX.md

| | |
|---|---|
| Status | Draft 0.1 |
| Purpose | State, honestly and per operation, what can be done **without software development**, what is **configuration-driven**, and what **genuinely requires new software** |
| Governance | Reviewed at every platform release (NFR-16); every DEV row carries a justification and a "path to NC" note |
| Related | [NO_CODE_ARCHITECTURE](NO_CODE_ARCHITECTURE.md) · [BUILDER_SPEC](VISUAL_APPLICATION_BUILDER_SPEC.md) |

## Legend

| Class | Meaning |
|---|---|
| **NC** | **Fully No-Code**: done in a graphical designer by a trained calibration engineer/administrator. No code, no command line, no database access. |
| **CFG** | **Configuration-driven**: no code, no command line, done through the GUI, but needs *structured configuration inputs* (imports of tables, certificates, key material, trust decisions) or a one-time governed *platform setup* by an administrator/IT. |
| **DEV** | **Requires new software development** (platform release or Class B Trusted Plugin). Listed with the reason. |
| **REL** | **Controlled release**: not no-code configuration and not a source change — a signed artifact produced through a governed ceremony (e.g., Hardware Limits Pack). Graphical tooling prepares it; signing uses offline keys; no application, administrator or API can edit it. |
| **GOV** | Deliberately *not* a free self-service operation: it is available through the GUI but gated by governance (approval, separation of duties, two-person rule). Combined with NC/CFG, e.g. `NC·GOV`. |

Assumption (A-16): the instrument speaks an ASCII SCPI/IEEE-488.2-style protocol over a transport that a core adapter supports (VISA: LAN, USB, GPIB, serial).

## 1. Instrument and driver definition

| # | Operation | Class | Tool | Notes |
|---|---|---|---|---|
| 1.1 | Add manufacturer / family / model | NC | Instrument editor | |
| 1.2 | Define functions, ranges, installed options, capabilities | NC | Instrument editor | Values come from documentation (MI-01) |
| 1.3 | Define identification rule (`*IDN?` parse, option query) | NC | Driver Designer | Regex/field-split parsers |
| 1.4 | Configure connection profile (VISA resource pattern, LAN/USB/GPIB/serial parameters, timeouts, terminators) | NC | Driver Designer | Depends on adapter availability on stations |
| 1.5 | Author SCPI command templates with typed parameters, bounds, formatting | NC·GOV | Driver Designer | H2+ hazard commands need extra permission/review |
| 1.6 | Author response parsers (number+unit, enum map, lists, regex, IEEE block, register bits) | NC | Driver Designer | Parser types are catalog items |
| 1.7 | Reusable command libraries | NC | Driver Designer | |
| 1.8 | Per-command retry / timeout / error-queue handling | NC | Driver Designer | Retry disallowed for non-idempotent hazard classes |
| 1.9 | Author simulated instrument responses & faults | NC | Driver Designer (Sim) | Behavioral fidelity limited by profile expressiveness |
| 1.10 | Communication test & diagnostics (H0) | NC | Comm Test | Sandboxed, audited |
| 1.11 | Hazardous communication test (H2+) | CFG·GOV | Comm Test | Needs bound Safety Profile, permission, physical confirmation |
| 1.12 | Define / change **Safety Profile** envelopes (narrow-only within AHL) | CFG·GOV | Safety Console | LSMA authors; Safety Officer approves; Quality Manager additionally if compliance-affecting (ADR-0023); values are inputs (MI-35); not editable by app builders or platform admins |
| 1.13 | Instrument speaking **binary / proprietary framing** | **DEV** | Class B protocol plugin | Reason: parsers/formatters are ASCII-oriented; path to NC: add generic "binary frame" parser/formatter blocks after ≥2 real cases |
| 1.14 | Instrument only controllable via **vendor SDK/DLL (IVI-COM, native)** | **DEV** | Class B plugin | Reason: requires executing vendor code; isolation required |
| 1.15 | New **transport kind** (e.g., Modbus, CAN, raw sockets beyond VISA) | **DEV** | Class B transport plugin | Core ships VISA + simulator |
| 1.16 | Stateful multi-step instrument protocols that cannot be expressed as command templates + state variables | **DEV** (rare) | Class B | Reason: expressiveness boundary |
| 1.17 | Install VISA backend / drivers on station PC | CFG | IT / installer | Outside the platform's UI by nature; documented prerequisite |
| 1.18 | Define / change **Absolute Hardware Limits** (Hardware Limits Pack) for an instrument or standard | **REL** | Safety Console (candidate) + offline threshold signing | Not configuration: immutable to no-code; values MI-26; signing custody MI-33; required before any H2+ operation on real hardware |

## 2. Procedures and workflows

| # | Operation | Class | Tool |
|---|---|---|---|
| 2.1 | Build procedure with drag-and-drop nodes | NC | Procedure Designer |
| 2.2 | Setup / teardown / safe-state lifecycle | NC | Procedure Designer |
| 2.3 | Conditions, branches, bounded loops, delays, wait-until | NC | Procedure Designer |
| 2.4 | Retries, controlled error handling, escalation to operator | NC | Procedure Designer |
| 2.5 | Reusable sub-procedures; clone & compose | NC | Procedure Designer |
| 2.6 | Manual technician instructions with media, confirmations, typed inputs | NC | Procedure Designer |
| 2.7 | Variables, parameter binding, typed expressions | NC | Expression editor |
| 2.8 | Measurement acquisition (N readings, settle, aggregation) | NC | Procedure Designer |
| 2.9 | Pass/fail (limit-check) criteria | NC | Procedure Designer + Spec editor |
| 2.10 | As Found / As Left phases | NC·GOV | Procedure Designer |
| 2.11 | Adjustment steps (H3) / repair records | NC·GOV | Procedure Designer | Per-application validation; disabled for real instruments until approved (MR-AFL-07) |
| 2.12 | Pause / resume / recovery policy per node | NC | Procedure Designer |
| 2.13 | Simulate, debug (breakpoints, inspector, fault injection) | NC | Simulation Lab |
| 2.14 | Compare versions, roll back | NC | Version compare / Deployments |
| 2.15 | **Parallel** execution of independent instrument sequences | **DEV** | Engine feature | Reason: engine is sequential in v1 by design (determinism, resume); path to NC: add `flow.parallel` block with deterministic join semantics |
| 2.16 | Unbounded / data-dependent iteration without a declared bound | **Not supported by policy** | — | Design principle (termination) |
| 2.17 | Free-form scripting inside a procedure | **Not supported by policy** | — | Use a Class B function/step block instead |

## 3. Metrology configuration

| # | Operation | Class | Tool |
|---|---|---|---|
| 3.1 | Specification tables, limits, accuracy expressions | NC | Spec editor (also CSV/XLSX import = CFG) |
| 3.2 | Limits policy (spec vs tightened vs customer) | NC·GOV | Metrology workspace |
| 3.3 | Correction factors / sets | NC·GOV | Metrology workspace |
| 3.4 | Uncertainty budgets (components, distributions, sensitivity) | NC·GOV | Budget editor |
| 3.5 | Reference standard roles, required capability, selection rules | NC | Builder |
| 3.6 | Register reference standards & certificate data | CFG | Standards register (data entry/import) |
| 3.7 | TUR policy & guard banding | NC·GOV | Metrology workspace |
| 3.8 | Decision rules (simple / guard-banded / zone-based) | NC·GOV | Metrology workspace |
| 3.9 | CMC constraints | NC·GOV | Metrology workspace |
| 3.10 | Units & conversions (derived/custom units) | NC·GOV | Unit editor — SI base locked |
| 3.11 | Rounding rules | NC·GOV | Metrology workspace |
| 3.12 | Reusable calculations with test vectors | NC | Expression editor |
| 3.13 | **New numerical method** (e.g., Monte Carlo propagation variant, spline fit, FFT-based analysis) not in function library | **DEV** | Platform release or Class B algorithm plugin | Path to NC: once added, it's a catalog function with `metrology_status` review |
| 3.14 | New uncertainty-combination method beyond GUM-linear/MC | **DEV** | Platform | |
| 3.15 | Approving a function's `metrology_status` for production | CFG·GOV | Metrology approval | Needs metrologist sign-off (MI-12) |

## 4. UI, forms and navigation

| # | Operation | Class | Tool |
|---|---|---|---|
| 4.1 | Forms, fields, validation rules, conditional visibility | NC | UI Builder |
| 4.2 | Tables & columns, saved views | NC | UI Builder |
| 4.3 | Instrument-specific operator screens | NC | UI Builder |
| 4.4 | Menus & navigation, custom pages | NC | UI Builder |
| 4.5 | Dashboards & widgets (from catalog) | NC | UI Builder |
| 4.6 | Themes, colors, logos, typography | NC | Theme editor (contrast validated) |
| 4.7 | Translations & terminology (he/en) | NC | Localization workspace |
| 4.8 | Add a **new locale** (e.g., Arabic, Russian) | CFG | Localization workspace; DEV only if font/shaping/formatting support is missing |
| 4.9 | **New widget kind** (e.g., specialized waveform viewer, 3D) | **DEV** | Platform release (Class B widget plugins are not supported in v1: they would run in the browser and enlarge the trusted base) |
| 4.10 | Arbitrary custom JavaScript / HTML in a page | **Not supported by policy** | — |
| 4.11 | Embedding external web content (iframes) | **Not supported by policy** (default) | Could be an admin-allow-listed block via platform release |

## 5. Reports and certificates

| # | Operation | Class | Tool |
|---|---|---|---|
| 5.1 | Design layouts with branding, tables, charts, conditional sections | NC | Report Designer |
| 5.2 | Dynamic data binding to dataset contract | NC | Report Designer |
| 5.3 | Multi-language templates | NC | Report Designer + Localization |
| 5.4 | PDF export | NC | Report Designer |
| 5.5 | Signature blocks & approval workflow definition | NC·GOV | Report Designer + Workflow editor |
| 5.6 | Legally qualified e-signature / PKI-signed PDF | CFG·**DEV?** | Depends on Q-03/Q-12: key/cert provisioning is CFG; a new signing provider is DEV |
| 5.7 | Extend dataset contract with new lab-specific **fields** (data captured by forms/procedures) | NC | Dataset contract editor |
| 5.8 | New **chart type** or report block kind | **DEV** | Platform release |
| 5.9 | Machine-readable output formats (XML/JSON per customer schema) | CFG (mapping templates) / **DEV** if new serializer | |

## 6. Governance, deployment and administration

| # | Operation | Class | Tool |
|---|---|---|---|
| 6.1 | Draft/review/approve/publish | NC | Governance console |
| 6.2 | Approval matrices, separation of duties | NC·GOV | Admin |
| 6.3 | Impact analysis & dependency view | NC | Governance console |
| 6.4 | Export/import application packages | NC | Builder / Admin |
| 6.5 | Deploy (assign) to labs/stations; canary; rollback | NC | Deployments |
| 6.6 | Provision separate Test and Production deployments (databases, secrets, networks, agents) | CFG | Deployment guide / installer (infrastructure outside the product UI; ADR-0024) |
| 6.7 | Config backups & restore | CFG | Admin |
| 6.8 | Users, roles, permissions | NC | Admin |
| 6.9 | OIDC SSO configuration | CFG | Admin (IdP-side setup by IT) |
| 6.10 | Lab policies (gates, staleness, SoD) | NC·GOV | Admin |
| 6.11 | Enroll stations | CFG | Admin + station installer |
| 6.12 | Install / enable **Class B plugin** | CFG·GOV | Admin (trust decision, capability review) |
| 6.13 | Write a **new Class B plugin** | **DEV** | SDK |
| 6.14 | Add a **new configuration kind** | **DEV** | Platform release (registry + schema + validators + editor binding) |
| 6.15 | Add a new **approval step type** to governance workflows | **DEV** | Platform |
| 6.16 | Integrate with LIMS/ERP | CFG (generic webhook/export mapping, if provided) / **DEV** (custom connector) | Roadmap P5+ |
| 6.17 | Upgrade agent/runtime | CFG | Secure update channel (IT-governed) |
| 6.18 | Release a package from Test to Production (candidate, approvals, export, import, validation, release) | NC·GOV | Release management console |
| 6.19 | Manage Trusted Release Issuers in Production | CFG·GOV | Admin (dual control: admin proposes; QM + Safety Officer approve) |
| 6.20 | Change production policies/thresholds | NC·GOV | Change Requests |
| 6.21 | Grant privileged roles (safety/approval) | NC·GOV | Admin (dual control, toxic-combination validation) |

**Phase 0B implementation status for row 6.4:** a verification-only, signed
`Manufacturer` metadata envelope is checked in a protected Test API route when
test trust material is injected. This does not import a configuration item,
create a version, approve, release, assign, or provide a graphical workflow.
The row's NC classification describes the target product capability, not a
claim that the complete operation is implemented. Trust-root and authentication
policies remain dependent on Proposed ADR-0004 and ADR-0014.
Phase 0B hardening also enforces package size and JSON complexity limits,
strict time strings and distinct JWT/package public-key roles. These are
runtime verification controls, not authored application behavior or a new
configuration kind. The [Phase 0C proposal](PHASE0C_PROPOSAL.md) keeps the
future GUI and lifecycle work gated by the relevant ADRs.

**R-4 schema engine status (merged):** the generic validator and type
generator now understand a bounded closed-object subset with local definitions,
exactly-one unions, constants, integer bounds, unique arrays, and inert
versioned editor hints. This is platform **DEV** work under row 6.14; it does
not create a new configuration kind or make rows 1.1/4.1 operationally No-Code.
The test-only proof schema is not in the kind registry. Editor rendering,
governed drafts, and Production publication remain unimplemented.

**WP-1A-1a frontend status:** compiled en/he **system** bundles, ICU plurals,
RTL/LTR switching, pseudo-locales, bidi/formatting helpers, hard-coded-string
lint and a non-operational React demonstration exist in Test/simulation scope.
These are trusted platform **DEV** building blocks for the future No-Code UI;
they do not implement rows 4.1–4.5, a `TranslationBundle` configuration kind,
generic forms, authored-content translation, governance or Production authoring.
Hebrew wording remains `needs_review` pending MI-31, and H-2/GA0-16 remains
open for the editor vocabulary.

**WP-1A-1b hardening status:** protected Test/Simulation markings, no-JS
fallback, content error boundary, safe technical-text display, tighter import
and UI-string checks, and browser pseudo-locale coverage are platform UI
infrastructure. They add no No-Code editor capability or operational
publishing. Local desktop hosting remains a future host integration; no
mandatory cloud or instrument access is introduced in React.

**WP-1A-1b UI Kit status:** the shared semantic-token package, accessible
controls and AppFrame are reusable platform **DEV** infrastructure. The
English/Hebrew light/dark shell remains a static simulation demonstration.
Its local host seam accepts injected content and navigation; there is no
Builder, metadata-backed screen, lifecycle action or operational station
integration yet. Rows 4.1–4.5 remain unimplemented.

**WP-1A-1c form-control status:** TextField, TextArea, string-only decimal
input, native Select and Checkbox are generic trusted platform **DEV**
primitives. The Test-only form demonstrates local validation and reset with
synthetic UI text, not a metadata-backed `UiForm` or instrument-model editor.
Production Rehearsal excludes the interactive form. Row 4.1 remains a future
No-Code configuration capability; no new configuration kind or operator screen
is implemented.

**WP-1A-1c-2 hardening status:** generic field IDs, localized required text,
focusable error summary, blur validation, bidi and forced-colors support are
trusted platform **DEV** additions to those controls. The Test demonstration
remains memory-only and its compiled sentinel is rejected from Production
Rehearsal. This does not implement a metadata-driven form renderer or change
the classifications in rows 4.1–4.5; see
[`docs/wp-1a-1c/FORM_HARDENING.md`](wp-1a-1c/FORM_HARDENING.md).

**WP-1A-1d read-only views status:** generic `DataTable`, `DetailList`,
`StatePanel` and `FindingsList` are trusted platform **DEV** primitives for
display only. The Test-only demonstration uses synthetic UI labels. It does not
render authored metadata, interpret schemas, persist records or add an
operational view. The `FindingsList` accepts a local display shape; a shared
Finding contract and finding-key namespace remain separate decisions. See
[`docs/wp-1a-1d/READ_ONLY_VIEWS.md`](wp-1a-1d/READ_ONLY_VIEWS.md).

**WP-1A-1e-A status:** exact hash routing, localized navigation/search, F6
region navigation, a responsive shell, and a UI-side fake `HostStatusView` are
trusted-platform **DEV** primitives. They do not interpret authored metadata,
define a configuration kind, connect to a host or enable an operational action.
Search folding is limited to palette labels and keywords; it never defines
identifier equality or sorting. The fake host-status port accepts local
synthetic snapshots only. Untrusted host input normalization and real
deployment-identifier validation remain blocked pending N-1 review (PR #27).
Relative sub-path assets remain blocked on H-4; see
[`WP-1A-1e-A evidence`](wp-1a-1e/EVIDENCE.md). Matrix row counts are unchanged.

## 7. Summary

| Class | Count (this version) | Comment |
|---|---|---|
| NC (41 plain + 17 `NC·GOV`) | 58 | Ordinary application creation/maintenance is entirely here; `·GOV` rows are GUI operations gated by approval/permissions |
| CFG (8 plain + 5 `CFG·GOV`) | 13 | Inputs or one-time setup, still GUI-based |
| Mixed CFG / DEV | 3 | GUI configuration covers the common case; a new provider/serializer would be DEV (rows 5.6, 5.9, 6.16) |
| DEV | 12 | New protocol/transport, vendor SDK, new numerical method, new widget/report-block kind, new config kind, new Class B code, parallel flow |
| REL (controlled release) | 1 | Absolute Hardware Limits (row 1.18): signed pack, offline threshold signing, immutable to no-code |
| Not supported by policy | 4 | Intentional: arbitrary scripts/HTML, iframes, unbounded loops |
| **Total rows** | **91** | Counted from the tables above at this revision; re-count at each review |

**Reading the DEV rows:** none is needed to create or maintain an application for an ASCII-SCPI instrument. DEV items **grow the catalog**; after a block exists, it is NC for everyone.

## 8. Mandatory acceptance operations vs this matrix

| Acceptance op (AC-NC) | Matrix rows | Class |
|---|---|---|
| 01 Create instrument model | 1.1, 1.2 | NC |
| 02 Communication config | 1.3–1.8 | NC·GOV (H0/H1 no extra gate) |
| 03 Procedure from reusable steps | 2.1–2.8 | NC |
| 04 Standards, measurements, limits, calculations | 3.1, 3.5, 3.12, 2.9 | NC |
| 05 Operator interface | 4.1–4.3 | NC |
| 06 Report design | 5.1–5.4 | NC |
| 07 Test against simulator | 1.9, 2.13 | NC |
| 08 Publish and install on compatible station | 6.1, 6.5 | NC (station pre-enrolled: 6.11 CFG, one-time) |
| 09 Modify and republish | 2.14, 6.1 | NC |
| 10 Roll back | 2.14, 6.5 | NC |

## 9. Review process
1. At each release candidate, engineering and a calibration engineer walk this matrix.
2. Any new operation that required a code change in the last release is added as DEV, with justification.
3. For DEV rows touched ≥2 times, product decides whether to add a catalog block to convert it to NC (tracked in roadmap).
