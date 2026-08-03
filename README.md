# ai-instructions

Personal AI agent instructions extracted from real interaction patterns. Coding style, review methodology, writing conventions, accessibility standards, and quality expectations -- codified as plain markdown files that any AI tool can consume.

## Why

AI assistants work better when they know how you think. Rather than repeating preferences in every conversation, these files encode them once and are installed into each tool's native configuration format.

The [modernization plan](modernization-plan.md) is retained as the historical architecture audit and decision trail. Active maintenance is tracked in [issue #49](https://github.com/ciampo/ai-instructions/issues/49), with the [platform support policy](docs/platform-support.md), [discovery evidence](docs/discovery-evidence.md), [migration guide](docs/migration-guide.md), [compatibility policy](docs/compatibility-policy.md), [standards index](docs/standards-index.md), and [`AGENTS.md` interoperability decision](docs/decisions/0005-agents-md-canonical-artifact.md).

## Structure

```text
AGENTS.md             Small universal personal defaults and shared project artifact
skills/*/SKILL.md      Standards-compliant workflows and references loaded on demand
platforms/manifest.json  Tested product capabilities and destinations
scripts/               Installer, format adapters, and documentation generator
CONVENTIONS.md         Meta-conventions for skills and severity tags
setup.sh               POSIX compatibility wrapper for the Node installer
```

### Instructions

| File | What it covers |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Communication, task titles, verification, authority, safety, implementation, and delivery boundaries that apply in every session |

The generated universal artifact is regression-limited to 150 lines and 8 KB. Technology-specific and repository-specific guidance lives in skills so unrelated sessions do not pay the context cost. Skill discovery metadata has a separate aggregate 12 KB budget because clients can load every description before selecting a skill.

### Skills

| File | Trigger | What it does |
| --- | --- | --- |
| [engineering-standards](skills/engineering-standards/SKILL.md) | implementation or code review | Routes to only the relevant accessibility, design-system, language, i18n, security, performance, naming, or error-handling reference |
| [repository-maintenance](skills/repository-maintenance/SKILL.md) | repository, Git, package, or PR work | Loads repository-aware CLI and writing conventions |
| [automattic-github-enterprise](skills/automattic-github-enterprise/SKILL.md) | `github.a8c.com` or Automattic GitHub Enterprise access | Applies the approved macOS/POSIX route and avoids sandbox authentication false negatives |
| [review-pr](skills/review-pr/SKILL.md) | "review this PR" | Structured, read-only PR review |
| [review-accessibility](skills/review-accessibility/SKILL.md) | accessibility, WCAG, ARIA, keyboard, focus, or screen-reader audit | Read-only, source-verified accessibility review |
| [review-api-design](skills/review-api-design/SKILL.md) | API design, exports, types, props, callbacks, or public-contract compatibility | Read-only, consumer-focused API review |
| [review-compatibility](skills/review-compatibility/SKILL.md) | upgrade, migration, backward compatibility, persisted state, or wire format | Read-only, supported-state compatibility review |
| [review-performance](skills/review-performance/SKILL.md) | performance, bundle, rendering, layout, paint, or scale | Read-only, evidence-based performance review |
| [review-security](skills/review-security/SKILL.md) | security, privacy, authorization, injection, secrets, or sensitive data | Read-only, trust-boundary security review |
| [review-test-quality](skills/review-test-quality/SKILL.md) | test strategy, behavioral testing, UI tests, or verification | Read-only, user-observable test-quality review |
| [review-internationalization](skills/review-internationalization/SKILL.md) | i18n, localization, translation, locale, or RTL | Read-only, locale and translation review |
| [review-documentation](skills/review-documentation/SKILL.md) | documentation, examples, JSDoc, comments, or developer experience | Read-only, source-verified documentation review |
| [review-simplicity](skills/review-simplicity/SKILL.md) | every PR review; simplification, code removal, code bloat, duplication, or overengineering | Mandatory, read-only, deletion-first implementation review |
| [review-coordinator](skills/review-coordinator/SKILL.md) | panel, subagent, coordinated, or multi-specialist PR review | One rechecked response from material specialist handoffs |
| [self-review-pr](skills/self-review-pr/SKILL.md) | "self-review" | Independent PR self-review with the simplicity baseline and a no-subagent fallback |
| [iterate-pr-review](skills/iterate-pr-review/SKILL.md) | repeated Copilot and self-review loop | Bounded authored-PR review iterations with an evidence-based recap |
| [write-pr-description](skills/write-pr-description/SKILL.md) | "write/update PR description" | PR description writer following the repository template |
| [draft-review-comment](skills/draft-review-comment/SKILL.md) | "craft a comment" | GitHub review comment drafter that never posts directly |
| [audit-dependency-update](skills/audit-dependency-update/SKILL.md) | updating a dependency | Changelog, impact, compatibility, and security audit |
| [address-pr-feedback](skills/address-pr-feedback/SKILL.md) | "address the feedback" | Systematic workflow for review comments |
| [investigate-debug](skills/investigate-debug/SKILL.md) | "debug this" | Reproduce, isolate, fix, and verify |
| [refactor](skills/refactor/SKILL.md) | "refactor X" | Verified codebase-wide refactoring workflow |
| [resume-session](skills/resume-session/SKILL.md) | "continue where we left off" | Recover and verify previous work |
| [prepare-release](skills/prepare-release/SKILL.md) | "prepare a release" | Local release preparation without remote publication |
| [publish-release](skills/publish-release/SKILL.md) | "publish the release" | Explicitly authorized release publication |
| [release-publish](skills/release-publish/SKILL.md) | legacy `release-publish` invocation | Deprecated compatibility route to the two release workflows |

### Specialist reviews

Accessibility, API design, compatibility, performance, security, test quality, internationalization, documentation, and simplicity reviews are direct skills. Simplicity is a mandatory baseline for every ordinary, coordinated, and self-review PR pass; the other specialist lanes remain conditional on material scope. [ADR 0004](docs/decisions/0004-skill-first-specialists.md) established that their methods must remain canonical skills rather than duplicated agent prompts. The optional [review coordinator](docs/decisions/0006-review-coordinator.md) supports host-provided subagents for material additional lanes and rechecks one final response. The repository still bundles no custom agents.

## Conventions

See [CONVENTIONS.md](CONVENTIONS.md) for meta-conventions used across all files:

- **Severity tags**: `[RULE]` / `[STRONG]` / `[PREFER]` to help AI agents calibrate hard rules vs. soft preferences.
- **Agent Skills**: Each workflow has a `SKILL.md` entrypoint with standard `name` and `description` frontmatter.
- **Progressive disclosure**: Skill directories carry their own bundled references and are installed as complete units.
- **Specialist execution**: Reusable review methods live in skills. The coordinator can use host-provided subagents for independent, material lanes and has a sequential fallback; add a custom agent only when it demonstrates value beyond that workflow.
- **Skill evaluation**: New or materially changed skills use versioned trigger and output fixtures; see the [evaluation guide](docs/skill-evaluations.md).

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

The script auto-detects supported product surfaces by scanning `$HOME` for known configuration directories, then offers an interactive prompt. Use `--yes` to skip the prompt (selects all detected product surfaces), or `--agent <name>` to target a specific surface. When `--copilot-concat` is used without `--agent`, the script skips product detection and exports only the shared project `AGENTS.md`. Combine it with an explicit `--agent` when both operations are intended.

### Supported product surfaces

<!-- platform-support:start -->

<!-- Generated from platforms/manifest.json. Do not edit this table directly. -->

| Product surface | Tier | Instructions | Skills | Adapter checked |
| --- | --- | --- | --- | --- |
| Cursor editor and Agent CLI | preview | `~/.cursor/rules/core.mdc` | `~/.cursor/skills/*/SKILL.md` | 2026-07-22 |
| Claude Code CLI | preview | `~/.claude/CLAUDE.md` | `~/.claude/skills/*/SKILL.md` | 2026-07-22 |
| Codex app, CLI, and IDE extension | preview | `~/.codex/AGENTS.md` | `~/.agents/skills/*/SKILL.md` | 2026-07-22 |
| GitHub Copilot CLI | preview | `~/.copilot/copilot-instructions.md` | `~/.copilot/skills/*/SKILL.md` | 2026-07-22 |
| Google Antigravity CLI | preview | `~/.gemini/GEMINI.md` | `~/.gemini/antigravity-cli/skills/*/SKILL.md` | 2026-07-23 |

<!-- platform-support:end -->

See [platform support](docs/platform-support.md) for tier definitions, current product discovery checks, and the release verification checklist.

Google Antigravity CLI is the preview Google surface. Gemini CLI is unsupported by default until a supported authenticated context has current product evidence; managed legacy Gemini skills migrate to Antigravity’s native global skill path.

### Commands

| Command | What it does |
| --- | --- |
| `install` (default) | Create symlinks (or copies) into agent config directories |
| `list` | Show all installed symlinks/copies grouped by agent (includes stale entries) |
| `remove` | Remove symlinks/copies created by this script (includes stale cleanup) |
| `update` | Re-install + clean stale symlinks/copies for deleted source files |
| `check` | Verify existing symlinks, copies, and generated artifacts; detect stale, broken, or conflicting entries; and exit non-zero when problems are found |

### Options

| Flag | What it does |
| --- | --- |
| `--agent <name>` | Target a specific agent (`cursor`, `claude`, `codex`, `copilot`, `antigravity`). Repeatable. `--agent '*'` for all. `gemini` remains a deprecated alias for `antigravity` during the migration window. |
| `--only <category>` | Limit operations to specific categories (`instructions`, `skills`, `agents`). Repeatable. `agents` is retained only to safely clean up retired repository-managed agents; the legacy `personas` value remains its alias. |
| `--copilot-concat [DIR]` | Export `AGENTS.md` in the target directory. Without `--agent`, does not modify global product configurations. Refuses to overwrite a user-maintained file. |
| `--copy` | Copy files instead of symlinking (useful on Windows/WSL or in CI). Use `update --copy` to refresh stale copies. |
| `-y`, `--yes` | Skip all prompts -- auto-select all detected agents |
| `--dry-run` | Show what would be done without making changes |

### Examples

```bash
./setup.sh                                        # Interactive: detect + prompt
./setup.sh --yes                                   # Non-interactive: all detected agents
./setup.sh --agent cursor --agent claude           # Target specific agents
./setup.sh --agent '*' --dry-run                   # Preview for all agents
./setup.sh update --agent '*' --only agents        # Remove retired repository-managed agents
./setup.sh remove --agent cursor                   # Remove Cursor symlinks
./setup.sh update --agent '*'                      # Re-install + clean stale links
./setup.sh check --agent cursor                    # Verify managed Cursor configuration
./setup.sh install --copy --yes                    # Copy mode for CI
./setup.sh --copilot-concat ~/Code/my-project      # Export only: write project AGENTS.md
./setup.sh --agent codex --copilot-concat .        # Install Codex files and export AGENTS.md
```

The installer is non-destructive and idempotent. It stages complete artifacts before publishing them, never clobbers an unexpected destination, and skips files it cannot prove it owns. Copied and generated artifacts carry strict ownership markers, so `update --copy` only replaces files previously installed by this repository.

### Manual integration

If you prefer to set things up manually or use a different tool:

- **Cursor**: Instructions to `~/.cursor/rules/` and skills to `~/.cursor/skills/`
- **Claude Code**: Managed `~/.claude/CLAUDE.md` imports adjacent `~/.claude/AGENTS.md`; skills go to `~/.claude/skills/`
- **Codex**: Instructions to managed `~/.codex/AGENTS.md` and skills to the shared `~/.agents/skills/` location
- **GitHub Copilot CLI**: Managed `~/.copilot/copilot-instructions.md` imports adjacent `~/.copilot/AGENTS.md`; skills go to `~/.copilot/skills/`; use `--copilot-concat` only for explicit repository export
- **Google Antigravity CLI**: Managed `~/.gemini/GEMINI.md` imports adjacent `~/.gemini/AGENTS.md`; skills go to `~/.gemini/antigravity-cli/skills/`. Repository-managed legacy Gemini skills migrate there during install or update.
- **Other tools** (Windsurf, Zed, etc.): Include instruction files as system prompt context, or copy them into the tool's configuration directory

### Per-project overrides

These instructions are global defaults. To override for a specific project:

- **All supported tools**: Start with a root `AGENTS.md` for shared project guidance.
- **Cursor**: Add `.cursor/rules/` only for scoped rules or Cursor-specific metadata; use `.cursor/skills/` for project skills.
- **Claude Code**: Add `CLAUDE.md` with `@AGENTS.md` only for Claude-specific guidance; use `.claude/rules/` or `.claude/skills/` when their scoped behavior is needed.
- **Codex**: Add nested `AGENTS.md` or `.agents/skills/` for subtree-specific work.
- **GitHub Copilot CLI**: Add `.github/copilot-instructions.md` only for Copilot-specific guidance; do not re-import `AGENTS.md`, which Copilot already discovers. Use `.github/skills/` for project skills.
- **Google Antigravity CLI**: Add `GEMINI.md` with `@AGENTS.md` only for Antigravity-specific guidance, or `.agents/skills/` for project skills.
- Use the project-level config to relax global rules (e.g., "this project uses Tailwind instead of CSS Modules") or add project-specific conventions.

## Updating

These are living documents. In the default mode, portable skills are symlinked as complete directories with their bundled resources. Cursor rules and the managed `AGENTS.md`/native-wrapper instruction artifacts are generated files; refresh them after source changes with `./setup.sh update --agent '*'`. Copy-mode installations require `update --copy`. In every mode, `update` removes stale repository-owned entries, including retired custom agents, while preserving user-maintained files. See the [migration guide](docs/migration-guide.md) before upgrading an older installation.

## Development

Development requires Node.js 22 or newer and npm.

The installer architecture and safety decisions are recorded in [ADR 0001](docs/decisions/0001-node-installer.md), the context-scoping decision in [ADR 0002](docs/decisions/0002-progressive-disclosure.md), the specialist execution decision in [ADR 0004](docs/decisions/0004-skill-first-specialists.md), the coordinated-review MVP in [ADR 0006](docs/decisions/0006-review-coordinator.md), the shared artifact decision in [ADR 0005](docs/decisions/0005-agents-md-canonical-artifact.md), and the Antigravity/Gemini policy in [ADR 0007](docs/decisions/0007-antigravity-adapter-and-gemini-policy.md).

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
