# ADR-0010: Decimal quantities with dimensions; no binary floats in records

Status: Proposed

## Context
Measurement values, limits and uncertainties must round-trip losslessly and evaluate identically across platforms. Binary floating point introduces representation and platform effects; unit confusion is a classic metrology defect.

## Decision
- Persisted values are **decimal strings + unit symbol** (`{"value":"…","unit":"…"}`); computation uses Python `decimal` with an explicit, recorded context (precision, rounding). TS never computes metrological values (display only).
- Units: SI-based registry with dimension vectors and exact decimal conversion factors; custom units via governed `UnitDefinition`. Dimension checks at design time and run time (ADR-0017).
- Parsing instrument responses: parser converts text → Decimal directly (no float intermediate).
- Statistical functions: implemented over Decimal where feasible; any function that must use float64 internally is flagged, golden-tested, and gated by `metrology_status` (MI-12).

## Consequences
+ Bit-reproducible evaluation; lossless storage. − Slower than float (irrelevant at SCPI rates); decimal `sqrt/ln/exp` need careful implementation/validation.
