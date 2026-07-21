# ai-instructions

Personal AI agent instructions extracted from real interaction patterns. Coding style, review methodology, writing conventions, accessibility standards, and quality expectations -- codified as plain markdown files that any AI tool can consume.

## Why

AI assistants work better when they know how you think. Rather than repeating preferences in every conversation, these files encode them once and are installed into each tool's native configuration format.

See the [modernization plan](modernization-plan.md) for the architecture audit and completed implementation roadmap. The [platform support policy](docs/platform-support.md), [migration guide](docs/migration-guide.md), and [standards index](docs/standards-index.md) cover ongoing maintenance.

## Structure

```text
instructions/core.md  Small universal personal defaults
skills/*/SKILL.md      Standards-compliant workflows and references loaded on demand
agents/                Custom agent definitions for focused tasks
platforms/manifest.json  Tested product capabilities and destinations
scripts/               Installer, format adapters, and documentation generator
CONVENTIONS.md         Meta-conventions for skills, agents, and severity tags
setup.sh               POSIX compatibility wrapper for the Node installer
```

### Instructions

| File | What it covers |
| --- | --- |
| [core.md](instructions/core.md) | Communication, verification, authority, safety, implementation, and delivery boundaries that apply in every session |

The generated universal artifact is regression-limited to 150 lines and 8 KB. Technology-specific and repository-specific guidance lives in skills so unrelated sessions do not pay the context cost.

### Skills

| File | Trigger | What it does |
| --- | --- | --- |
| [engineering-standards](skills/engineering-standards/SKILL.md) | implementation or code review | Routes to only the relevant accessibility, design-system, language, i18n, security, performance, naming, or error-handling reference |
| [repository-maintenance](skills/repository-maintenance/SKILL.md) | repository, Git, package, or PR work | Loads repository-aware CLI and writing conventions |
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
- **Progressive disclosure**: Skill directories carry their own bundled references and are installed as complete units.
- **Custom agents**: Shared Markdown definitions are installed directly where possible and generated as TOML for Codex.

## Setup

The installer requires Node.js 22 or newer. Clone the repo and run the POSIX wrapper on macOS, Linux, or WSL:

```bash
git clone <repo-url> ~/Code/ai-instructions
cd ~/Code/ai-instructions
./setup.sh                   # Auto-detect installed agents, interactively select
./setup.sh --yes --dry-run   # Auto-detect, select all, preview changes
./setup.sh --agent cursor    # Target a specific agent
```

On native Windows, run the Node entrypoint directly and use copy mode:

```powershell
node scripts/setup.mjs --agent '*' --copy --yes
```

The script auto-detects which agents are installed by scanning `$HOME` for known config directories, then offers an interactive prompt. Use `--yes` to skip the prompt (selects all detected agents), or `--agent <name>` to target specific ones. When `--copilot-concat` is used without `--agent`, auto-detection runs silently (no prompt) and installs into all detected agents alongside generating the concatenated file.

### Supported agents

<!-- platform-support:start -->

<!-- Generated from platforms/manifest.json. Do not edit this table directly. -->

| Product surface | Tier | Instructions | Skills | Agents | Verified |
| --- | --- | --- | --- | --- | --- |
| Cursor editor and CLI | preview | `~/.cursor/rules/*.mdc` | `~/.cursor/skills/*/SKILL.md` | `~/.cursor/agents/*.md` | 2026-07-21 |
| Claude Code CLI | verified | `~/.claude/rules/*.md` | `~/.claude/skills/*/SKILL.md` | `~/.claude/agents/*.md` | 2026-07-21 |
| Codex app, CLI, and IDE extension | verified | `~/.codex/AGENTS.md` | `~/.agents/skills/*/SKILL.md` | `~/.codex/agents/*.toml` | 2026-07-21 |
| GitHub Copilot CLI | verified | `~/.copilot/copilot-instructions.md` | `~/.copilot/skills/*/SKILL.md` | `~/.copilot/agents/*.agent.md` | 2026-07-21 |
| Gemini CLI | verified | `~/.gemini/GEMINI.md` | `~/.gemini/skills/*/SKILL.md` | `~/.gemini/agents/*.md` | 2026-07-21 |

<!-- platform-support:end -->

See [platform support](docs/platform-support.md) for tier definitions, current product discovery checks, and the release verification checklist.

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

The installer is non-destructive and idempotent. It stages complete artifacts before publishing them, never clobbers an unexpected destination, and skips files it cannot prove it owns. Copied and generated artifacts carry strict ownership markers, so `update --copy` only replaces files previously installed by this repository.

### Manual integration

If you prefer to set things up manually or use a different tool:

- **Cursor**: Instructions to `~/.cursor/rules/`, skills to `~/.cursor/skills/`, and agents to `~/.cursor/agents/`
- **Claude Code**: Instructions to `~/.claude/rules/`, skills to `~/.claude/skills/`, and agents to `~/.claude/agents/`
- **Codex**: Instructions to managed `~/.codex/AGENTS.md`, skills to the shared `~/.agents/skills/` location, and generated agents to `~/.codex/agents/`
- **GitHub Copilot CLI**: Instructions to `~/.copilot/copilot-instructions.md`, skills to `~/.copilot/skills/`, and agents to `~/.copilot/agents/`; use `--copilot-concat` only for explicit repository export
- **Gemini CLI**: Instructions to `~/.gemini/GEMINI.md`, skills to `~/.gemini/skills/`, and agents to `~/.gemini/agents/`
- **Other tools** (Windsurf, Zed, etc.): Include instruction files as system prompt context, or copy them into the tool's configuration directory

### Per-project overrides

These instructions are global defaults. To override for a specific project:

- **Cursor**: Add `.cursor/rules/`, `.cursor/skills/`, or `.cursor/agents/` in the repository.
- **Claude Code**: Add `CLAUDE.md`, `.claude/rules/`, `.claude/skills/`, or `.claude/agents/`.
- **Codex**: Add `AGENTS.md`, `.agents/skills/`, or `.codex/agents/`.
- **GitHub Copilot CLI**: Add `.github/copilot-instructions.md`, `.github/skills/`, or `.github/agents/`.
- **Gemini CLI**: Add `GEMINI.md`, `.gemini/skills/`, or `.gemini/agents/`.
- Use the project-level config to relax global rules (e.g., "this project uses Tailwind instead of CSS Modules") or add project-specific conventions.

## Updating

These are living documents. In the default mode, portable instruction, skill, and Markdown-agent files are symlinked, while each skill keeps a real discovery directory with all bundled resources. Edits to linked files update immediately; adding or removing skill resources requires `update`. Cursor instructions, concatenated Codex/Copilot/Gemini instructions, and Codex TOML agents are generated managed files; refresh them after source changes with `./setup.sh update --agent '*'`. Copy-mode installations also require `update --copy`. In every mode, `update` removes stale repository-owned entries while preserving user-maintained files. See the [migration guide](docs/migration-guide.md) before upgrading an older installation.

## Development

Development requires Node.js 22 or newer and npm.

The installer architecture and safety decisions are recorded in [ADR 0001](docs/decisions/0001-node-installer.md), and the context-scoping decision is recorded in [ADR 0002](docs/decisions/0002-progressive-disclosure.md).

```bash
npm ci
npm run lint
npm run content:check
npm run docs:check
npm test
npm audit --audit-level=high
```

## License

[MIT](LICENSE)
