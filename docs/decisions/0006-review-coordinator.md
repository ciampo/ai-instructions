# ADR 0006: Provide a Coordinated Review MVP

- **Status:** Accepted
- **Date:** 2026-07-24

## Context

[ADR 0004](0004-skill-first-specialists.md) keeps review methods in direct skills because the earlier accessibility, API-design, and performance agents duplicated those methods and introduced evidence and output drift.

That decision does not rule out a distinct coordination job. Complex pull requests can have independent material lanes, such as authorization, persisted-data migration, behavioral UI verification, localization, and documentation. A host that can run isolated subagents may investigate those lanes concurrently, but it must still deliver one evidence-backed review instead of competing reports.

## Decision

Distribute `review-coordinator` as an optional direct-skill MVP. It uses `review-pr` as the canonical snapshot, core-review, severity, deduplication, and delivery workflow; it always includes the `review-simplicity` baseline, then assigns only materially relevant additional specialist skills to bounded independent handoffs.

The coordinator may use host-provided subagents in parallel. Where that capability is unavailable, it performs the same handoffs sequentially. It is not a custom-agent definition and does not introduce adapter-specific model routing.

The specialist set is:

- simplicity as a mandatory baseline for every review;
- accessibility, public API design, compatibility, performance, security, test quality, internationalization, and documentation when material;
- dependency-specific security work remains with `audit-dependency-update`.

The coordinator rechecks every candidate against the pinned diff, consumers, repository policy, and existing review state. It treats agreement as a prompt to verify, never as proof. A single final response contains only confirmed, deduplicated findings; uncertainty stays in verification gaps.

## Consequences

- `review-pr` remains the default for ordinary PRs and products without subagent support.
- `review-coordinator` is appropriate only when a user requests a panel or two or more independent additional specialist lanes are material; the mandatory simplicity baseline does not trigger escalation.
- Specialists retain one canonical evidence and output contract in their direct skills; the coordinator does not duplicate their methods in custom-agent prompts.
- The MVP must be assessed on representative PRs for confirmed findings, false positives, duplicates, wall time, token use, and whether the synthesized review improves author actionability.
- No custom-agent output or product-specific model configuration is distributed.

## Alternatives considered

### Keep no coordinator

Rejected for the MVP. The direct skills remain necessary, but they do not provide a reusable contract for parallel, independent handoffs and one rechecked delivery.

### Replace `review-pr` with the coordinator

Rejected. Most PRs do not benefit from parallel delegation, and `review-pr` must remain directly usable on products without subagent support.

### Use a panel vote

Rejected. Multiple agents can share the same unsupported assumption. Evidence, not a vote count, establishes a review finding.

### Assign a cheaper specialist model in the shared agent

Deferred. Model identifiers, availability, and routing remain product-specific; no quality or cost evidence supports a portable model rule.
