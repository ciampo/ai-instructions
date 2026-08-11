---
name: review-pr
description: Review another person's GitHub PR read-only with accessibility, deletion-first simplicity, consumer analysis, and copy-pasteable findings. Use iterate-pr-review only when the user explicitly owns the fix-and-push loop and requests iterative Copilot and self-review. General, panel, coordinated, and multi-lane PR requests start here unless they explicitly name review-coordinator. Before PR context, load review-simplicity; for explicit coordination, load review-coordinator next. For generic reviews, load the coordinator later only if source inspection finds two material specialist lanes.
---

# Review PR

Review a GitHub pull request without changing it.

## Ownership boundary

- Before the review, check whether the user authored the pull request or explicitly owns another author's fix-and-push loop. If that ownership and an iterative Copilot and self-review request are both explicit, hand off to `iterate-pr-review`. Otherwise, continue here. Iterative wording alone does not establish ownership.

## Entry routing

- If the user explicitly names `review-coordinator`, hand off to it and stop. Otherwise, panel, coordinated, and multi-lane requests start here.
- Before accessing PR context, identify the requested specialist lanes. Select the coordinator for an explicit panel or coordinated review, or for two or more material independent lanes. For example, authorization maps to `review-security`, while persisted-state migration maps to `review-compatibility`; together they meet the threshold.
- Load `review-simplicity` for every PR in a separate action before any action names or accesses PR context. Do not combine this load with context lookup. If the coordinator is selected, load `review-coordinator` next, before PR lookup, a request for missing context, any direct specialist, or a final response. Loading means reading the skill, not announcing an intention.
- For a generic request that does not reveal the threshold, load only `review-simplicity` at entry. Inspect the pinned source, then apply the late threshold in step 7.
- Loading a method does not pass review results. Complete the core and simplicity passes before handing their results and the pinned snapshot to the coordinator. Keep an ordinary single-lane review here.

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
9. For the simplicity pass and each directly invoked specialist, request an internal handoff with structured findings and verification gaps. Do not let a specialist create a separate review artifact or return a user-facing path.
10. Synthesize those handoffs into the main review. Recheck each finding against the diff and consumers, normalize severity with the code-review reference, remove duplicates, and separate verification gaps from confirmed findings. The main review owns prioritization and delivery.
11. Refresh the remote review state used, then re-read field-limited PR metadata. If either captured SHA changed, refresh the snapshot and repeat the review. Otherwise, account for new or resolved feedback.
12. Load `draft-review-comment` for delivery. `chat only` and `no artifact` require chat delivery. `do not write files` and `do not modify files` prohibit all local writes and also require chat delivery. The review stays read-only in every mode. Otherwise, write the full review to `<pr-number>-review.md` in the OS temporary directory, then open it when supported or return the path.
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
