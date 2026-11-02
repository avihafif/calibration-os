# 06 — Simulation Lab, safety, governance and metrology UX

## Simulation Lab
- **Always identified**: document banner, sticky "SIMULATION ONLY" badge, "NON-OPERATIONAL / no hardware access" chips, `simulated` flag on every wire record and result. No control disables these.
- **Controls**: Run (animated, pausable), Step into, Step over, Next event, Continue to breakpoint, Run to end, Speed, Simulate crash, Reset. Run is disabled with a reason while validation has errors; warnings (e.g. unresolved inputs) do **not** block, so the failure can be explained.
- **Inspection**: Trace (filter, hide low-level events, event detail with chained hash), Variables (typed values + safe **watch expression**, cannot mutate), Wire log (command text, reply, status, `NOT SENT` for blocked), Results (limit-check labels), Report preview.
- **Scenarios & faults**: seeded scenarios (nominal/marginal/failing); fault injection: timeout, garbled reply, instrument error entry, disconnect, unsafe level request; one-shot or persistent; can be added while paused.
- **Operator prompts** block until answered; stepping never answers them.
- **Recovery**: "Simulate crash" → resume panel with the plan (verify same instrument, safe source, re-establish state, step policy). Non-repeatable steps require an explicit operator decision. *Prototype simplification*: instrument state is restored from the last checkpoint rather than re-asserted through the Broker (D-13).
- **Failure explanation**: code, plain language, node link, step error policy, attempts, safe-state result, fixes (Metrology / Safety / node).
- **Report preview**: permanent watermark, uncertainty and conformity "not evaluated", partial marker, disabled approve/issue/remove-watermark.

## Safety UX
- **Absolute Hardware Limits**: read-only card (pack, signer, scope, target, limit); the "Edit hardware limits" control exists only as a disabled-with-reason explanation. Simulator-scope pack is synthetic (deep-frozen in the prototype; test asserts nothing writes it).
- **Safety Profile**: governed lifecycle — LSMA proposes (value > AHL refused with PR-023), Safety Officer approves, Quality Manager co-approves a *widening*; author ≠ approver; withdrawal by Safety Officer makes every hazardous step blocked (fail closed). Procedure side shows the pinned profile (selection is a governed decision, not a free setting — D-14).
- **Effective envelope** = AHL ∩ profile ∩ step bound, drawn plus table; test points outside are marked.
- **Hazard warnings**: hazard path, coverage, PR-010/018/019/023 findings; Broker order shown: hazard permission → envelope → state → write.
- **Blocked operations** list from the last run (value, limit, source).
- **Permissions matrix** shown to users (proposal pending D-15).

## Governance UX
Version compare (id-aware, class suggestion, overlay), review workflow with reasons and digests, separation of duties, Production release blocked with explanation. Step-up is **simulated** (real enforcement server-side).

## Metrology UX
Synthetic unit system with dimension checks and an expression sandbox; test-point table with explicit inclusivity (no default), `Input required` markers per field, computed acceptance interval, provenance chips (verified/approved settable by governance only); decision rules (limit check enabled; guard-banded and conformity locked with reasons); uncertainty budget skeleton (not evaluated; MI-17, MI-27); reference-equipment roles (MI-06; registry not in prototype); result-interpretation vocabulary (Within limits / Outside limits / Input required / Not evaluated — never pass/fail, never conformity); traceability (digests, provenance counts, what blocks release).
