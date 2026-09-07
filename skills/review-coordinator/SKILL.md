---
name: review-coordinator
description: Coordinate the second stage of a loaded review-pr workflow. Receive its pinned snapshot, completed core result, and review-simplicity handoff; select material specialist investigations; and return one rechecked response. Match directly only when the user names review-coordinator. Otherwise, review-pr loads it after review-simplicity when coordination is required. Never edit source, commit, or write remotely.
---

# Review Coordinator

Coordinate independent specialist investigations without replacing the core `review-pr` workflow or producing competing review reports.

## Authority and scope

- Keep the review read-only. For direct remote-PR use, follow the bundled [snapshot procedure](references/pr-snapshot.md) and [core-review and delivery reference](references/code-review.md) before assigning work.
- Use this workflow when a user explicitly requests a panel or when at least two additional specialist lanes are materially independent. The mandatory simplicity baseline does not count toward that threshold. An explicit request with fewer than two material additional lanes may use only the applicable lanes; do not invent filler work to form a panel.
- Select review methods separately from agent count. Apply them in the current agent by default; use host subagents only when the sizing decision below justifies delegation. Without subagents, perform the selected checks locally and disclose the limitation only when it affects the requested outcome.
- Do not modify source, tests, generated files, pull-request metadata, comments, or remote state.

## Coordinate the review

1. **Capture one immutable review boundary**: Record the repository, base and head revisions, changed files, previous-feedback assessment and coverage, and target audience. Every specialist receives this same snapshot.
2. **Establish the core and simplicity results**: When `review-pr` invokes the coordinator, use its completed core-review result, `review-simplicity` handoff, and pinned snapshot; do not re-enter `review-pr` or repeat either pass. When invoked directly, follow the bundled snapshot and core-review references, then apply `review-simplicity` locally before selecting only material additional specialist lanes:
   - `review-accessibility` for substantial UI or interaction risk.
   - `review-api-design` for public API shape and consumer ergonomics.
   - `review-compatibility` for supported versions, upgrades, persisted state, migrations, wire formats, or integrations.
   - `review-performance` for material bundle, runtime, layout, or scale risk.
   - `review-security` for trust boundaries, authority, sensitive data, injection, or secrets. Do not use it as a substitute for dependency auditing.
   - `review-blast-radius` for materially uncertain indirect effects across lifecycle timing, dependency semantics, generated artifacts, persisted data, wire formats, language boundaries, or downstream systems. Ordinary caller analysis stays in the core review.
   - `audit-dependency-update` for every dependency change. Include its release, resolved-version, compatibility, audit, and build evidence in the coordinated result when the change is otherwise in scope.
   - `review-test-quality` when behavior, regressions, UI semantics, mocks, or verification evidence are material.
   - `review-internationalization` for localized text, formatting, pluralization, or directional UI.
   - `review-documentation` when user or developer documentation, examples, migration guidance, or meaningful comments change.
3. **Size and assign the remaining work**: Apply the delegation sizing rules below before spawning agents. For each delegated investigation, specify its question, bounded scope, applicable skills, and required evidence. Ask the specialist to return the repository, base revision, head revision, target audience, and scope checked unchanged; confirmed candidate findings with exact evidence and impact; verification gaps; and an explicit no-findings result. Do not give specialists another lane's conclusions before their first pass. Keep agent allocation with the coordinator; specialists must return new investigation needs instead of spawning their own agents.
4. **Hold an evidence review, not a vote**: Group duplicate or conflicting candidates. For a disputed, cross-domain, or `[critical]`/`[major]` candidate, request a narrowly scoped recheck from the relevant specialist or inspect the source directly. Agreement alone never confirms a finding.
5. **Synthesize one response**: Recheck every retained candidate against the pinned diff, consumers, repository policy, and existing feedback. Retain earlier concerns that still need a change, reply, or verification, even when they duplicate a candidate. Link the original discussion instead of proposing a duplicate new comment. Read the bundled core-review reference before final normalization if it was not already loaded. Remove duplicates, apply its severity contract instead of preserving a specialist label, and keep unproven concerns as verification gaps. Under that contract, losing persisted user state during a supported upgrade is `[major]` even when the state is recoverable.
6. **Refresh before delivery**: Recheck the captured PR revisions and review state. If either revision changed, refresh the snapshot and repeat affected work instead of mixing states.

## Delegation sizing

- Start from the pinned diff's changed-file and added/deleted-line counts, the substantive source and test scope, affected contracts and consumers, and the remaining verification work. Obtain missing counts from the pinned diff when possible; otherwise mark them unavailable. Generated, lockfile, formatting, and mechanical churn can inflate size, but still require their relevant checks, including every dependency audit.
- Keep small, cohesive reviews in the current agent, even when several specialist methods apply. A large mechanical diff does not automatically justify more agents. Line counts are workload clues, not risk scores or fixed routing thresholds; a one-line authorization, migration, or shared-API change may need deep investigation.
- Before each spawn, identify a material unanswered question and why a separate investigation adds useful evidence beyond the completed core and simplicity passes. Delegate substantial work that can proceed independently, or a focused independent check of a high-consequence assumption. Check brief questions locally and reuse completed evidence.
- Combine methods that inspect the same code and contract into one investigation. Test, documentation, and localization changes accompanying one behavior do not each need an agent. Do not repeat the core review in every specialist.
- Choose the smallest useful allocation. Zero subagents is valid. Start with one or two bounded investigations when delegation helps; use more only for additional substantial, independent questions. Reassess when new evidence reveals more work, not merely when a slot becomes free. Honor explicitly requested independent reviewers, subject to host limits, without inventing unrelated lanes.
- Keep a brief internal allocation rationale with the handoff. Preserve all required review coverage and final evidence checks regardless of agent count. Do not add a delegation report to the final review unless the user requests it.

## Output contract

Load `draft-review-comment` for final wording. The coordinator owns one final review artifact or requested chat response using its full-review format: Overall, Previous feedback, and Actions and suggested comments. Pass the previous-feedback assessment and any coverage limits to that delivery step. `chat only` and `no artifact` select chat delivery; `do not write files` and `do not modify files` prohibit every local file write and also require chat delivery. In either chat mode, do not create or open a local file. State the repository, pinned base and head revisions, and target audience once in one compact line. Do not include a panel transcript, vote count, model attribution, process recap, or separate specialist reports. Report each finding once and include only verification gaps that limit confidence or require user action. Attribute a domain only when it helps explain the evidence.

A retained finding record must include an exact location when available, concrete impact, source-backed evidence, and a focused alternative or question. Keep that metadata outside the suggested GitHub comment unless the author needs it to understand or act. Specialist disagreement, absent measurements, unknown consumers, missing policy, and unobserved runtime behavior remain verification gaps unless the coordinator independently establishes the claim.

## Completion criteria

- The mandatory simplicity pass and all selected material specialists reviewed one pinned boundary.
- The final response is a single, deduplicated, evidence-backed review.
- The result remains useful on hosts without subagent support.
- Source and remote state remain unchanged.
