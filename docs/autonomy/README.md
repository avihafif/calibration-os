# CalOS cloud autonomous development pilot (staging only)

**Status:** configuration PR; **inactive until an authorized repo administrator enables it**. This is not a Production controller or a system that can release calibration software.

## Goal

GitHub-hosted workers process a bounded, trusted queue without a local computer. In each scheduled cycle:
1. Read the next task from `docs/autonomy/tasks.json` and current state from `.calos-autonomy/state.json` on `autonomy/integration` (if present).
2. Use **Codex** with its approved workspace sandbox and **no GitHub write credential** to produce a local patch.
3. Reject unauthorized paths or file modes before accepting the patch. The queue, governance, workflows, deployment and policy controls are not AI-editable.
4. Test the **same patch** in a separate, no-API-key job (frontend, architecture, supply chain, browser and Python regressions).
5. Have **Claude** review the same patch in another read-only job and return a typed `APPROVE` / `REQUEST_CHANGES` verdict.
6. Only on green tests and Claude's `APPROVE`, apply the verified patch and review record to **`autonomy/integration`** using a dedicated write-token job. The next scheduled cycle automatically picks the next task.
7. If implementation, testing or review fails, record a failed attempt without integrating rejected code. **Stop after three failed attempts** to prevent unlimited costs or an endless repair loop.

The workflow has a two-hour schedule and supports manual dispatch for diagnostics. Schedule executions can be delayed by GitHub. The task list is intentionally finite and pre-authorized; completion of that queue is **not** completion of CalOS.

## One-time activation (done by the account owner)

In GitHub: `Settings → Secrets and variables → Actions`:

- Repository secret **`OPENAI_API_KEY`**: an API key authorized and funded for Codex Actions.
- Repository secret **`ANTHROPIC_API_KEY`**: an API key authorized and funded for Claude Code.
- Repository variable **`CALOS_AUTONOMY_ENABLED`**: set to `true` after this workflow PR is reviewed and merged.

Never put keys in source code, task prompts, GitHub Issues, PR comments or ChatGPT. API billing and GitHub Actions usage may be separate from a ChatGPT/Claude subscription. Set provider spend limits and alert thresholds before enabling. Store a budgeted API credential with minimal scope where supported, and rotate compromised keys.

Before the first live run, review the workflow's GitHub Actions write permissions; the repository must permit the `contents: write` staging integration jobs. The workflow does **not** require a PAT for its own verified patch/testing/staging flow; it does not depend on `GITHUB_TOKEN` push events triggering another workflow.

No secrets are provided to the test, staging-commit or state-update jobs. Agent jobs check out without persisted Git credentials. Only the build/review jobs receive their respective model API key. Do not add untrusted issue/comment event triggers or run with `pull_request_target`.

## What is and is not automatic

- **Automatic:** predefined low-risk React UI slices and offline architecture *analysis*, code changes in explicitly allowlisted paths, verification, separate AI review, limited retries and commits to an isolated staging branch.
- **Not automatic:** changes to the task allowlist, security controls, accepted ADRs, secrets, dependency policies, Production, operational permissions, safety limits or metrology. Staging work cannot be treated as instrument-ready or Production-approved.
- **Main-branch promotion:** requires a separately reviewed integration PR and the repository's actual branch-protection approvals. An AI-agent comment does not impersonate an independent human reviewer. Product-owner authorization to merge is recorded, but cannot waive distinct human or regulated-role reviews where mandated.
- **Offline station:** no real instrument drivers, MSI signing, operational safety or Production enablement will be attempted by this pilot.

## Logs and final results

Monitor `Actions → CalOS autonomous frontend pilot`, the `autonomy/integration` branch and `.calos-autonomy/state.json`. Each successful task has an audited Claude report in `.calos-autonomy/reviews/<task>.json` and a workflow run ID. Every state transition is committed. When the finite queue is complete, the workflow stops scheduling agent invocations; summarize the completed tasks and open remaining gates from state, checks and review records before any promotion.

A future review may extend the vetted backlog, harden branch protection, add operational budgets and automate low-risk PR promotion, but **no generic self-assignment of safety- or governance-sensitive tasks** is permitted.

## Sources

- OpenAI Codex GitHub Action: https://github.com/openai/codex-action
- Claude Code base action: https://github.com/anthropics/claude-code-action/tree/main/base-action
- GitHub Actions GITHUB_TOKEN workflow-trigger rules: https://docs.github.com/en/actions/concepts/security/github_token
