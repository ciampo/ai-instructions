# Tools and CLI Reference

How AI agents should use GitHub access, `gh`, and `git`.

## GitHub Access for Pull-Request Review

- **[STRONG]** Prefer the host's GitHub connector for remote pull-request review state: PR metadata, changed files, targeted patches, merged discussion, inline comments, and review threads including their resolved state. A connector avoids reconstructing review state from separate REST calls and remains usable when a local `gh` token is stale.
- **[RULE]** Capture `base_sha` and `head_sha` in one initial connector PR-info call before reading the review. Inspect repository source at that captured `head_sha`, not at an assumed branch name or an unpinned local checkout.
- **[PREFER]** Request only the relevant file patches after examining changed filenames. Avoid a full PR patch unless it is necessary to understand the change.
- **[RULE]** Re-read PR info before delivering a review. If `head_sha` changed, discard the stale snapshot and repeat the review-data collection.
- **[STRONG]** Reserve `gh` for CI summaries and failed Actions logs: use `gh pr checks` narrowly, then `gh run view --log-failed` for a relevant failed run. Do not request a full check-rollup payload when the summary is enough.

## GitHub CLI (`gh`)

- **[STRONG]** Outside the connector-first PR-review path, prefer `gh` subcommands over raw `gh api` calls whenever a subcommand covers the need: `gh issue view`, `gh issue list`, `gh pr list`, `gh pr checks`, `gh release list`, etc.
- **[PREFER]** Use read-only `gh api` only as a fallback when the connector is unavailable or lacks the required data.
- **[RULE]** **Do NOT use `gh api` with `-X`/`--method` flags** (POST, PUT, PATCH, DELETE) without asking first. For mutative operations, prefer the corresponding `gh` subcommand (`gh issue create`, `gh pr create`, `gh pr merge`, etc.) -- these surface in permission prompts with clear intent, making them easier to review.
- **[STRONG]** When accessing a GitHub Enterprise instance (e.g., `github.a8c.com`), always include the full URL in the command. This triggers shell-level overrides (proxy routing, host config) that the user has set up. Do NOT explicitly include `HTTPS_PROXY` or similar environment variables in the command -- the user's `gh` wrapper handles this automatically as long as the Enterprise URL is present.

## GitHub API Patterns

### Fallback Repository Identification

- **[RULE]** Before any fallback `gh api` call, determine `owner/repo` from the resource you are operating on. For PR-related queries, use the connector's PR metadata when available; otherwise prefer `gh pr view <N> --json baseRepository --jq '.baseRepository.nameWithOwner'`. Do not guess or hardcode the repository path. Only fall back to `git remote get-url origin` after confirming it matches the repository you intend to query, since in fork workflows `origin` may point to a contributor fork rather than the upstream PR repository.

### Fallback PR Review Comments

- **[STRONG]** When the connector is unavailable, use the documented [`repos/{owner}/{repo}/pulls/{number}/comments` endpoint](https://docs.github.com/en/rest/pulls/comments#list-review-comments-on-a-pull-request) first to list all review comments on a pull request. If a GitHub Enterprise version, permission boundary, or host-specific compatibility issue prevents it, fall back to listing reviews and fetching `repos/{owner}/{repo}/pulls/{number}/reviews/{review_id}/comments` for each review.

### zsh and `--jq`

- **[RULE]** In interactive zsh, `!` triggers history expansion inside double-quoted strings and unquoted arguments. This breaks both `gh api --jq` filters and piped `jq` expressions containing `!=`. Either escape the `!` (e.g., `\!=`), disable history expansion with `set +H`, or capture the `gh api` output into a variable first and then pass it to `jq` with the filter in single quotes. When checking whether `gh api` succeeded before parsing, capture output first — a simple pipe does not let you inspect `gh api`'s exit code before `jq` runs.

## Git

- **[STRONG]** When the calling request authorizes commits, commit frequently during refactors and multi-step work to keep diffs reviewable. See `writing-conventions.md` (Commit Messages section) for message format.
- **[RULE]** Use `--force-with-lease` for force pushes, never `--force`.
- **[PREFER]** Prefer `git rebase` for integrating upstream changes on feature branches.
- **[RULE]** Open PRs as drafts. Convert to ready only when polished and verified.
- **[PREFER]** Support stacked PRs: comfortable rebasing on top of other PRs.
- **[RULE]** When amending, only amend commits that have not been pushed or that were just created in the current session.

## Package Manager

- **[STRONG]** Use whichever package manager the project already uses (`npm`, `pnpm`, `yarn`). Check for lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`) to determine which one.
- **[RULE]** Never mix package managers in the same project. Do not run `npm install` in a `pnpm` project.
- **[STRONG]** Keep lockfile changes with the dependency change. When commits are authorized, include the lockfile in the relevant commit; never omit it by adding it to `.gitignore`.
- **[PREFER]** For monorepos/workspaces, use the workspace-aware commands (`npm -w`, `pnpm --filter`, `yarn workspace`).

## MCP and Agent Tools

- **[PREFER]** Use MCP tools when they provide a cleaner interface than raw CLI commands (e.g., GitHub MCP for structured data, search MCP for codebase exploration).
- **[PREFER]** Use subagents/Task tools for broad codebase exploration and parallel work. Use direct tool calls for focused, narrow operations (reading a specific file, running a single command).
- **[STRONG]** Before calling any MCP tool, read its schema/descriptor to understand the parameters. Do not guess.

## Verify Before Pushing

- **[RULE]** Before pushing code to a remote, always run the project's verification steps: lint, type-check, build, and tests (at minimum the ones relevant to the changed files).
- **[STRONG]** If the project defines a specific verification command or CI script, use that. Otherwise, infer from `package.json` scripts, `Makefile`, or equivalent.
- **[RULE]** Do not push broken code. If verification fails, fix the issue first.

## Shell Commands

- **[PREFER]** Prefer simple, composable commands. Avoid long pipelines when a dedicated tool exists.
- **[RULE]** Do not run destructive or irreversible commands without confirmation.
