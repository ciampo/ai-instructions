# ADR 0006: Add an Optional Review Coordinator

- **Status:** Accepted
- **Date:** 2026-07-23

## Context

[ADR 0004](0004-skill-first-specialists.md) keeps accessibility, public API-design, and performance review methods in direct skills. Its evaluated specialist agents duplicated those methods and introduced output and evidence drift.

That decision does not rule out an agent that has a distinct job: coordinate independent, materially relevant skill passes for a complex PR, then produce one rechecked review. A coordinator can reduce wall-clock time when the host can run isolated subagents in parallel, but it can also duplicate PR context and increase cost.

## Decision

Distribute one thin, opt-in `review-coordinator` agent. It loads `review-pr` as the canonical workflow, delegates only to the existing specialist skills, and owns final synthesis. It does not duplicate specialist methods, set a model, or claim a cost saving.

The agent uses the runtime's configured model and reasoning defaults because model identifiers, availability, and per-agent routing are product-specific. A shared agent source must not encode a model field that only some adapters understand.

## Consequences

- `review-pr` remains the default and canonical general PR-review workflow.
- The coordinator is useful only when independent specialist lanes are materially in scope; it is not a reason to run several generic full reviews.
- Each adapter remains preview until live discovery proves it can invoke the coordinator and its installed skills.
- Retain the coordinator only after representative direct-versus-coordinated comparisons measure confirmed findings, false positives, duplicates, wall time, and token use. Add model routing only if that evidence shows a quality or cost benefit.

## Alternatives considered

### Keep no distributed agents

Rejected for this narrow case. The coordinator has a distinct orchestration role and reuses the existing skill contracts rather than duplicating them.

### Assign a cheaper specialist model in the shared agent

Rejected. The shared source has no portable model-routing field, and a cheaper model has not been evaluated against the evidence and severity requirements for review findings.

### Replace `review-pr` with the coordinator

Rejected. Most PRs do not benefit from parallel delegation, and `review-pr` must remain directly usable on products without subagent support.
