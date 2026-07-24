# Skills-first support audit

- **Date:** 2026-07-22
- **Source:** `3400708` (`main` before this audit)
- **Scope:** automated distribution and lifecycle verification for the current skills-first architecture

## Current distribution contract

The repository distributes one compact core-instruction artifact and 17 complete Agent Skill directories to each of the five preview adapters: Cursor, Claude Code, Codex, GitHub Copilot CLI, and Google Antigravity CLI. It has no `agents/` source directory and produces no new custom-agent artifacts.

Former custom-agent locations remain only as ownership-safe cleanup destinations. `update` and `remove` delete repository-owned retired artifacts while preserving user-authored agents. They are not an active capability claim.

## Automated verification

The audit ran from a clean dependency install with Node 22:

```text
npm ci
npm run lint
npm run content:check
npm run docs:check
npm test
npm audit --audit-level=high
```

All checks passed. The content contract reported 17 skills, 0 agents, and a 60-line / 4,770-byte universal core. The installer suite ran 52 Node tests and the Cursor, Claude, Codex, and cross-platform legacy shell regressions. The dependency audit found zero high-severity-or-higher vulnerabilities.

The skills-first regression verifies, for every adapter, that a copy-mode installation contains every source skill directory and every bundled resource byte-for-byte, adds only the managed-copy marker, reports the `agents` category as not distributed, and creates no retired-agent destination on a clean install. Existing lifecycle tests continue to verify idempotent install, `check`, `list`, `update`, `remove`, legacy upgrades, user-owned conflicts, stale-artifact cleanup, and POSIX symlink mode.

## What this does not prove

The automated audit alone does not show that a current authenticated product release loaded the core instruction or invoked a skill. The subsequent live verification is recorded in [discovery evidence](discovery-evidence.md). It confirms direct-skill behavior in Cursor Agent and Codex CLI, and records the current authentication or client-coverage blockers elsewhere. All five surfaces remain `preview`; no support tier is promoted by this audit.

## Issue reassessment

| Issue | Assessment after the skills-first audit | Recommended next step |
| --- | --- | --- |
| [#28](https://github.com/ciampo/ai-instructions/issues/28) | Its custom-agent discovery requirement is obsolete. Cursor Agent now passes the title and direct-skill canaries, but the editor has only passed skill-picker introspection. | Reframe to the remaining Cursor editor canaries; keep open until they pass or the surface is split. |
| [#29](https://github.com/ciampo/ai-instructions/issues/29) | Its custom-agent acceptance criterion is obsolete. The release-boundary follow-up from [#43](https://github.com/ciampo/ai-instructions/issues/43) and a current Claude direct-skill canary remain blocked by the logged-out profile. | Reframe and keep open. |
| [#30](https://github.com/ciampo/ai-instructions/issues/30) | The issue is exclusively about Codex custom-agent discovery. Current Codex distribution intentionally has no custom agents, and the audit proves the installer does not recreate them. | Close as obsolete; retain only direct-skill discovery in the platform acceptance matrix. |
| [#32](https://github.com/ciampo/ai-instructions/issues/32) | Gemini is unsupported by default because no retained authenticated context has current evidence. Its former custom-agent acceptance criterion is also obsolete. | Close after [#40](https://github.com/ciampo/ai-instructions/issues/40) lands; reopen only for a new supported Gemini context. |
| [#42](https://github.com/ciampo/ai-instructions/issues/42) | Local release checks pass, the manifest links the current Copilot CLI instruction, command, and skill documentation, and `copilot skill list` discovers all 17 personal skills. Model-backed canaries currently fail before execution because the CLI profile is unauthenticated. | Keep open and leave the tier at preview. |
