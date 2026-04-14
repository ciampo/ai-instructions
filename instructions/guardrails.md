# Guardrails

Critical rules that apply to every coding session. These are extracted from `tools-and-cli.md`, `writing-conventions.md`, and `security.md` for visibility — they are non-negotiable.

## Before Pushing

- **[RULE]** Run lint, type-check, and tests for changed files before pushing. Do not push broken code.
- **[RULE]** Open PRs as drafts. Convert to ready only when polished and verified.
- **[RULE]** Use `--force-with-lease` for force pushes, never `--force`.

## Commits and CHANGELOGs

- **[STRONG]** Commit format: `ComponentName: Short description` or `area: description` (e.g., `Tooltip: Add delayDuration prop`, `build: Update Radix from v1 to v2`).
- **[RULE]** Include CHANGELOG entries for user-facing changes, matching the repo's existing format.
- **[STRONG]** Always commit lockfile changes.

## Internal Information

- **[RULE]** Never include internal or private links in public-facing content (PR descriptions, commit messages, CHANGELOGs, comments on public repos). This includes Linear issues, Slack links, P2 posts, private GitHub links, and any URL containing `a8c` or other internal domains. Always verify that a link is publicly accessible before including it.
