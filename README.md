# ai-instructions

Personal AI agent instructions extracted from real interaction patterns. Coding style, review methodology, writing conventions, accessibility standards, and quality expectations -- codified as plain markdown files that any AI tool can consume.

## Why

AI assistants work better when they know how you think. Rather than repeating preferences in every conversation, these files encode them once and get loaded automatically via symlinks into each tool's config.

## Structure

```text
instructions/          Always-on rules loaded into every AI session
skills/                On-demand workflows invoked by trigger phrases
personas/              Specialized agent identities for focused tasks
CONVENTIONS.md         Meta-conventions (severity tags, cross-references)
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
| [review-pr.md](skills/review-pr.md) | "review this PR" | Structured PR review against the checklist |
| [self-review-pr.md](skills/self-review-pr.md) | "self-review" | Readonly subagent self-review to reduce bias |
| [write-pr-description.md](skills/write-pr-description.md) | "write/update PR description" | PR description writer following repo template |
| [draft-review-comment.md](skills/draft-review-comment.md) | "craft a comment" | GitHub review comment drafter (copy-paste snippets) |
| [audit-dependency-update.md](skills/audit-dependency-update.md) | updating a dependency | Full audit: changelog, codebase impact, compatibility, security |
| [address-pr-feedback.md](skills/address-pr-feedback.md) | "address the feedback" | Systematic workflow for review comments |
| [investigate-debug.md](skills/investigate-debug.md) | "debug this" | Structured debugging: reproduce, isolate, fix, verify |
| [refactor.md](skills/refactor.md) | "refactor X" | Systematic codebase-wide refactoring workflow |
| [resume-session.md](skills/resume-session.md) | "continue where we left off" | Pick up work from a previous session |
| [release-publish.md](skills/release-publish.md) | "prepare a release" | Version bump, CHANGELOG, publish, post-publish checks |

### Personas

| File | What it does |
| --- | --- |
| [a11y-reviewer.md](personas/a11y-reviewer.md) | Senior accessibility engineer for deep a11y audits |
| [performance-reviewer.md](personas/performance-reviewer.md) | Senior performance engineer for bundle, rendering, and runtime reviews |
| [api-design-reviewer.md](personas/api-design-reviewer.md) | API design specialist for surface area, consistency, and ergonomics |

## Conventions

See [CONVENTIONS.md](CONVENTIONS.md) for meta-conventions used across all files:

- **Severity tags**: `[RULE]` / `[STRONG]` / `[PREFER]` to help AI agents calibrate hard rules vs. soft preferences.
- **Cross-references**: Skills and personas declare `## Dependencies` listing the instruction files they need.

## Setup

Clone the repo and run the setup script:

```bash
git clone <repo-url> ~/Code/ai-instructions
cd ~/Code/ai-instructions
./setup.sh                   # Auto-detect installed agents, interactively select
./setup.sh --yes --dry-run   # Auto-detect, select all, preview changes
./setup.sh --agent cursor    # Target a specific agent
```

The script auto-detects which agents are installed by scanning `$HOME` for known config directories, then offers an interactive prompt. Use `--yes` to skip the prompt (selects all detected agents), or `--agent <name>` to target specific ones.

### Supported agents

| Agent | Detection | Instructions | Skills | Personas |
| --- | --- | --- | --- | --- |
| Cursor | `~/.cursor/` | `~/.cursor/rules/*.mdc` | `~/.cursor/skills-cursor/*/SKILL.md` | `~/.cursor/agents/` |
| Claude Code | `~/.claude/` | `~/.claude/rules/*.md` | `~/.claude/skills/*/SKILL.md` | -- |
| Codex | `~/.codex/` | `~/.codex/instructions/*.md` | -- | -- |
| GitHub Copilot | `~/.copilot/` | -- | `~/.copilot/skills/*/SKILL.md` | -- |
| Gemini CLI | `~/.gemini/` | -- | `~/.gemini/skills/*/SKILL.md` | -- |

### Commands

| Command | What it does |
| --- | --- |
| `install` (default) | Create symlinks (or copies) into agent config directories |
| `list` | Show all installed symlinks grouped by agent |
| `remove` | Remove symlinks/copies created by this script |
| `update` | Re-install + clean stale symlinks for deleted source files |
| `check` | Verify existing symlinks are valid and targets exist |

### Options

| Flag | What it does |
| --- | --- |
| `--agent <name>` | Target a specific agent (`cursor`, `claude`, `codex`, `copilot`, `gemini`). Repeatable. `--agent '*'` for all. |
| `--only <category>` | Only install specific categories (`instructions`, `skills`, `personas`). Repeatable. |
| `--copilot-concat [DIR]` | Concatenate all instructions into `.github/copilot-instructions.md` in the target directory. Can run standalone. |
| `--copy` | Copy files instead of symlinking (useful on Windows/WSL or in CI). Use `update --copy` to refresh stale copies. |
| `-y`, `--yes` | Skip all prompts -- auto-select all detected agents |
| `--dry-run` | Show what would be done without making changes |

### Examples

```bash
./setup.sh                                        # Interactive: detect + prompt
./setup.sh --yes                                   # Non-interactive: all detected agents
./setup.sh --agent cursor --agent claude           # Target specific agents
./setup.sh --agent '*' --dry-run                   # Preview for all agents
./setup.sh --only skills --only personas           # Only install skills + personas
./setup.sh remove --agent cursor                   # Remove Cursor symlinks
./setup.sh update --agent '*'                      # Re-install + clean stale links
./setup.sh check --agent cursor                    # Verify Cursor symlinks
./setup.sh install --copy --yes                    # Copy mode for CI
./setup.sh --copilot-concat ~/Code/my-project      # Standalone: generate concatenated Copilot file
```

The script is non-destructive (skips existing files that conflict), idempotent (safe to re-run), and bash 3.2+ compatible (works on stock macOS).

### Manual integration

If you prefer to set things up manually or use a different tool:

- **Cursor**: Instructions to `~/.cursor/rules/` (as `.mdc`), skills to `~/.cursor/skills-cursor/<name>/SKILL.md`, personas to `~/.cursor/agents/`
- **Claude Code**: Instructions to `~/.claude/rules/`, skills to `~/.claude/skills/<name>/SKILL.md`, reference from `CLAUDE.md`
- **Codex**: Instructions to `~/.codex/instructions/`
- **GitHub Copilot**: Skills to `~/.copilot/skills/<name>/SKILL.md`, or use `--copilot-concat` for a single instructions file
- **Gemini CLI**: Skills to `~/.gemini/skills/<name>/SKILL.md`
- **Other tools** (Windsurf, Zed, etc.): Include instruction files as system prompt context, or copy them into the tool's configuration directory

### Per-project overrides

These instructions are global defaults. To override for a specific project:

- **Cursor**: Add project-specific `.cursor/rules/*.mdc` files in the repo. They take precedence over global rules.
- **Claude Code**: Add project-specific rules in the repo's `CLAUDE.md` or `.claude/rules/`.
- Use the project-level config to relax global rules (e.g., "this project uses Tailwind instead of CSS Modules") or add project-specific conventions.

## Updating

These are living documents. If you installed with the default symlink mode, edit the source files here and every tool picks up changes immediately. If you installed with `--copy`, changes do not propagate automatically; run `./setup.sh update --copy` to refresh installed files. In both modes, `update` cleans up stale links for files that were removed from the repo. Commit and push to keep history and sync across machines.

## License

[MIT](LICENSE)
