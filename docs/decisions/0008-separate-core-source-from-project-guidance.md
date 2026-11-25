# ADR 0008: Separate the Distributed Core from This Repository's Project Guidance

- **Status:** Accepted
- **Date:** 2026-11-24
- **Amends:** [ADR 0005](0005-agents-md-canonical-artifact.md)

## Context

ADR 0005 made root `AGENTS.md` the source that the installer distributes. That file holds personal defaults for every session. Products also discover a root `AGENTS.md` as project guidance for the repository that contains it. One file therefore did two jobs, with these results:

- A session in this repository loaded the same core twice: once from the installed user-level file and once from the checkout. The copy cost about 8 KB of context in each session.
- [Discovery evidence](../discovery-evidence.md) could not attribute a behavior to the user-level adapter, because the workspace copy supplied the same rules.
- The repository had no project guidance of its own. Its verification commands, budgets, and evaluation rules were in `CONVENTIONS.md` and the README, which no product loads automatically.

ADR 0005 already stated the intent that this change restores: a root `AGENTS.md` carries repository setup, verification, and conventions, and personal global preferences stay separate from project-owned conventions.

## Decision

- `instructions/core.md` is the single source for the distributed always-on core. The installer, the `--copilot-concat` export, and the content budget read this file.
- Root `AGENTS.md` is project guidance for this repository only. The installer does not read or distribute it. `CLAUDE.md` imports it for Claude Code.
- Installed artifacts do not change. Each product still receives the same generated files at the same destinations, and an exported project file is still named `AGENTS.md`.

## Consequences

- Existing installations keep working, because instruction artifacts are generated copies and not links to the source path. Run `./setup.sh update --agent '*'` after pulling, as for any source change.
- The 150-line and 8 KB budget now applies to `instructions/core.md`.
- The source file name is not a discovered name, so no product loads the personal core as project guidance for this checkout.
- Project guidance and personal defaults can now disagree. Keep `AGENTS.md` limited to facts about this repository.

## Alternatives considered

### Keep one root file

Rejected. It keeps the duplicate load and the attribution problem, and it leaves no place for project guidance.

### Keep the root file as the source and add project guidance to it

Rejected. Repository setup and budgets would then ship to every product and every exported project.
