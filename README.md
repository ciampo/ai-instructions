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
setup.sh               Symlinks everything into Cursor / Claude Code / Copilot
```

### Instructions

| File | What it covers |
|---|---|
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
|---|---|---|
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
|---|---|
| [a11y-reviewer.md](personas/a11y-reviewer.md) | Senior accessibility engineer for deep a11y audits |
| [performance-reviewer.md](personas/performance-reviewer.md) | Senior performance engineer for bundle, rendering, and runtime reviews |
| [api-design-reviewer.md](personas/api-design-reviewer.md) | API design specialist for surface area, consistency, and ergonomics |

## Conventions

See [CONVENTIONS.md](CONVENTIONS.md) for meta-conventions used across all files:

- **Severity tags**: `[RULE]` / `[STRONG]` / `[PREFER]` to help AI agents calibrate hard rules vs. soft preferences.
- **Cross-references**: Skills and personas declare `## Dependencies` listing the instruction files they need.

## Setup

Clone the repo and run the setup script to symlink files into your AI tools:

```bash
git clone <repo-url> ~/Code/ai-instructions
cd ~/Code/ai-instructions
./setup.sh --all --dry-run   # Preview what will be linked
./setup.sh --all             # Link into Cursor + Claude Code
```

Available flags:

| Flag | What it does |
|---|---|
| `--cursor` | Symlinks into `~/.cursor/rules/`, `~/.cursor/skills-cursor/`, `~/.cursor/agents/` |
| `--claude` | Symlinks into `~/.claude/rules/`, `~/.claude/skills/` |
| `--copilot [DIR]` | Concatenates instructions into `.github/copilot-instructions.md` in the target directory |
| `--all` | Cursor + Claude Code (use `--copilot` separately since it targets a specific repo) |
| `--unlink` | Remove symlinks created by this script (combine with `--cursor`, `--claude`, or `--all`) |
| `--check` | Verify existing symlinks are valid and targets exist |
| `--dry-run` | Show what would be done without making changes |

The script is non-destructive (never overwrites existing files) and idempotent (safe to re-run).

### Manual integration

If you prefer to set things up manually or use a different tool:

- **Cursor**: Instructions to `~/.cursor/rules/` (as `.mdc`), skills to `~/.cursor/skills-cursor/<name>/SKILL.md`, personas to `~/.cursor/agents/`
- **Claude Code**: Instructions to `~/.claude/rules/`, skills to `~/.claude/skills/<name>/SKILL.md`, reference from `CLAUDE.md`
- **GitHub Copilot**: Concatenate instruction files into `.github/copilot-instructions.md`
- **Other tools** (Windsurf, Zed, etc.): Include instruction files as system prompt context, or copy them into the tool's configuration directory

### Per-project overrides

These instructions are global defaults. To override for a specific project:

- **Cursor**: Add project-specific `.cursor/rules/*.mdc` files in the repo. They take precedence over global rules.
- **Claude Code**: Add project-specific rules in the repo's `CLAUDE.md` or `.claude/rules/`.
- Use the project-level config to relax global rules (e.g., "this project uses Tailwind instead of CSS Modules") or add project-specific conventions.

## Updating

These are living documents. Edit the source files here -- symlinks ensure every tool picks up changes immediately. Commit and push to keep history and sync across machines.

## License

[MIT](LICENSE)
