# Migration Guide

The current installer changes instruction scope and installs complete Agent Skill directories so bundled references and scripts remain available. It preserves user-owned content and removes only repository-owned symlinks or artifacts with strict managed markers.

## Before Updating

1. Verify that Node.js 22 or newer is available before replacing an older installation. The former Bash installer did not require Node:

   ```bash
   node --version
   ```

2. Commit or back up local changes to this repository.
3. Back up any user-maintained files under the target product directories.
4. Preview the migration:

   ```bash
   ./setup.sh update --agent '*' --dry-run
   ```

5. Run the update. Add `--copy` if the existing installation uses copy mode or when running on native Windows.

   ```bash
   ./setup.sh update --agent '*'
   ```

6. Run `./setup.sh check --agent '*'` and complete the discovery checks in [the platform support guide](platform-support.md).

## What Changes

### Universal instructions

The installer now publishes only `instructions/core.md` as always-on context. Former technology, review, repository, and writing rules moved into discoverable skills. Updating removes the old managed per-file rules and refreshes the concatenated Codex, Copilot, and Gemini files.

User-authored rules are left untouched. A conflict reported by `check` requires a manual choice: keep the user file, merge its intent into the canonical source, or move it before rerunning update.

### Agent Skill directories

Current installations link or copy each complete `skills/<name>/` directory instead of installing only `SKILL.md`. This preserves bundled `references/`, `scripts/`, and `assets/`.

The installer automatically migrates an old skill directory only when its `SKILL.md` is repository-owned or managed and any other entries are known operating-system metadata (`.DS_Store` or `Thumbs.db`). If you added files to an installed skill directory, it is treated as user-owned and preserved. Back up those additions, remove or relocate the conflict, and rerun update.

Legacy managed skill copies retain copy mode during their first update, even when `--copy` is omitted. Newly installed skills still use the requested mode. The former combined `release-publish` skill remains available as a deprecated compatibility route to `prepare-release` or `publish-release`.

Copy-mode skill directories contain `.ai-instructions-managed`. Do not add that marker to a user-maintained directory.

### Legacy product paths

- **Cursor**: managed skills under `~/.cursor/skills-cursor/` move to `~/.cursor/skills/`. Managed instruction rules not present in the new core are removed. User-owned files remain.
- **Codex**: managed files under the former `~/.codex/instructions/` layout are removed. The current global file is `~/.codex/AGENTS.md`; `AGENTS.override.md` still takes precedence and is never modified.
- **GitHub Copilot CLI**: user agents use `.agent.md`. Managed legacy `.md` agents are removed during update. The optional repository export remains explicit: run `./setup.sh update --copilot-concat <project>` for each generated project file.
- **Gemini CLI**: update creates the global `~/.gemini/GEMINI.md` core file and installs complete skills and agents in their native user directories.
- **Claude Code**: the obsolete reminder to import rules from `CLAUDE.md` is gone. User rules, complete skills, and agents are installed directly in their native directories.

## Troubleshooting

- `check` exits non-zero for missing, stale, changed, or conflicting expected artifacts. Run `list` for a categorized view and `update` to repair only repository-owned state.
- If a generated file is reported as user-owned, compare it with the canonical source before moving it. The installer intentionally refuses to claim it automatically.
- If Codex skips global instructions, check for `~/.codex/AGENTS.override.md`.
- If native Windows cannot create symlinks, rerun with `--copy` through `node scripts/setup.mjs`.
- If a skill does not appear, verify that the whole skill directory and exact uppercase `SKILL.md` were installed, then use the product-specific reload/discovery command.
