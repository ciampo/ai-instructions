---
name: review-coordinator
description: Coordinate a read-only panel review of a complex pull request by assigning independent, materially relevant specialist investigations and synthesizing one rechecked response. Use when a user explicitly asks for a panel, subagent, coordinated, or multi-specialist review, or when a complex PR has two or more independent specialist lanes. Keep review-pr as the default for ordinary PRs. Never edit source, commit, or write remotely.
---

# Review Coordinator

Coordinate independent specialist investigations without replacing the core `review-pr` workflow or producing competing review reports.

## Authority and scope

- Keep the review read-only. Follow the pinned PR snapshot and existing-comment procedure from `review-pr` before assigning work.
- Use this workflow when a user explicitly requests a panel or when at least two specialist lanes are materially independent. An explicit request with fewer than two material lanes may use only the applicable lane; do not invent filler work to form a panel.
- Use host subagents in parallel when available. Otherwise run the same bounded handoffs sequentially and disclose that fallback only when it affects the requested outcome.
- Do not modify source, tests, generated files, pull-request metadata, comments, or remote state.

## Coordinate the review

1. **Capture one immutable review boundary**: Record the repository, base and head revisions, changed files, existing review state, and target audience. Every specialist receives this same snapshot.
2. **Establish the core review result**: When `review-pr` invokes the coordinator, use its completed core-review result and pinned snapshot; do not re-enter `review-pr` or repeat its delivery steps. When invoked directly, follow `review-pr`'s snapshot and core-review method without re-entering its coordinator-routing step. In either path, cover correctness, scope, consumers, accessibility baseline, dependencies, and documentation baseline before selecting only material specialist lanes:
   - `review-accessibility` for substantial UI or interaction risk.
   - `review-api-design` for public API shape and consumer ergonomics.
   - `review-compatibility` for supported versions, upgrades, persisted state, migrations, wire formats, or integrations.
   - `review-performance` for material bundle, runtime, layout, or scale risk.
   - `review-security` for trust boundaries, authority, sensitive data, injection, or secrets. Do not use it as a substitute for dependency auditing.
   - `audit-dependency-update` for every dependency change. Include its release, resolved-version, compatibility, audit, and build evidence in the coordinated result when the change is otherwise in scope.
   - `review-test-quality` when behavior, regressions, UI semantics, mocks, or verification evidence are material.
   - `review-internationalization` for localized text, formatting, pluralization, or directional UI.
   - `review-documentation` when user or developer documentation, examples, migration guidance, or meaningful comments change.
3. **Assign bounded, independent handoffs**: Ask each specialist to inspect only its lane and return: scope checked; confirmed candidate findings with exact evidence and impact; verification gaps; and an explicit no-findings result. Do not give specialists another lane's conclusions before their first pass.
4. **Hold an evidence review, not a vote**: Group duplicate or conflicting candidates. For a disputed, cross-domain, or `[critical]`/`[major]` candidate, request a narrowly scoped recheck from the relevant specialist or inspect the source directly. Agreement alone never confirms a finding.
5. **Synthesize one response**: Recheck every retained candidate against the pinned diff, consumers, repository policy, and existing feedback. Remove duplicates, normalize severity to `[critical]`, `[major]`, `[minor]`, or `[nit]`, and keep unproven concerns as verification gaps.
6. **Refresh before delivery**: Recheck the captured PR revisions and review state. If either revision changed, refresh the snapshot and repeat affected work instead of mixing states.

## Output contract

The coordinator owns one final review artifact or requested chat response using the `review-pr` delivery format. Do not include a panel transcript, vote count, model attribution, or separate specialist reports. Attribute a domain only when it helps explain the evidence.

A retained finding must include an exact location when available, concrete impact, source-backed evidence, and a focused alternative or question. Specialist disagreement, absent measurements, unknown consumers, missing policy, and unobserved runtime behavior remain verification gaps unless the coordinator independently establishes the claim.

## Completion criteria

- All specialists reviewed one pinned boundary and only material lanes.
- The final response is a single, deduplicated, evidence-backed review.
- The result remains useful on hosts without subagent support.
- Source and remote state remain unchanged.
