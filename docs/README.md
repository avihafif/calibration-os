# CalOS specification set — index

Status: Draft 0.3 (No-Code-First; Q-13 and Q-14 resolved — ADR-0023/0024). **Specification only — no application code yet.**

| Document | Purpose |
|---|---|
| [PRODUCT_REQUIREMENTS](PRODUCT_REQUIREMENTS.md) | Vision, personas, scope, assumptions, open questions, FR/NFR (IDs), acceptance (incl. AC-NC) |
| [NO_CODE_ARCHITECTURE](NO_CODE_ARCHITECTURE.md) | **Foundational.** Metadata engine, building blocks, typed expressions, declarative drivers & safety, workflow engine, dynamic UI/report rendering, editor architecture, validation, distribution |
| [NO_CODE_CAPABILITY_MATRIX](NO_CODE_CAPABILITY_MATRIX.md) | Per operation: No-Code / Configuration / Development |
| [ARCHITECTURE](ARCHITECTURE.md) | Context, containers, monorepo & boundaries, station agent, data flows, deployment, versioning, observability, failure scenarios |
| [DOMAIN_MODEL](DOMAIN_MODEL.md) | Entities, invariants, state machines |
| [PROCEDURE_SCHEMA](PROCEDURE_SCHEMA.md) | Configuration schemas (procedure IR, driver, safety, simulation, metrology), expression function catalog, lint codes |
| [API_CONTRACT](API_CONTRACT.md) | Central, Sync and Station Local APIs |
| [VISUAL_APPLICATION_BUILDER_SPEC](VISUAL_APPLICATION_BUILDER_SPEC.md) | Builder workspaces, driver/metrology/UI/report designers, simulation lab, MVP cut |
| [VISUAL_PROCEDURE_DESIGNER_SPEC](VISUAL_PROCEDURE_DESIGNER_SPEC.md) | Drag-and-drop workflow designer and debugger |
| [CONFIGURATION_GOVERNANCE](CONFIGURATION_GOVERNANCE.md) | Lifecycle, approvals, SoD, environments, deployment, rollback, backups |
| [PLUGIN_SDK_SPEC](PLUGIN_SDK_SPEC.md) | Package formats, Class B plugins, signing, capabilities, isolation |
| [SECURITY_MODEL](SECURITY_MODEL.md) | RBAC, tenancy, secrets, crypto, updates, threat model |
| [METROLOGY_REQUIREMENTS](METROLOGY_REQUIREMENTS.md) | Metrology mechanisms; **Unknown Inputs Register (MI-xx)** |
| [UI_UX_SPEC](UI_UX_SPEC.md) | Shells, tokens, responsive, he/en RTL, screens, accessibility |
| [IMPLEMENTATION_ROADMAP](IMPLEMENTATION_ROADMAP.md) | Phases, VS-1 & AC-NC acceptance, test strategy, risks |
| [adr/](adr/README.md) | Architecture decision records (incl. OpenTAP evaluation ADR-0002; **ADR-0023 safety ownership & hardware limits; ADR-0024 separate Test/Production deployments**) |
| [../AGENTS.md](../AGENTS.md) | Rules for AI agents and contributors |

Reading order for newcomers: NO_CODE_ARCHITECTURE → ARCHITECTURE → PRODUCT_REQUIREMENTS → BUILDER spec → the rest.
