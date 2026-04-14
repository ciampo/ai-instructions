# Conventions

Meta-conventions used across all instruction, skill, and persona files in this repo.

## Severity Tags

Rules and preferences are tagged with severity to help AI agents calibrate:

- **[RULE]** — Hard, non-negotiable. Violating this is always wrong.
- **[STRONG]** — Strong preference. Override only with explicit justification.
- **[PREFER]** — Default preference. Flexible per-project or per-situation.

Not every bullet point needs a tag. Use them on items where the distinction matters — where an agent might otherwise treat a hard rule as optional, or over-enforce a soft preference.

## Cross-References in Skills and Personas

Skills and personas that depend on instruction files must declare their dependencies at the top:

```markdown
## Dependencies

Load these instruction files before executing this skill/persona:

- `instructions/code-review.md`
- `instructions/accessibility.md`
```

This tells the agent which context to load. If a dependency is not available, the agent should still proceed but note the gap.

## Workflow Routing

`instructions/workflow-routing.md` maps task types to required skills. It is **auto-generated** by `setup.sh` from metadata in skill files — do not edit the installed copies directly.

### Routing comments in skills

Each skill that should appear in the routing table must include an HTML comment near the top of the file:

```markdown
<!-- routing: [SEVERITY] Short description of when to use this skill -->
```

`setup.sh` extracts these comments, resolves the skill paths for each agent, and generates the routing instruction file during installation. When adding a new skill, add a routing comment to include it in the table. Skills without a routing comment (e.g., supporting skills like `draft-review-comment`) are omitted.

### Severity calibration

Use severity tags from the **Severity Tags** section above to control how strongly agents are directed toward each skill:

- **[RULE]**: Non-negotiable — agent must always follow (e.g., `audit-dependency-update`, `write-pr-description`).
- **[STRONG]**: Strong default — agent should follow unless there is explicit justification to skip (e.g., `review-pr`, `self-review-pr`).
- **[PREFER]**: Recommended — agent should consider but may skip for simple tasks (e.g., `investigate-debug`, `refactor`).

## Guardrails

`instructions/guardrails.md` extracts the most commonly violated rules from other instruction files into always-on context. It must stay **under 30 lines** — only promote rules that are violated repeatedly and universally. The source of truth remains the original instruction files; the guardrails file is intentionally duplicated for visibility.
