# PLUGIN_SDK_SPEC.md

| | |
|---|---|
| Status | Draft 0.2 — rebased on the two-class extension model |
| Related | [NO_CODE_ARCHITECTURE §3, §6](NO_CODE_ARCHITECTURE.md) · [SECURITY_MODEL §8–10](SECURITY_MODEL.md) · [ADR-0004](adr/0004-package-signing-and-trust.md) · [ADR-0005](adr/0005-plugin-isolation-and-broker.md) |

## 1. Purpose and classes

| | Class A — Application Package (`.calapp`) | Class B — Trusted Technical Plugin (`.calplug`) |
|---|---|---|
| Contents | Configuration items only | Python code + manifest (+ optional declarative content) |
| Authored in | Application Builder (no code) | An IDE with this SDK |
| Executes | Never executes code; interpreted by trusted runtime | Out-of-process, capability-gated |
| Spec | §2–§5 (packaging/signing/compat common) | §2–§12 |

**Who needs this document?** Class B developers, security reviewers, release engineers. Calibration engineers building Class A applications **do not need the SDK** (NFR-16).

### 1.1 What Class B may provide (v1)

| `provides.category` | Description | Notes |
|---|---|---|
| `transport` | New transport/protocol adapter (e.g., a non-VISA bus) | Runs in plugin process; I/O brokered |
| `parser` / `formatter` | New response parser or parameter formatter type usable in Driver Definitions | e.g., binary frame parser |
| `function` | New expression-library function(s) | Pure; deterministic; declares `metrology_status`; golden vectors required |
| `step` | New step type implementation (schema + executor) | Executes via broker API only |
| `connector` (post-v1) | External-system integration (LIMS/ERP) | Needs network capability; extra review |
| *(not in v1)* | UI widgets, report blocks, config kinds | Require platform release (they run in the browser/renderer and expand the trusted base) |

## 2. Package formats

### 2.1 `.calapp` (Class A)
```
<application>-<version>.calapp   (ZIP, deterministic ordering, no symlinks, max sizes enforced)
├─ manifest.json                 # ApplicationManifest + closure digests
├─ items/<kind>/<key>/<version>.json
├─ assets/<sha256>.<ext>         # logos, images, fonts (allow-listed MIME)
├─ tests/…                       # ApplicationTest items
└─ signatures/manifest.sig       # Ed25519 detached signature + signer key id + trust chain refs
```
### 2.2 `.calplug` (Class B)
```
<plugin-id>-<version>.calplug    (ZIP, deterministic)
├─ plugin.manifest.json          # §3
├─ payload/                      # Python source or wheels (vendored; no network install at runtime)
│   ├─ <pkg>/…
│   └─ requirements.lock         # hashes pinned
├─ schemas/                      # JSON Schemas for provided steps/functions/parsers
├─ i18n/                         # translation bundles (optional)
├─ tests/                        # conformance tests (not executed on stations)
├─ sbom.cdx.json                 # CycloneDX
└─ signatures/
    ├─ manifest.sig              # publisher signature
    └─ platform-countersig.sig   # added after platform review
```
Rules: all file digests listed in manifest; unknown files rejected; archive-bomb limits; path traversal rejected; deterministic build recommended and checked (reproducibility attestation optional).

## 3. Class B manifest

```json
{
  "manifest_version": 1,
  "id": "com.example.binary-frame-protocol",
  "name": { "en": "Binary frame protocol pack" },
  "version": "1.2.0",
  "publisher": { "name": "Example Ltd", "key_id": "ed25519:ab12…" },
  "kind": "technical-plugin",
  "sdk_api": ">=1.0 <2.0",
  "requires": {
    "platform": ">=1.0 <2.0",
    "python": "3.12",
    "os": ["windows-x86_64"],
    "catalog": {},
    "plugins": [ { "id": "com.example.other", "range": ">=1.1 <2" } ]
  },
  "entry": { "module": "binary_frame.plugin", "factory": "create_plugin" },
  "provides": [
    { "category": "parser", "type_id": "parser.binary_frame", "version": "1.0",
      "schema": "schemas/parser.binary_frame.schema.json" },
    { "category": "function", "type_id": "fn.fft_peak", "version": "1.0",
      "signature": "(list<quantity<V>>, quantity<Hz>) -> quantity<Hz>",
      "metrology_status": "pending_review",
      "golden_vectors": "tests/golden/fft_peak.yaml" }
  ],
  "capabilities": {
    "transport": [],
    "scpi": { "allow": [], "hazard_max": "H0" },
    "filesystem": { "read": [], "write": ["$PLUGIN_DATA/cache"], "quota_mb": 50 },
    "network": { "egress": [] },
    "ui": { "prompts": false },
    "secrets": [],
    "cpu_ms_per_call": 200,
    "memory_mb": 256
  },
  "attestations": {
    "review_ticket": "SEC-123",
    "license": "SPDX-License-Identifier: …",
    "build": { "reproducible": true, "builder": "…" }
  }
}
```

### 3.1 Signing (summary)
Canonical manifest (RFC 8785) hash covers all file digests; Ed25519 publisher signature; **platform countersignature** after security review; trust chain verified against station-held trust roots; TUF-style metadata gives freshness and revocation (ADR-0004). Verification at: upload, enable, install/stage, **every load**.

## 4. Capability model

Capabilities are **declared**, **reviewed**, **granted per lab at enablement**, and **enforced by the broker per call**. Undeclared = denied; denial is journaled/audited.

| Capability | Grammar | Examples / Notes |
|---|---|---|
| `transport` | list of kinds & address patterns | `["visa:GPIB*", "serial:COM*"]` for a transport plugin |
| `scpi.allow` | command-pattern allow-list + `hazard_max` | Patterns are matched against **expanded** command text; plugin-issued wire traffic still passes hazard + Safety Profile checks |
| `filesystem` | read/write path templates (`$PLUGIN_DATA`, `$RUN_DIR`) + quota | Default none |
| `network.egress` | host:port allow-list | Default none; connectors only |
| `ui.prompts` | bool | May request operator prompts through engine (not arbitrary UI) |
| `secrets` | named secret refs | Resolved by broker; never exposed to logs |
| `cpu_ms_per_call`, `memory_mb` | numeric | Enforced via Job Object and call timeouts |
| `journal.write` | none | Plugins **cannot** write the journal; results flow through engine APIs |

Escalation rule: a plugin version that adds capabilities requires re-review and re-enablement (not auto-updated).

## 5. Compatibility checks

Evaluated centrally (deployment matrix) and locally at install, enable, and **run start**:

| Check | Fails when |
|---|---|
| `sdk_api` range | Host SDK API outside range |
| `requires.platform` | Agent/runtime version outside range |
| OS/arch/Python | Mismatch |
| Catalog `type_id` collisions | Two plugins provide same `type_id`+major |
| Dependencies | Missing/incompatible plugin dependencies; cycle |
| Trust | Signature/chain invalid, key revoked, metadata expired |
| Capability policy | Lab policy forbids a requested capability |
| Schema versions | Provided schemas incompatible with installed catalog majors |
| Package `requires` | Class A package needs `type_id` not provided by installed plugins |

Result is a structured report `{ok, findings[{code, severity, message, remediation}]}` shown in Deployments and `Admin → Plugins`.

## 6. Runtime and IPC protocol (plugin ↔ agent)

- Transport: Windows named pipe (per-plugin, ACL'd to the plugin process SID) + per-session key; framing: length-prefixed MessagePack (or gRPC over pipe); max message size; per-call deadlines.
- Process: spawned by plugin host with: Job Object (kill-on-close, CPU/memory limits), restricted token / low-integrity, working dir `$PLUGIN_DATA`, environment scrubbed, **no inherited handles**, firewall rule blocking all egress unless declared.
- Lifecycle messages: `hello{plugin id, sdk_api}` → `ready{provides}` → `call{id, type_id, args, deadline, run_ctx}` → `result|error` ; `heartbeat` every N s; `shutdown`.
- Host services available to plugin via IPC: `broker.instrument.write/query/read(handle, bytes, deadline)` (capability-checked, hazard + safety enforced, logs wire evidence), `log.emit(level, msg, fields)` (redacted), `time.monotonic()` (read-only), `storage.get/put` (quota), `prompt.request` (if declared), `secret.resolve(name)`.
- Determinism contract for `function` plugins: no I/O, no time, no randomness; inputs/outputs typed per signature; calls are pure and cacheable.
- Failure semantics: timeout/crash ⇒ call error `E_PLUGIN_*`, process killed and (optionally) restarted with backoff; three strikes ⇒ plugin disabled for the station pending admin action.

## 7. SDK API (Python, `calos_plugin_sdk`)

```python
from calos_plugin_sdk import Plugin, provides, Quantity, Decimal, ParseResult, StepContext, errors

class MyPlugin(Plugin):
    api_version = "1.0"

    @provides.function("fn.fft_peak", version="1.0", metrology_status="pending_review")
    def fft_peak(self, samples: list[Quantity["V"]], fs: Quantity["Hz"]) -> Quantity["Hz"]: ...

    @provides.parser("parser.binary_frame", version="1.0", schema="schemas/parser.binary_frame.schema.json")
    def parse_frame(self, raw: bytes, cfg: dict) -> ParseResult: ...

    @provides.step("step.example_probe", version="1.0", schema="schemas/step.example.json")
    def probe(self, ctx: StepContext, args: dict) -> dict:
        resp = ctx.instrument(args["role"]).query(b"…", deadline=ctx.deadline)   # brokered
        return {"value": Quantity.parse(resp.decode(), "V")}

def create_plugin() -> Plugin: return MyPlugin()
```
Rules:
- SDK types are **stable public API** (semver on `sdk_api`); everything outside `calos_plugin_sdk` is private and import-blocked (import-linter + runtime import hook in plugin process).
- All metrological values use `Quantity` (decimal); using `float` for returned quantities is a conformance failure.
- Step executors are **cooperatively cancellable** and must declare `resume_policy` default and `hazard` upper bound; the engine—not the plugin—persists state.
- A `step` provided by a plugin gets an auto-generated editor form from its schema; editor hints in the schema (`x-calos-editor`) control grouping, labels (localized), pickers.

## 8. Conformance test kit and developer workflow

`calos-plugin-dev` CLI (developer-side only; not required by Class A users):

| Command | Purpose |
|---|---|
| `init` | Scaffold plugin project from template |
| `validate` | Manifest/schema/capability lint; import-boundary check |
| `test` | Run unit tests + **conformance suite** (determinism, timeouts, memory, forbidden imports, typed IO, golden vectors) |
| `sim-run` | Execute plugin inside a local host harness with simulator and fake broker; fault injection |
| `pack` | Deterministic `.calplug` build + SBOM |
| `sign` | Publisher signature (HSM/KMS supported) |
| `submit` | Upload for platform review (to registry API) |

Conformance suite blocks submission on: undeclared capability use (detected via instrumented broker), non-deterministic function outputs, excessive resource use, unhandled cancellation, secrets in logs, floats in quantities, missing golden vectors, missing schemas/translations for required locales.

## 9. Lifecycle: review, publish, enable, install, update, revoke

```mermaid
sequenceDiagram
  actor Dev as Plugin developer
  participant R as Registry (Central)
  actor Sec as Security reviewer
  actor Adm as Lab admin
  participant S as Station Agent
  Dev->>R: submit .calplug (publisher-signed)
  R->>R: verify sig chain, manifest, sbom, conformance report
  Sec->>R: review (code review, capability review) → approve + platform countersign
  Adm->>R: enable version for lab (capability grant recorded, audit)
  R->>S: signed assignment manifest (via feed) incl. plugin digests
  S->>S: verify → stage → compatibility check → install into versions/<id>/<ver>
  S-->>R: activation report
  Note over S: Load: re-verify signature & digest; spawn isolated process
  Dev->>R: (later) publish 1.2.1
  Adm->>R: enable 1.2.1 (diff of capabilities; re-review if widened)
  R->>S: new manifest; S stages side-by-side; old version kept for in-flight runs
  Sec->>R: revoke 1.2.0 (compromise) → revocation metadata
  S->>S: on next feed: block new loads of 1.2.0; flag affected runs
```
Side-by-side versions: runs pin the exact plugin version; activation of a newer version never changes an in-flight run.

## 10. Versioning
- Plugin: SemVer. `sdk_api` and `requires.platform` ranges are mandatory.
- `provides` entries carry their own `version` (catalog `major.minor`); breaking schema change ⇒ new major `type_id@2` coexisting with `@1` for the deprecation window.
- Manifest schema versioned (`manifest_version`); agent supports N and N-1.

## 11. Security obligations of plugin authors
No dynamic code download, no `eval/exec` of external data, no native extensions unless declared and reviewed, vendored dependencies with hashes, license declaration, SBOM, vulnerability response SLA stated in the registry listing.

## 12. Acceptance criteria

| ID | Criterion |
|---|---|
| AC-SDK-01 | A plugin using an undeclared capability is denied at runtime and the denial is audited; the conformance kit detects it before submission. |
| AC-SDK-02 | Tampering with any packaged file after signing causes load refusal on stations (install and load). |
| AC-SDK-03 | Killing the plugin process during a call yields a node error and an intact agent/journal; the run is resumable. |
| AC-SDK-04 | Two versions of one plugin run side-by-side in different runs; each run's binding shows its exact version. |
| AC-SDK-05 | Revoking a plugin version prevents new loads at stations within one feed poll interval (subject to staleness policy) and flags runs that used it. |
| AC-SDK-06 | A function plugin's golden vectors are bit-identical on all supported platforms. |
| AC-SDK-07 | A Class A package requiring an absent plugin type is reported incompatible for that station with a precise message; no partial install. |
