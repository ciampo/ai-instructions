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
