---
name: review-coordinator
description: Coordinate the second stage of a loaded review-pr workflow. Receive its pinned snapshot, completed core result, and review-simplicity handoff; select material specialist investigations; and return one rechecked response. Match directly only when the user names review-coordinator. Otherwise, review-pr loads it after review-simplicity when coordination is required. Never edit source, commit, or write remotely.
---

# Review Coordinator

Coordinate independent specialist investigations without replacing the core `review-pr` workflow or producing competing review reports.

## Authority and scope

- Keep the review read-only. For direct remote-PR use, follow the bundled [snapshot procedure](references/pr-snapshot.md) and [core-review and delivery reference](references/code-review.md) before assigning work.
- Use this workflow when a user explicitly requests a panel or when at least two additional specialist lanes are materially independent. The mandatory simplicity baseline does not count toward that threshold. An explicit request with fewer than two material additional lanes may use only the applicable lanes; do not invent filler work to form a panel.
- Use host subagents in parallel when available. Otherwise run the same bounded handoffs sequentially and disclose that fallback only when it affects the requested outcome.
- Do not modify source, tests, generated files, pull-request metadata, comments, or remote state.

## Coordinate the review

1. **Capture one immutable review boundary**: Record the repository, base and head revisions, changed files, existing review state, and target audience. Every specialist receives this same snapshot.
2. **Establish the core and simplicity results**: When `review-pr` invokes the coordinator, use its completed core-review result, `review-simplicity` handoff, and pinned snapshot; do not re-enter `review-pr` or repeat either pass. When invoked directly, follow the bundled snapshot and core-review references, then assign `review-simplicity` before selecting only material additional specialist lanes:
   - `review-accessibility` for substantial UI or interaction risk.
   - `review-api-design` for public API shape and consumer ergonomics.
   - `review-compatibility` for supported versions, upgrades, persisted state, migrations, wire formats, or integrations.
   - `review-performance` for material bundle, runtime, layout, or scale risk.
   - `review-security` for trust boundaries, authority, sensitive data, injection, or secrets. Do not use it as a substitute for dependency auditing.
   - `audit-dependency-update` for every dependency change. Include its release, resolved-version, compatibility, audit, and build evidence in the coordinated result when the change is otherwise in scope.
   - `review-test-quality` when behavior, regressions, UI semantics, mocks, or verification evidence are material.
   - `review-internationalization` for localized text, formatting, pluralization, or directional UI.
   - `review-documentation` when user or developer documentation, examples, migration guidance, or meaningful comments change.
3. **Assign bounded, independent handoffs**: Ask each specialist to inspect only its lane and return the repository, base revision, head revision, target audience, and scope checked unchanged; confirmed candidate findings with exact evidence and impact; verification gaps; and an explicit no-findings result. Do not give specialists another lane's conclusions before their first pass.
4. **Hold an evidence review, not a vote**: Group duplicate or conflicting candidates. For a disputed, cross-domain, or `[critical]`/`[major]` candidate, request a narrowly scoped recheck from the relevant specialist or inspect the source directly. Agreement alone never confirms a finding.
5. **Synthesize one response**: Recheck every retained candidate against the pinned diff, consumers, repository policy, and existing feedback. Read the bundled core-review reference before final normalization if it was not already loaded. Remove duplicates, apply its severity contract instead of preserving a specialist label, and keep unproven concerns as verification gaps. Under that contract, losing persisted user state during a supported upgrade is `[major]` even when the state is recoverable.
6. **Refresh before delivery**: Recheck the captured PR revisions and review state. If either revision changed, refresh the snapshot and repeat affected work instead of mixing states.

## Output contract

The coordinator owns one final review artifact or requested chat response using the bundled delivery format. `chat only` and `no artifact` select chat delivery; `do not write files` and `do not modify files` prohibit every local file write and also require chat delivery. In either chat mode, do not create or open a local file. State the repository, pinned base and head revisions, and target audience once in that response. Do not include a panel transcript, vote count, model attribution, or separate specialist reports. Attribute a domain only when it helps explain the evidence.

A retained finding must include an exact location when available, concrete impact, source-backed evidence, and a focused alternative or question. Specialist disagreement, absent measurements, unknown consumers, missing policy, and unobserved runtime behavior remain verification gaps unless the coordinator independently establishes the claim.

## Completion criteria

- The mandatory simplicity pass and all selected material specialists reviewed one pinned boundary.
- The final response is a single, deduplicated, evidence-backed review.
- The result remains useful on hosts without subagent support.
- Source and remote state remain unchanged.
