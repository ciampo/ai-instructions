# ai-instructions

Personal AI agent instructions extracted from real interaction patterns. Coding style, review methodology, writing conventions, accessibility standards, and quality expectations -- codified as plain markdown files that any AI tool can consume.

## Why

AI assistants work better when they know how you think. Rather than repeating preferences in every conversation, these files encode them once and get loaded automatically via symlinks into each tool's config.

See the [modernization plan](modernization-plan.md) for the current architecture audit and implementation roadmap.

## Structure

```text
instructions/          Always-on rules loaded into every AI session
skills/*/SKILL.md      Standards-compliant workflows loaded on demand
agents/                Custom agent definitions for focused tasks
CONVENTIONS.md         Meta-conventions for skills, agents, and severity tags
setup.sh               Installs into Cursor, Claude Code, Codex, Copilot, Gemini CLI
```

### Instructions

| File | What it covers |
| --- | --- |
| [coding-principles.md](instructions/coding-principles.md) | Engineering philosophy, TypeScript/JS/CSS/React style, module organization, dependencies, testing, comments |
| [interaction-preferences.md](instructions/interaction-preferences.md) | Concise communication, intellectual honesty, verify from source, GitHub boundaries, context switching, collaboration |
| [writing-conventions.md](instructions/writing-conventions.md) | PR descriptions, commit messages, CHANGELOGs, branch names, JSDoc, error messages |
| [code-review.md](instructions/code-review.md) | Multi-round review process, severity labels, structured output, prioritized checklist, "do not flag" list |
| [accessibility.md](instructions/accessibility.md) | WAI-ARIA/WCAG standards, focus management, live regions, keyboard interaction, motion, visual and touch a11y |
| [design-system-components.md](instructions/design-system-components.md) | Component library patterns: architecture, polymorphic rendering, styling, theming, Storybook, versioning |
| [tools-and-cli.md](instructions/tools-and-cli.md) | GitHub CLI, git workflow, package managers, MCP tools, verify-before-push, shell conventions |
| [performance.md](instructions/performance.md) | Bundle size, lazy loading, rendering optimization, CSS performance, images, measuring |
| [i18n.md](instructions/i18n.md) | Translatable strings, RTL support, locale-aware formatting, i18n testing |
| [security.md](instructions/security.md) | XSS prevention, content security, dependencies, server-side, secrets |
| [error-handling.md](instructions/error-handling.md) | Error boundaries, loading/empty/error states, retry/recovery, logging |
| [naming-conventions.md](instructions/naming-conventions.md) | Files, components, hooks, CSS, variables, types, branches |

### Skills

| File | Trigger | What it does |
| --- | --- | --- |
| [review-pr](skills/review-pr/SKILL.md) | "review this PR" | Structured, read-only PR review |
| [self-review-pr](skills/self-review-pr/SKILL.md) | "self-review" | Independent PR self-review with a no-subagent fallback |
| [write-pr-description](skills/write-pr-description/SKILL.md) | "write/update PR description" | PR description writer following the repository template |
| [draft-review-comment](skills/draft-review-comment/SKILL.md) | "craft a comment" | GitHub review comment drafter that never posts directly |
| [audit-dependency-update](skills/audit-dependency-update/SKILL.md) | updating a dependency | Changelog, impact, compatibility, and security audit |
| [address-pr-feedback](skills/address-pr-feedback/SKILL.md) | "address the feedback" | Systematic workflow for review comments |
| [investigate-debug](skills/investigate-debug/SKILL.md) | "debug this" | Reproduce, isolate, fix, and verify |
| [refactor](skills/refactor/SKILL.md) | "refactor X" | Verified codebase-wide refactoring workflow |
| [resume-session](skills/resume-session/SKILL.md) | "continue where we left off" | Recover and verify previous work |
| [prepare-release](skills/prepare-release/SKILL.md) | "prepare a release" | Local release preparation without remote publication |
| [publish-release](skills/publish-release/SKILL.md) | "publish the release" | Explicitly authorized release publication |

### Agents

| File | What it does |
| --- | --- |
| [a11y-reviewer.md](agents/a11y-reviewer.md) | Senior accessibility engineer for deep a11y audits |
| [performance-reviewer.md](agents/performance-reviewer.md) | Senior performance engineer for bundle, rendering, and runtime reviews |
| [api-design-reviewer.md](agents/api-design-reviewer.md) | API design specialist for surface area, consistency, and ergonomics |

## Conventions

See [CONVENTIONS.md](CONVENTIONS.md) for meta-conventions used across all files:

- **Severity tags**: `[RULE]` / `[STRONG]` / `[PREFER]` to help AI agents calibrate hard rules vs. soft preferences.
- **Agent Skills**: Each workflow has a `SKILL.md` entrypoint with standard `name` and `description` frontmatter.
- **Custom agents**: Shared Markdown definitions are installed directly where possible and generated as TOML for Codex.

## Setup

Clone the repo and run the setup script:

```bash
git clone <repo-url> ~/Code/ai-instructions
cd ~/Code/ai-instructions
./setup.sh                   # Auto-detect installed agents, interactively select
./setup.sh --yes --dry-run   # Auto-detect, select all, preview changes
./setup.sh --agent cursor    # Target a specific agent
```

The script auto-detects which agents are installed by scanning `$HOME` for known config directories, then offers an interactive prompt. Use `--yes` to skip the prompt (selects all detected agents), or `--agent <name>` to target specific ones. When `--copilot-concat` is used without `--agent`, auto-detection runs silently (no prompt) and installs into all detected agents alongside generating the concatenated file.

### Supported agents

| Agent | Detection | Instructions | Skills | Agents |
| --- | --- | --- | --- | --- |
| Cursor | `~/.cursor/` | `~/.cursor/rules/*.mdc` (generated copies with YAML frontmatter) | `~/.cursor/skills/*/SKILL.md` | `~/.cursor/agents/*.md` |
| Claude Code | `~/.claude/` | `~/.claude/rules/*.md` | `~/.claude/skills/*/SKILL.md` | `~/.claude/agents/*.md` |
| Codex | `~/.codex/` | `~/.codex/AGENTS.md` (single concatenated, managed file) | `~/.agents/skills/*/SKILL.md` | `~/.codex/agents/*.toml` |
| GitHub Copilot CLI | `~/.copilot/` | -- | `~/.copilot/skills/*/SKILL.md` | `~/.copilot/agents/*.md` |
| Gemini CLI | `~/.gemini/` | -- | `~/.gemini/skills/*/SKILL.md` | `~/.gemini/agents/*.md` |

### Commands

| Command | What it does |
| --- | --- |
| `install` (default) | Create symlinks (or copies) into agent config directories |
| `list` | Show all installed symlinks/copies grouped by agent (includes stale entries) |
| `remove` | Remove symlinks/copies created by this script (includes stale cleanup) |
| `update` | Re-install + clean stale symlinks/copies for deleted source files |
| `check` | Verify existing symlinks/copies and generated agents, detect stale/broken/conflicting entries, and exit non-zero when problems are found |

### Options

| Flag | What it does |
| --- | --- |
| `--agent <name>` | Target a specific agent (`cursor`, `claude`, `codex`, `copilot`, `gemini`). Repeatable. `--agent '*'` for all. |
| `--only <category>` | Limit operations to specific categories (`instructions`, `skills`, `agents`). Repeatable. The legacy `personas` value remains an alias for `agents` during migration. |
| `--copilot-concat [DIR]` | Concatenate all instructions into `.github/copilot-instructions.md` in the target directory. Refuses to overwrite a user-maintained file. Can run standalone. |
| `--copy` | Copy files instead of symlinking (useful on Windows/WSL or in CI). Use `update --copy` to refresh stale copies. |
| `-y`, `--yes` | Skip all prompts -- auto-select all detected agents |
| `--dry-run` | Show what would be done without making changes |

### Examples

```bash
./setup.sh                                        # Interactive: detect + prompt
./setup.sh --yes                                   # Non-interactive: all detected agents
./setup.sh --agent cursor --agent claude           # Target specific agents
./setup.sh --agent '*' --dry-run                   # Preview for all agents
./setup.sh --only skills --only agents             # Only install skills + custom agents
./setup.sh remove --agent cursor                   # Remove Cursor symlinks
./setup.sh update --agent '*'                      # Re-install + clean stale links
./setup.sh check --agent cursor                    # Verify managed Cursor configuration
./setup.sh install --copy --yes                    # Copy mode for CI
./setup.sh --copilot-concat ~/Code/my-project      # Standalone: generate concatenated Copilot file
```

The script is non-destructive (skips files it did not install), idempotent (safe to re-run), and bash 3.2+ compatible (works on stock macOS). Copied Markdown files include an `<!-- ai-instructions:managed -->` marker, while generated Codex agents use `# ai-instructions:managed`, so `update --copy` only overwrites files the script previously installed.

### Manual integration

If you prefer to set things up manually or use a different tool:

- **Cursor**: Instructions to `~/.cursor/rules/`, skills to `~/.cursor/skills/`, and agents to `~/.cursor/agents/`
- **Claude Code**: Instructions to `~/.claude/rules/`, skills to `~/.claude/skills/`, and agents to `~/.claude/agents/`
- **Codex**: Instructions to managed `~/.codex/AGENTS.md`, skills to the shared `~/.agents/skills/` location, and generated agents to `~/.codex/agents/`
- **GitHub Copilot CLI**: Skills to `~/.copilot/skills/` and agents to `~/.copilot/agents/`; use `--copilot-concat` only for explicit repository export
- **Gemini CLI**: Skills to `~/.gemini/skills/` and agents to `~/.gemini/agents/`
- **Other tools** (Windsurf, Zed, etc.): Include instruction files as system prompt context, or copy them into the tool's configuration directory

### Per-project overrides

These instructions are global defaults. To override for a specific project:

- **Cursor**: Add project-specific `.cursor/rules/*.mdc` files in the repo. They take precedence over global rules.
- **Claude Code**: Add project-specific rules in the repo's `CLAUDE.md` or `.claude/rules/`.
- Use the project-level config to relax global rules (e.g., "this project uses Tailwind instead of CSS Modules") or add project-specific conventions.

## Updating

These are living documents. If you installed with the default symlink mode, edit the source files here and every tool picks up changes immediately. Two agents are exceptions because they need generated, managed files rather than symlinks: Cursor instructions are always emitted as managed `.mdc` copies so the installer can add the YAML frontmatter Cursor requires, and Codex instructions are always concatenated into a single managed `~/.codex/AGENTS.md`. Re-run `./setup.sh update --agent cursor` or `./setup.sh update --agent codex` to refresh those generated files after source changes. If you installed other agents with `--copy`, changes do not propagate automatically; run `./setup.sh update --copy` to refresh installed files. In all modes, `update` cleans up stale entries (broken symlinks or orphaned managed copies) for source files that were removed from the repo. Commit and push to keep history and sync across machines.

## Development

Development requires Node.js 22 or newer and npm.

```bash
npm ci
npm run lint
npm test
npm audit --audit-level=high
```

## License

[MIT](LICENSE)
