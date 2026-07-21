# Conventions

Meta-conventions used across all instruction, skill, and custom-agent files in this repo.

## Severity Tags

Rules and preferences are tagged with severity to help AI agents calibrate:

- **[RULE]** — Hard, non-negotiable. Violating this is always wrong.
- **[STRONG]** — Strong preference. Override only with explicit justification.
- **[PREFER]** — Default preference. Flexible per-project or per-situation.

Not every bullet point needs a tag. Use them on items where the distinction matters — where an agent might otherwise treat a hard rule as optional, or over-enforce a soft preference.

## Agent Skills

Every skill follows the [Agent Skills specification](https://agentskills.io/specification) and lives at `skills/<name>/SKILL.md`.

The file starts with YAML frontmatter:

```yaml
---
name: review-pr
description: Perform a read-only, multi-round pull-request review. Use when asked to review someone else's PR.
---
```

- `name` matches the directory name and uses lowercase letters, numbers, and hyphens.
- `description` says what the skill does and when to use it.
- The body is self-contained and states required capabilities and safe fallbacks.
- Supporting material belongs inside the skill directory under `references/`, `scripts/`, or `assets/` and is linked with relative paths.
- Do not reference the source checkout with absolute paths.

Procedural workflows belong in skills instead of always-on instructions. Native skill descriptions replace the former generated workflow-routing file.

## Custom Agents

Shared custom-agent sources live at `agents/<name>.md` with `name` and `description` YAML frontmatter. Keep shared definitions to the common metadata subset; platform-specific adapters generate any required native format.

Keep required metadata as single-line plain or quoted scalars. The portable Codex adapter rejects block scalars and quoted escape sequences that it cannot translate safely.

The Markdown body is the canonical prompt for Markdown-based products. Codex TOML is generated from the same name, description, and body. Never add a platform-only field to the shared frontmatter unless every direct consumer supports it.

## Guardrails

`instructions/guardrails.md` extracts the most commonly violated rules from other instruction files into always-on context. It must stay **under 30 lines** — only promote rules that are violated repeatedly and universally. The source of truth remains the original instruction files; the guardrails file is intentionally duplicated for visibility.
