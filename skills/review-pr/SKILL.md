---
name: review-pr
description: Perform a read-only, multi-round GitHub pull-request review with accessibility first, consumer analysis, and copy-pasteable findings. Use when asked to review someone else's PR.
---

# Review PR

A repeatable workflow for reviewing a GitHub PR. Invoked when I say "review this PR" or share a PR URL.

## Steps

1. Read [the code-review reference](references/code-review.md) and the [PR snapshot procedure](references/pr-snapshot.md). Identify the repository and diff base from fresh PR metadata; PRs can be stacked, so do not assume `trunk` or `main`.
2. Follow the snapshot procedure. Review only the pinned PR diff and its changed source; do not substitute the current local branch or a later remote state.
3. Read all modified source files in full (not just the diff hunks) and identify their consumers/call sites.
4. Read existing GitHub comments and reviews on the PR. **Skip issues that have already been raised or resolved** — do not duplicate findings.
5. Perform the complete core review: accessibility, consistency, API correctness, test adequacy, blast radius, build/dependency correctness, documentation, and scope. Cross-reference sibling modules and verify external claims against primary sources.
6. Use `review-coordinator` only when the user explicitly requests a panel or coordinated review, or when two or more independent specialist lanes are materially in scope. Keep this workflow as the default for ordinary PRs. Pass it the pinned snapshot and completed core-review result from steps 1-5, then stop this workflow: the coordinator owns specialist routing, rechecking, refresh, and the single final delivery.
7. If `review-coordinator` was not selected, load a specialist skill directly only when its domain is materially in scope:
   - Use `review-accessibility` for UI or interaction changes whose semantics, keyboard behavior, focus, announcements, contrast, motion, zoom, or target behavior require the deeper accessibility method. Continue to perform the core accessibility pass for every PR.
   - Use `review-api-design` when the PR adds or materially changes a public component, library, or package API. Ordinary internal type or implementation correctness stays in the core pass.
   - Use `review-compatibility` for supported-version behavior, upgrades, migrations, persisted state, wire formats, or integration compatibility. Keep public API shape in `review-api-design`.
   - Use `review-performance` when the change plausibly affects bundle loading, a user-critical runtime path, rendering or layout work, or behavior at meaningful scale. Do not invoke it for generic optimization ideas or harmless local computation.
   - Use `review-security` for untrusted input, authentication, authorization, secrets, sensitive data, injection, or security-sensitive dependency changes. Use `audit-dependency-update` for a dependency-specific audit.
   - Use `review-test-quality` when behavioral evidence, UI semantics, regression coverage, mocks, or verification quality are material to the change.
   - Use `review-internationalization` for user-facing translations, locale formatting, pluralization, or directional UI.
   - Use `review-documentation` when public or developer documentation, examples, migration guidance, or meaningful code comments change.
8. When invoking a specialist directly, request an internal findings handoff instead of its standalone delivery. The specialist must return structured findings and verification gaps to this workflow without creating a separate review artifact or returning a user-facing path. When `review-coordinator` was selected, it owns specialist routing and synthesis.
9. When the coordinator was not selected, synthesize specialist results into the main review. Recheck each finding against the actual PR diff and consumers, normalize severity to the shared `[critical]`, `[major]`, `[minor]`, and `[nit]` scale, remove duplicates, and keep verification gaps separate from confirmed findings. The main review owns prioritization and final delivery.
10. When the coordinator was not selected, refresh the remote review state used, then re-read field-limited PR metadata before concluding. If either captured SHA changed, refresh the snapshot and repeat the review rather than mixing state from different PR boundaries; otherwise account for new or resolved feedback.
11. When the coordinator was not selected, use the `draft-review-comment` skill for delivery. By default, write the full review to `<pr-number>-review.md` in the OS temporary directory, then open it when supported or return the path. When the user explicitly requests chat delivery, return the requested comments in chat and skip file creation unless they also request file delivery.
12. Do NOT post anything to GitHub. No signature lines or AI-attribution footers (e.g., "Co-Authored-By: Claude").
13. Support multi-round reviews: when I say "do another round" or "the PR was updated", re-fetch and re-analyze, focusing on what changed since the last round. Preserve the chosen delivery mode: update the same review document for file delivery, or return the updated requested comments for chat delivery.

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
