# ADR 0004: Use Skills as the Specialist Source of Truth

- **Status:** Accepted
- **Date:** 2026-07-22

## Context

Accessibility, API-design, and performance review were each represented by a custom-agent prompt. The general PR-review workflow also covered those domains, and the accessibility implementation reference contained related standards. Maintaining methods and output rules in several places created a clear drift risk.

The project-update pilot required a canonical accessibility-review skill, direct and delegated evaluation on the same cases, and equivalent decisions for API design and performance. A custom agent was justified only if isolated or delegated execution materially improved the result.

## Decision

Keep the complete specialist method in one direct Agent Skill:

- `review-accessibility` for source-verified accessibility audits;
- `review-api-design` for focused public API reviews;
- `review-performance` for evidence-based bundle and runtime analysis.

Do not distribute parallel custom-agent prompts for specialist methods. The `review-pr` workflow performs its complete core pass, loads a specialist skill only when that domain is material, rechecks findings against the actual change and consumers, normalizes severity, removes duplicates, and owns final delivery. [ADR 0006](0006-review-coordinator.md) adds one optional coordinator agent with that distinct orchestration role; it does not duplicate a specialist method.

The platform manifest distributes the coordinator while retaining former specialist-agent locations as cleanup paths. `update` and `remove` preserve the expected coordinator and delete only repository-owned retired artifacts, leaving user-authored agents untouched. Adapter-format fixtures remain available to protect the compatibility code during the migration window.

## Evidence

The accessibility skill passed explicit, implicit, negative, sibling-confusion, no-findings, material-violation, and read-only-boundary cases. Its first material-violation run exposed an overclaim about unobserved focus behavior; tightening the canonical skill corrected the rerun.

Delegated comparisons added no distinct tools, permissions, model configuration, context isolation, or higher-quality result:

- the accessibility agent retained an older output taxonomy even when the current skill was supplied;
- the API agent promoted an unknown `variant` vocabulary to a breaking risk despite missing consumers and compatibility policy, while the skill kept it as a verification gap;
- the performance agent treated measurement as optional supporting detail, while the skill separated source-proven cost from missing bundle, profile, and realistic-scale evidence.

The complete matrix is recorded in [the specialist pilot](../accessibility-review-pilot.md).

## Consequences

- There is one canonical authority, evidence, and output contract per specialist.
- Products without custom-agent support retain the complete capability through standard skills.
- A product-specific agent adapter may be reconsidered only when live evaluation demonstrates measurable execution value that direct skill use cannot provide.
- The optional coordinator remains subject to the same live-evaluation threshold; it is not evidence that the former specialist agents should return.
- Existing user-owned agents are not removed; only artifacts proven to belong to this repository are migration candidates.

## Alternatives considered

### Keep full custom-agent prompts

Rejected because the prompts duplicated the skills, overlapped general review routing, and already produced evidence and taxonomy drift.

### Keep thin specialist-agent adapters

Rejected because the evaluated adapters changed neither tools nor results. A wrapper without demonstrated execution value would add another discovery and lifecycle surface. This does not apply to the separate coordinator role recorded in ADR 0006.

### Generate native agents from skills

Deferred. Generation is appropriate only if a verified product requires a native agent to expose capability that its standard skill path cannot provide.
