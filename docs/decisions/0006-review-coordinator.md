# ADR 0006: Evaluate an Optional Review Coordinator

- **Status:** Proposed
- **Date:** 2026-07-23

## Context

[ADR 0004](0004-skill-first-specialists.md) keeps accessibility, public API-design, and performance review methods in direct skills. Its evaluated specialist agents duplicated those methods and introduced output and evidence drift.

That decision does not rule out an agent that has a distinct job: coordinate independent, materially relevant skill passes for a complex PR, then produce one rechecked review. A coordinator can reduce wall-clock time when the host can run isolated subagents in parallel, but it can also duplicate PR context and increase cost. No representative direct-versus-coordinated comparison has established that value yet.

## Decision

Do not distribute a `review-coordinator` yet. First evaluate a thin coordinator that uses `review-pr` as the canonical workflow and replaces its conditional specialist-routing step with independent, materially relevant handoffs to the existing specialist skills. It must recheck and synthesize those handoffs into one review.

The evaluation should use runtime model and reasoning defaults because model identifiers, availability, and per-agent routing are product-specific. It must not encode a shared model field that only some adapters understand.

## Consequences

- `review-pr` remains the default and canonical general PR-review workflow; the current distribution does not add a custom agent or adapter output.
- Evaluate only PRs with independent material specialist lanes; do not run several generic full reviews.
- Before distribution, compare direct and coordinated review on representative PRs and measure confirmed findings, false positives, duplicates, wall time, and token use.
- Add model routing only if that evidence shows a quality or cost benefit.

## Alternatives considered

### Keep no distributed agents

Selected until the evaluation demonstrates measurable value.

### Assign a cheaper specialist model in the shared agent

Rejected. The shared source has no portable model-routing field, and a cheaper model has not been evaluated against the evidence and severity requirements for review findings.

### Replace `review-pr` with the coordinator

Rejected. Most PRs do not benefit from parallel delegation, and `review-pr` must remain directly usable on products without subagent support.
