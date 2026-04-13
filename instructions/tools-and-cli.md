# Tools and CLI Conventions

How AI agents should use command-line tools, especially `gh` and `git`.

## GitHub CLI (`gh`)

- **[STRONG]** Prefer `gh` subcommands over raw `gh api` calls whenever a subcommand covers the need: `gh issue view`, `gh issue list`, `gh pr view`, `gh pr list`, `gh pr diff`, `gh pr checks`, `gh release list`, etc.
- **[PREFER]** `gh api` is acceptable for **read-only** queries where no subcommand exists (e.g., fetching PR review comments).
- **[RULE]** **Do NOT use `gh api` with `-X`/`--method` flags** (POST, PUT, PATCH, DELETE) without asking first. For mutative operations, prefer the corresponding `gh` subcommand (`gh issue create`, `gh pr create`, `gh pr merge`, etc.) -- these surface in permission prompts with clear intent, making them easier to review.
- **[STRONG]** When accessing a GitHub Enterprise instance (e.g., `github.a8c.com`), always include the full URL in the command. This triggers shell-level overrides (proxy routing, host config) that the user has set up. Do NOT explicitly include `HTTPS_PROXY` or similar environment variables in the command -- the user's `gh` wrapper handles this automatically as long as the Enterprise URL is present.

## Git

- **[STRONG]** Granular commits grouped logically by concern. Each commit should be a self-contained unit of change.
- **[RULE]** Use `--force-with-lease` for force pushes, never `--force`.
- **[PREFER]** Prefer `git rebase` for integrating upstream changes on feature branches.
- **[PREFER]** Draft PRs first during development, convert to ready when polished.
- **[PREFER]** Support stacked PRs: comfortable rebasing on top of other PRs.
- **[RULE]** When amending, only amend commits that have not been pushed or that were just created in the current session.

## Package Manager

- **[STRONG]** Use whichever package manager the project already uses (`npm`, `pnpm`, `yarn`). Check for lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`) to determine which one.
- **[RULE]** Never mix package managers in the same project. Do not run `npm install` in a `pnpm` project.
- **[STRONG]** Always commit lockfile changes. Do not `.gitignore` lockfiles.
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
