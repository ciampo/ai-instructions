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

The installer now uses root [`AGENTS.md`](../AGENTS.md) as the single always-on source. Former technology, review, repository, and writing rules remain in discoverable skills. Updating removes the old managed per-file rules, refreshes the generated Cursor rule and Codex file, and creates managed `AGENTS.md` sidecars plus thin native wrappers for Claude, Copilot, and Gemini.

User-authored rules are left untouched. A conflict reported by `check` requires a manual choice: keep the user file, merge its intent into the canonical source, or move it before rerunning update.

### Agent Skill directories

Current installations link or copy each complete `skills/<name>/` directory instead of installing only `SKILL.md`. This preserves bundled `references/`, `scripts/`, and `assets/`.

The installer automatically migrates an old skill directory only when its `SKILL.md` is repository-owned or managed and any other entries are known operating-system metadata (`.DS_Store` or `Thumbs.db`). If you added files to an installed skill directory, it is treated as user-owned and preserved. Back up those additions, remove or relocate the conflict, and rerun update.

Legacy managed skill copies retain copy mode during their first update, even when `--copy` is omitted. Newly installed skills still use the requested mode. The former combined `release-publish` skill remains available as a deprecated compatibility route to `prepare-release` or `publish-release`.

Copy-mode skill directories contain `.ai-instructions-managed`. Do not add that marker to a user-maintained directory.

### Specialist reviews and retired agents

Accessibility, public API-design, and performance reviews now use the `review-accessibility`, `review-api-design`, and `review-performance` skills directly. The repository no longer installs custom-agent definitions for those capabilities.

During `update` or `remove`, the installer recognizes the former agent destinations on all five product surfaces and removes only repository-owned symlinks or files carrying a managed marker. User-authored agents and unknown files in the same directories are preserved. `--only agents` and the deprecated `--only personas` alias remain available for this cleanup during the compatibility window.

### Legacy product paths

- **Cursor**: managed skills under `~/.cursor/skills-cursor/` move to `~/.cursor/skills/`. The generated user rule now derives from root `AGENTS.md`. User-owned files remain.
- **Codex**: managed files under the former `~/.codex/instructions/` layout are removed. The current global file is `~/.codex/AGENTS.md`; `AGENTS.override.md` still takes precedence and is never modified.
- **Claude Code**: update creates managed `~/.claude/AGENTS.md` and `~/.claude/CLAUDE.md`. The latter contains only `@AGENTS.md`, so add any user-owned Claude-specific guidance elsewhere instead of editing the managed wrapper.
- **GitHub Copilot CLI**: update creates managed `~/.copilot/AGENTS.md` and a thin `~/.copilot/copilot-instructions.md` wrapper. The optional repository export remains explicit: run `./setup.sh update --copilot-concat <project>` to create project-root `AGENTS.md`. During this export, a repository-owned wrapper from an earlier export is removed to prevent duplicated instructions; user-owned `.github/copilot-instructions.md` files are preserved for Copilot-specific guidance.
- **Gemini CLI**: update creates managed `~/.gemini/AGENTS.md` and `~/.gemini/GEMINI.md`; the latter imports the former. Complete skills remain in their native user directory.

For every supported product surface, `install`, `update`, and `remove` also clean only repository-owned artifacts from the retired custom-agent layout. User-authored agents are preserved.

## Troubleshooting

- `check` exits non-zero for missing, stale, changed, or conflicting expected artifacts. Run `list` for a categorized view and `update` to repair only repository-owned state.
- If a generated file is reported as user-owned, compare it with the canonical source before moving it. The installer intentionally refuses to claim it automatically.
- If Codex skips global instructions, check for `~/.codex/AGENTS.override.md`.
- If a Claude, Copilot, or Gemini wrapper cannot load the shared instructions, verify that its adjacent managed `AGENTS.md` exists and still contains the managed marker. Run `update` to repair a repository-owned stale pair; do not replace a user-owned file automatically.
- If native Windows cannot create symlinks, rerun with `--copy` through `node scripts/setup.mjs`.
- If a skill does not appear, verify that the whole skill directory and exact uppercase `SKILL.md` were installed, then use the product-specific reload/discovery command.
