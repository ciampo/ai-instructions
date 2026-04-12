# ai-instructions

Personal AI agent instructions extracted from real interaction patterns. Coding style, review methodology, writing conventions, accessibility standards, and quality expectations -- codified as plain markdown files that any AI tool can consume.

## Why

AI assistants work better when they know how you think. Rather than repeating preferences in every conversation, these files encode them once and get loaded automatically via symlinks into each tool's config.

## Structure

```
instructions/          Always-on rules loaded into every AI session
skills/                On-demand workflows invoked by trigger phrases
personas/              Specialized agent identities for focused tasks
setup.sh               Symlinks everything into Cursor / Claude Code
```

### Instructions

| File | What it covers |
|---|---|
| [coding-principles.md](instructions/coding-principles.md) | Engineering philosophy, TypeScript/JS/CSS/React style, dependencies, testing, comments |
| [interaction-preferences.md](instructions/interaction-preferences.md) | Concise communication, intellectual honesty, verify from source, GitHub boundaries |
| [writing-conventions.md](instructions/writing-conventions.md) | PR descriptions, commit messages, CHANGELOGs, JSDoc, error messages |
| [code-review.md](instructions/code-review.md) | Multi-round review process, structured output, prioritized checklist |
| [accessibility.md](instructions/accessibility.md) | WAI-ARIA/WCAG standards, focus management, keyboard interaction, visual a11y |
| [design-system-components.md](instructions/design-system-components.md) | Component library patterns: architecture, styling, Storybook, consistency |
| [tools-and-cli.md](instructions/tools-and-cli.md) | GitHub CLI, git workflow, verify-before-push, shell conventions |

### Skills

| File | Trigger | What it does |
|---|---|---|
| [review-pr.md](skills/review-pr.md) | "review this PR" | Structured PR review against the checklist |
| [self-review-pr.md](skills/self-review-pr.md) | "self-review" | Readonly subagent self-review to reduce bias |
| [write-pr-description.md](skills/write-pr-description.md) | "write/update PR description" | PR description writer following repo template |
| [draft-review-comment.md](skills/draft-review-comment.md) | "craft a comment" | GitHub review comment drafter (copy-paste snippets) |
| [audit-dependency-update.md](skills/audit-dependency-update.md) | updating a dependency | Full audit: changelog, codebase impact, compatibility, security |
| [address-pr-feedback.md](skills/address-pr-feedback.md) | "address the feedback" | Systematic workflow for review comments |

### Personas

| File | What it does |
|---|---|
| [a11y-reviewer.md](personas/a11y-reviewer.md) | Senior accessibility engineer for deep a11y audits |

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
| `--all` | Both of the above |
| `--dry-run` | Show what would be done without making changes |

The script is non-destructive (never overwrites existing files) and idempotent (safe to re-run).

### Manual integration

If you prefer to set things up manually or use a different tool:

- **Cursor**: Instructions to `~/.cursor/rules/` (as `.mdc`), skills to `~/.cursor/skills-cursor/<name>/SKILL.md`, personas to `~/.cursor/agents/`
- **Claude Code**: Instructions to `~/.claude/rules/`, skills to `~/.claude/skills/<name>/SKILL.md`, reference from `CLAUDE.md`
- **GitHub Copilot**: Concatenate instruction files into `.github/copilot-instructions.md`
- **Other tools**: Include as system prompt context

## Updating

These are living documents. Edit the source files here -- symlinks ensure every tool picks up changes immediately. Commit and push to keep history and sync across machines.
