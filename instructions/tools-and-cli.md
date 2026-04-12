# Tools and CLI Conventions

How AI agents should use command-line tools, especially `gh` and `git`.

## GitHub CLI (`gh`)

- Prefer `gh` subcommands over raw `gh api` calls whenever a subcommand covers the need: `gh issue view`, `gh issue list`, `gh pr view`, `gh pr list`, `gh pr diff`, `gh pr checks`, `gh release list`, etc.
- `gh api` is acceptable for **read-only** queries where no subcommand exists (e.g., fetching PR review comments).
- **Do NOT use `gh api` with `-X`/`--method` flags** (POST, PUT, PATCH, DELETE) without asking first. For mutative operations, prefer the corresponding `gh` subcommand (`gh issue create`, `gh pr create`, `gh pr merge`, etc.) -- these surface in permission prompts with clear intent, making them easier to review.
- When accessing a GitHub Enterprise instance (e.g., `github.a8c.com`), always include the full URL in the command. This triggers shell-level overrides (proxy routing, host config) that the user has set up. Do NOT explicitly include `HTTPS_PROXY` or similar environment variables in the command -- the user's `gh` wrapper handles this automatically as long as the Enterprise URL is present.

## Git

- Granular commits grouped logically by concern. Each commit should be a self-contained unit of change.
- Use `--force-with-lease` for force pushes, never `--force`.
- Prefer `git rebase` for integrating upstream changes on feature branches.
- Draft PRs first during development, convert to ready when polished.
- Support stacked PRs: comfortable rebasing on top of other PRs.
- When amending, only amend commits that have not been pushed or that were just created in the current session.

## Verify Before Pushing

- Before pushing code to a remote, always run the project's verification steps: lint, type-check, build, and tests (at minimum the ones relevant to the changed files).
- If the project defines a specific verification command or CI script, use that. Otherwise, infer from `package.json` scripts, `Makefile`, or equivalent.
- Do not push broken code. If verification fails, fix the issue first.

## Shell Commands

- Prefer simple, composable commands. Avoid long pipelines when a dedicated tool exists.
- Do not run destructive or irreversible commands without confirmation.
