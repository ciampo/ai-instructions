# Tools and CLI Reference

How AI agents should use GitHub access, `gh`, and `git`.

## Pull-Request Review

- **[STRONG]** Prefer `gh` and local Git for routine PR review data. Use field-limited `gh pr view` to capture the canonical PR URL, base branch, `baseRefOid`, and `headRefOid`; use `gh pr diff --name-only` for scope; then inspect targeted changes through Git at those captured SHAs. This is discoverable, keeps responses small, and avoids broad remote payloads.
- **[RULE]** Treat the captured base and head SHAs as the review boundary. Resolve both to explicit local refs before local inspection, not assumed branch names or `FETCH_HEAD`, which another fetch can replace.
- **[PREFER]** After examining changed filenames, fetch and review each changed file's diff separately and read its full source. Avoid a monolithic full-PR patch unless it is necessary to understand the change.
- **[PREFER]** Use the host's GitHub connector for information that `gh` does not expose cleanly in one read, especially merged discussion and review threads with their resolved state. It is also the fallback when the local CLI authentication is stale or lacks the needed capability.
- **[RULE]** Re-read field-limited PR metadata and refresh the remote discussion or thread state used by the review before delivery. If either `baseRefOid` or `headRefOid` changed, discard the stale snapshot and repeat the review-data collection; otherwise account for new or resolved feedback.
- **[STRONG]** Use `gh pr checks` narrowly for CI summaries, then `gh run view --log-failed` for a relevant failed run. Do not request a full check-rollup payload when the summary is enough.

## GitHub CLI (`gh`)

- **[STRONG]** Prefer `gh` subcommands over raw `gh api` calls whenever a subcommand covers the need: `gh issue view`, `gh issue list`, `gh pr view`, `gh pr list`, `gh pr diff`, `gh pr checks`, `gh release list`, etc.
- **[PREFER]** Use read-only `gh api` only when neither a `gh` subcommand nor the connector provides the required data cleanly.
- **[RULE]** **Do NOT use `gh api` with `-X`/`--method` flags** (POST, PUT, PATCH, DELETE) without asking first. For mutative operations, prefer the corresponding `gh` subcommand (`gh issue create`, `gh pr create`, `gh pr merge`, etc.) -- these surface in permission prompts with clear intent, making them easier to review.
- **[RULE]** A GitHub Enterprise URL identifies the target host; it does not configure `gh`, authentication, or proxy routing. Do not assume a user-level wrapper is installed. Before relying on GitHub Enterprise CLI access, verify an approved route with a harmless read-only request against the intended host.
- **[STRONG]** Search installed guidance by the exact Enterprise hostname before generic Keychain, authentication, or network troubleshooting. Prefer an enabled, approved Enterprise integration, a documented host-specific skill, or a local wrapper. If one provides a retry configuration, use it. Otherwise, do not invent `HTTPS_PROXY`, `GH_HOST`, or local proxy endpoints: ask the user to establish the approved access path before retrying.

## GitHub API Patterns

### Repository Identification

- **[RULE]** Before any `gh api` call, determine `owner/repo` from the resource you are operating on. For PR-related queries, derive it from the canonical PR URL returned by `gh pr view <N> --json url --jq '.url'`. Do not guess or hardcode the repository path. Only fall back to `git remote get-url origin` after confirming it matches the repository you intend to query, since in fork workflows `origin` may point to a contributor fork rather than the upstream PR repository.

### PR Review Comments

- **[STRONG]** Use the connector when resolved thread state or a merged discussion is material. Otherwise, use the documented [`repos/{owner}/{repo}/pulls/{number}/comments` endpoint](https://docs.github.com/en/rest/pulls/comments#list-review-comments-on-a-pull-request) to list review comments. If a GitHub Enterprise version, permission boundary, or host-specific compatibility issue prevents it, fall back to listing reviews and fetching `repos/{owner}/{repo}/pulls/{number}/reviews/{review_id}/comments` for each review.

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
