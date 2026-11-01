# ADR-0005: Class B plugin isolation and capability broker

Status: Proposed

## Context
Class B plugins execute third-party or specialized code on stations that control instruments. Python offers no in-process sandbox. Class A needs no isolation (no code) but its *commands* must still be mediated (ADR-0018).

## Decision
- Class B plugins run in **separate OS processes**, spawned by the plugin host: Windows Job Object (kill-on-close, memory/CPU limits), restricted token / low-privilege account, working directory in a plugin-specific data folder, outbound network blocked by a per-executable firewall rule, filesystem access limited to declared paths.
- The plugin has **no direct access** to VISA handles, the journal, the config store or secrets. It communicates over an authenticated local IPC channel (named pipe + session key; gRPC or length-prefixed msgpack) with the **Broker**, which enforces **declared capabilities** (transports, command patterns/hazard classes, storage quota, UI events) per call.
- Hard timeouts, heartbeat, crash isolation: plugin failure → node failure, never agent failure (FS-07).
- Honest limit: isolation + capabilities are **defense in depth**, not a guarantee against a malicious signed plugin; the primary control is publisher vetting, code review, signing, and revocation.

## Options
1. In-process with import restrictions — trivially bypassable. Rejected.
2. WASM sandbox — strongest isolation but poor fit for PyVISA/vendor DLLs and Python ecosystem. Future option for algorithm-only plugins.
3. Containers on station (Windows containers/WSL2) — heavy and fragile on benches. Rejected for v1.
4. **Out-of-process + Job Object + broker** — chosen.

## Consequences
+ Crash/hang containment; capability audit trail; mediation point for hazard/safety enforcement.
− IPC latency per call (acceptable for SCPI timescales; measure under NFR-09).
− Windows-specific hardening code; Linux CI uses an abstraction with fake isolation plus Windows runners for real tests.
