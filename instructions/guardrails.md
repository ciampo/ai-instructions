# Guardrails

Critical rules that apply to every coding session. These are extracted from `tools-and-cli.md` and `writing-conventions.md` for visibility — they are non-negotiable.

## Before Pushing

- **[RULE]** Run lint, type-check, and tests for changed files before pushing. Do not push broken code.
- **[RULE]** Open PRs as drafts. Convert to ready only when polished and verified.
- **[RULE]** Use `--force-with-lease` for force pushes, never `--force`.

## Commits and CHANGELOGs

- **[STRONG]** Commit format: `area: Short description` (e.g., `Tooltip: Add delayDuration prop`).
- **[RULE]** Include CHANGELOG entries for user-facing changes, matching the repo's existing format.
- **[STRONG]** Always commit lockfile changes.
