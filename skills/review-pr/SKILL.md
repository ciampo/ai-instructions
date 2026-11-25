---
name: review-pr
description: Review another person's GitHub PR read-only with accessibility, deletion-first simplicity, consumer analysis, and copy-pasteable findings. Use iterate-pr-review for iteration on user-authored PRs or explicitly owned fix-and-push loops. General, panel, coordinated, and multi-lane PR reviews start here.
---

# Review PR

Review a GitHub pull request without changing it.

## Ownership boundary

- Check the user request and retained context before PR lookup. For an authored or explicitly owned PR with an iterative review-and-fix request, hand off immediately to `iterate-pr-review` and preserve narrower limits. Do not run the review steps first. Otherwise continue read-only. Iterative wording does not establish ownership.

## Steps

1. Read the `review-simplicity` skill before you read the PR. Every review applies its deletion-first baseline, including a review that does not ask for simplification.
2. Read [the code-review reference](references/code-review.md) and the [PR snapshot procedure](references/pr-snapshot.md). Identify the repository and diff base from fresh PR metadata; PRs can be stacked, so do not assume `trunk` or `main`.
3. Follow the snapshot procedure. Review only the pinned PR diff and its changed source; do not substitute the current local branch or a later remote state. Record changed-file and added/deleted-line counts from that diff when available. Distinguish substantive source and test changes from generated, lockfile, formatting, and mechanical churn without excluding any of them from review. Do not infer low risk from a small diff.
4. Read all modified source files in full (not just the diff hunks) and identify their consumers/call sites.
5. Check previous feedback using the snapshot procedure. Read review bodies, inline threads and replies, and PR conversation comments, including resolved or outdated threads. Check each actionable concern against the pinned code. Keep GitHub thread state separate from whether the concern is addressed. Carry outstanding feedback into the report and link to its existing discussion instead of drafting a duplicate finding.
6. Perform the complete core review: accessibility, consistency, simplicity, API correctness, test adequacy, blast radius, build/dependency correctness, documentation, and scope. Cross-reference sibling modules and verify external claims against primary sources.
7. Request the loaded `review-simplicity` skill's internal findings handoff. An explicit no-findings result is valid.
8. Load another specialist skill only when its domain is materially in scope. Do not invent a lane from the request wording alone, and do not add filler lanes to form a panel:
   - Use `review-accessibility` for UI or interaction changes whose semantics, keyboard behavior, focus, announcements, contrast, motion, zoom, or target behavior require the deeper accessibility method. Continue to perform the core accessibility pass for every PR.
   - Use `review-api-design` when the PR adds or materially changes a public component, library, or package API. Ordinary internal type or implementation correctness stays in the core pass.
   - Use `review-compatibility` for supported-version behavior, upgrades, migrations, persisted state, wire formats, or integration compatibility. Keep public API shape in `review-api-design`.
   - Use `review-performance` when the change plausibly affects bundle loading, a user-critical runtime path, rendering or layout work, or behavior at meaningful scale. Do not invoke it for generic optimization ideas or harmless local computation.
   - Use `review-security` for untrusted input, authentication, authorization, secrets, sensitive data, injection, or security-sensitive dependency changes.
   - Use `review-blast-radius` when a small or shared change has materially uncertain indirect effects across lifecycle timing, dependency semantics, generated artifacts, persisted data, wire formats, language boundaries, or downstream systems. Keep ordinary caller and consumer analysis in the core pass.
   - Use `audit-dependency-update` for every dependency addition, removal, or version change. Include its version, release, compatibility, audit, and build evidence in the synthesized review.
   - Use `review-test-quality` when behavioral evidence, UI semantics, regression coverage, mocks, or verification quality are material to the change.
   - Use `review-internationalization` for user-facing translations, locale formatting, pluralization, or directional UI.
   - Use `review-documentation` when public or developer documentation, examples, migration guidance, or meaningful code comments change.
9. Decide how to run the selected methods. Loading a skill does not require spawning an agent; apply each method in the current agent by default. Consider delegation only when the user asks for a panel, a coordinated review, or independent reviewers, or when two or more selected lanes are independent and material. The simplicity baseline does not count toward that threshold. In those cases, follow [Delegation sizing](#delegation-sizing).
10. For the simplicity pass and each specialist method or delegated investigation, request an internal handoff with structured findings, verification gaps, and an explicit no-findings result. Do not let a specialist create a separate review artifact or return a user-facing path.
11. Hold an evidence review, not a vote. Group duplicate or conflicting candidates. Recheck each one against the pinned diff, consumers, repository policy, and existing feedback. For a disputed, cross-domain, `[critical]`, or `[major]` candidate, inspect the source directly or request a narrow recheck. Agreement between reviewers never confirms a finding. Normalize severity with the code-review reference instead of preserving a specialist label, remove duplicates, and keep unproven concerns as verification gaps. This workflow owns prioritization and the single delivery.
12. Refresh the remote review state used, then re-read field-limited PR metadata. If either captured SHA changed, refresh the snapshot and repeat the review. Otherwise, account for new or resolved feedback.
13. Load `draft-review-comment` for delivery. `chat only` and `no artifact` require chat delivery. `do not write files` and `do not modify files` prohibit all local writes and also require chat delivery. The review stays read-only in every mode. Otherwise, write the full review to `<pr-number>-review.md` in the OS temporary directory, then open it when supported or return the path.
14. Do NOT post anything to GitHub. No signature lines or AI-attribution footers (e.g., "Co-Authored-By: Claude").
15. Support multi-round reviews: when I say "do another round" or "the PR was updated", re-fetch and re-analyze, focusing on what changed since the last round. Preserve the chosen delivery mode: update the same review document for file delivery, or return the updated requested comments for chat delivery.

When the request supplies a pinned snapshot, a completed core-review result, or a completed simplicity handoff, use it and do not repeat that work.

## Delegation sizing

- Start from the pinned diff's changed-file and line counts, the substantive source and test scope, the affected contracts and consumers, and the verification work that remains. If the counts are unavailable, say so; do not invent them. Generated, lockfile, formatting, and mechanical churn can inflate size but still need their relevant checks, including every dependency audit.
- Keep a small, cohesive review in the current agent, even when several specialist methods apply. A large mechanical diff does not justify more agents. Line counts are workload clues, not risk scores; a one-line authorization, migration, or shared-API change may need deep investigation.
- Before each spawn, name a material unanswered question and say why a separate investigation adds evidence beyond the completed core and simplicity passes. Delegate substantial work that can proceed independently, or a focused independent check of a high-consequence assumption. Check brief questions locally and reuse completed evidence.
- Combine methods that inspect the same code and contract into one investigation. Test, documentation, and localization changes that accompany one behavior do not each need an agent. Do not repeat the core review in a specialist.
- Choose the smallest useful allocation. Zero subagents is valid. Start with one or two bounded investigations when delegation helps, and add more only for further substantial, independent questions. Honor explicitly requested independent reviewers, subject to host limits, without inventing unrelated lanes. Without subagent support, run the selected checks locally and mention the limit only when it affects the requested outcome.
- Give each delegated investigation its question, bounded scope, applicable skills, required evidence, and the same pinned snapshot. Ask it to return the repository, base revision, head revision, target audience, and scope checked unchanged. Do not share another lane's conclusions before its first pass. Specialists return new investigation needs instead of spawning their own agents.
- Do not add a delegation report to the final review unless the user requests it.

## Output format

Use the full-review format in `draft-review-comment`: **Overall**, **Previous feedback**, and **Actions and suggested comments**. Give the reader a short assessment, then clearly separate existing discussion from new findings and text ready to paste. A result with no new findings must still flag earlier feedback that needs a change, reply, or verification. Preserve a request for comments only instead of forcing a full report.

State the repository, pinned base and head revisions, and target audience once in one compact line. Keep them, severity, and exact locations outside suggested comments. Include evidence needed to support an action or explain uncertainty, but move optional technical detail out of the main reading path. Do not repeat the same concern as both an old thread and a new finding. Do not include a panel transcript, vote count, model attribution, process recap, or separate specialist reports.
