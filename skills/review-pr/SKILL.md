---
name: review-pr
description: Perform a read-only, multi-round GitHub pull-request review with accessibility first, a mandatory deletion-first simplicity pass, consumer analysis, and copy-pasteable findings. Use when asked to review someone else's PR unless the user explicitly owns its fix-and-push loop and requests iterative Copilot and self-review; use iterate-pr-review for that case. Unless the user explicitly names review-coordinator, panel, coordinated, and multi-lane PR reviews enter only through this skill. For those requests, do not inspect PR context until review-pr, review-simplicity, and review-coordinator are read in that order. For a generic PR request, read only review-pr and review-simplicity before context; load review-coordinator later only if source inspection proves the threshold.
---

# Review PR

A repeatable workflow for reviewing a GitHub PR. Invoked when I say "review this PR" or share a PR URL.

## Ownership boundary

- Before starting the read-only review, check whether the pull request is authored by the user or the user explicitly owns another author's fix-and-push loop. If either ownership condition and an iterative Copilot and self-review request are explicit, hand off to `iterate-pr-review`. Otherwise, continue here and do not infer ownership from iterative wording.

## Entry routing

- If the user explicitly names `review-coordinator`, hand off to it directly and stop. The remaining entry rules apply to ordinary panel, coordinated, and multi-lane requests.
- Before looking up PR context, identify the specialist lanes named in the request. Select the coordinator for an explicit panel or coordinated review, or when two or more independent additional lanes are material. `review-security` covers authorization or security. `review-compatibility` covers persisted-state migration or compatibility, so their combination meets the two-lane threshold.
- When the request is generic and identifies neither coordination nor two material lanes, do not load `review-coordinator` at entry. Inspect the pinned source after loading `review-simplicity`, then apply the late threshold in step 7.
- Load `review-simplicity` for every PR in a separate action before any action names or accesses PR context; do not batch this load with context lookup. When the coordinator is selected, load `review-coordinator` immediately after `review-simplicity`, before PR lookup, a request for missing context, any direct specialist, or a final response. Loading requires reading the skill; stating an intention to use it is not a handoff.
- Loading the methods at entry does not pass incomplete review results. Complete the core and simplicity passes below, then give the coordinator their results and the pinned snapshot. If the request does not reveal the coordinator threshold, source inspection can still select it in step 7. Keep an ordinary single-lane review in this workflow.

## Steps

1. Read [the code-review reference](references/code-review.md) and the [PR snapshot procedure](references/pr-snapshot.md). Identify the repository and diff base from fresh PR metadata; PRs can be stacked, so do not assume `trunk` or `main`.
2. Follow the snapshot procedure. Review only the pinned PR diff and its changed source; do not substitute the current local branch or a later remote state.
3. Read all modified source files in full (not just the diff hunks) and identify their consumers/call sites.
4. Read existing GitHub comments and reviews on the PR. **Skip issues that have already been raised or resolved** — do not duplicate findings.
5. Perform the complete core review: accessibility, consistency, simplicity, API correctness, test adequacy, blast radius, build/dependency correctness, documentation, and scope. Cross-reference sibling modules and verify external claims against primary sources.
6. Request the loaded `review-simplicity` skill's internal findings handoff. Apply its deletion-first method even when the user did not request simplification; an explicit no-findings result is valid.
7. Use `review-coordinator` only when the user explicitly requests a panel or coordinated review, or when two or more independent additional specialist lanes are materially in scope. The mandatory simplicity pass does not count toward that threshold. If source inspection establishes the threshold after entry routing, load `review-coordinator` after the simplicity handoff and before any direct specialist. Pass the coordinator the pinned snapshot, completed core-review result, and simplicity handoff from steps 1-6, then stop this workflow: the coordinator owns remaining specialist routing, rechecking, refresh, and the single final delivery.
8. If `review-coordinator` was not selected, load another specialist skill directly only when its domain is materially in scope:
   - Use `review-accessibility` for UI or interaction changes whose semantics, keyboard behavior, focus, announcements, contrast, motion, zoom, or target behavior require the deeper accessibility method. Continue to perform the core accessibility pass for every PR.
   - Use `review-api-design` when the PR adds or materially changes a public component, library, or package API. Ordinary internal type or implementation correctness stays in the core pass.
   - Use `review-compatibility` for supported-version behavior, upgrades, migrations, persisted state, wire formats, or integration compatibility. Keep public API shape in `review-api-design`.
   - Use `review-performance` when the change plausibly affects bundle loading, a user-critical runtime path, rendering or layout work, or behavior at meaningful scale. Do not invoke it for generic optimization ideas or harmless local computation.
   - Use `review-security` for untrusted input, authentication, authorization, secrets, sensitive data, injection, or security-sensitive dependency changes.
   - Use `audit-dependency-update` for every dependency addition, removal, or version change. Include its version, release, compatibility, audit, and build evidence in the synthesized review.
   - Use `review-test-quality` when behavioral evidence, UI semantics, regression coverage, mocks, or verification quality are material to the change.
   - Use `review-internationalization` for user-facing translations, locale formatting, pluralization, or directional UI.
   - Use `review-documentation` when public or developer documentation, examples, migration guidance, or meaningful code comments change.
9. For the mandatory simplicity pass and any directly invoked specialist, request an internal findings handoff instead of its standalone delivery. The specialist must return structured findings and verification gaps to this workflow without creating a separate review artifact or returning a user-facing path. When `review-coordinator` was selected, pass it the simplicity handoff; it owns remaining specialist routing and synthesis.
10. When the coordinator was not selected, synthesize specialist results into the main review. Recheck each finding against the actual PR diff and consumers, apply the severity normalization contract in the code-review reference, remove duplicates, and keep verification gaps separate from confirmed findings. The main review owns prioritization and final delivery.
11. When the coordinator was not selected, refresh the remote review state used, then re-read field-limited PR metadata before concluding. If either captured SHA changed, refresh the snapshot and repeat the review rather than mixing state from different PR boundaries; otherwise account for new or resolved feedback.
12. When the coordinator was not selected, use the `draft-review-comment` skill for delivery. `chat only` and `no artifact` select chat delivery; `do not write files` and `do not modify files` prohibit every local file write and also require chat delivery. This review remains read-only in every delivery mode. Otherwise, write the full review to `<pr-number>-review.md` in the OS temporary directory, then open it when supported or return the path.
13. Do NOT post anything to GitHub. No signature lines or AI-attribution footers (e.g., "Co-Authored-By: Claude").
14. Support multi-round reviews: when I say "do another round" or "the PR was updated", re-fetch and re-analyze, focusing on what changed since the last round. Preserve the chosen delivery mode: update the same review document for file delivery, or return the updated requested comments for chat delivery.

## Output Format

The review document should contain a summary followed by individual comment sections.

### Review Summary

```markdown
## PR Review: #NNNNN -- Title

### Summary
(2-3 sentences on what the PR does and overall assessment)

### Findings Overview
1. **[severity]** One-line description (`file:start-end` when applicable)
2. ...
```

### Individual Comments

After the summary, one section per finding. Each section must:

- State the **exact file path and line range** for an inline finding (e.g., **`src/components/Button.tsx:42-45`**). Use a file path without an invented line for a file-level finding, and no fabricated location for a general finding.
- Be self-contained and copy-pasteable into a GitHub review thread.
- Follow the formatting rules from the `draft-review-comment` skill: concise, collaborative tone, `<details>` for extended content, concrete alternatives or clarifying questions.
