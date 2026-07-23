# Conventions

Meta-conventions used across instruction and skill files in this repository.

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

## Skill Design and Evaluation

Before proposing a skill, classify the repeated gap in the pull request's **Why** section:

- **Capability uplift** teaches a capability that the host cannot reliably perform without packaged knowledge, tools, or assets.
- **Encoded preference** captures a repeatable team or personal way of performing a capability the host already has.

Do not add this classification to portable frontmatter. It is planning context, not a routing signal, and vendor support for optional frontmatter varies.

New or materially changed skills should include `evals/evals.json` with realistic positive and near-miss trigger cases plus at least one output case. Follow the [skill evaluation guide](docs/skill-evaluations.md); add the fixture when a workflow is introduced or materially reshaped, rather than backfilling the catalogue mechanically.

## Specialist Execution

The repository no longer distributes custom-agent sources or platform adapters. Specialist reviews are direct Agent Skills. The installer retains legacy agent destinations solely to identify and remove repository-owned artifacts from earlier installations; it never manages or removes user-authored agents.

The review method, evidence requirements, authority boundary, output contract, and completion criteria for a reusable specialist belong in one canonical skill. General workflows may load that skill directly and synthesize its findings.

Add a custom agent only when evaluation demonstrates value from context isolation, an independent parallel pass, restricted tools or permissions, a different model configuration, or a separately inspectable result. A custom agent must not restate or silently diverge from the canonical skill. This repository currently distributes no custom agents.

## Universal Instructions

`AGENTS.md` contains only product-neutral personal boundaries and defaults that apply in every session. Framework guidance, repository conventions, and procedures belong in skills.

The generated universal artifact must remain below 150 lines and 8 KB. `npm run content:check` enforces that budget along with skill frontmatter, bundled-reference, optional agent metadata, and manifest contracts.
