# ADR-0018: Declarative drivers, hazard classes, and out-of-band safety profiles

Status: Proposed · **Amended by ADR-0023** (ownership, author≠approver rules, two-tier safety with immutable Absolute Hardware Limits)

## Context
The mandate requires a No-Code Driver Designer (SCPI templates, parsing, VISA config, simulation) while requiring hazardous operations to be permission-controlled and **hardware safety limits enforced outside editable workflows**.

## Decision
1. Drivers are **`DriverDefinition` configuration items**: connection profiles, identification rule, typed command templates with bounded parameters and formatters, declarative response parsers, error handling, lifecycle sequences, tracked driver state.
2. Procedures reference **named driver operations**, never raw text. The **driver interpreter** expands templates with typed formatting (no free interpolation; control characters rejected).
3. Every command has a **hazard class H0–H4** with permission gates for authoring and execution (NO_CODE_ARCHITECTURE §8.3).
4. **Safety Profiles** are a separate configuration kind with a separate permission (`safety.manage`/`safety.approve`), approval with separation of duties (Lab Safety/Metrology Administrator authors, Safety Officer approves, Quality Manager additionally for compliance-affecting changes — ADR-0023) and a separate signing context; they operate **inside** the Absolute Hardware Limits, which no configuration can override; they are enforced by the **Instrument Broker** after template expansion on every command. Applications may only narrow. Missing approved profile ⇒ H2+ commands cannot be published for real transports.
5. Communication-test tool: H0 default, hazardous only with explicit permission + bound profile + physical-presence confirmation; audited; not available in production runs.
6. Simulation is declarative (`SimulationProfile`), run by a generic simulator engine.

## Options
Code drivers per instrument (violates mandate); full scripting in drivers (unsafe); **declarative drivers + Class B escape hatch** (chosen).

## Consequences
+ Non-programmers author drivers safely; one enforcement point for safety. − Expressiveness limits for exotic protocols (matrix 1.13–1.16 → Class B); safety profile content depends on external inputs (MI-26) — real-instrument publishing blocked until supplied.
