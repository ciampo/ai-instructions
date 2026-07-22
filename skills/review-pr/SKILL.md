---
name: review-pr
description: Perform a read-only, multi-round GitHub pull-request review with accessibility first, consumer analysis, and copy-pasteable findings. Use when asked to review someone else's PR.
---

# Review PR

A repeatable workflow for reviewing a GitHub PR. Invoked when I say "review this PR" or share a PR URL.

## Steps

1. Read [the code-review reference](references/code-review.md), then identify the repository and diff base. Resolve the PR's base repository and actual base branch from PR metadata. PRs can be stacked, so do not assume `trunk` or `main`. Refresh the base and limit review to the PR's own diff.
2. Fetch PR metadata, diff, comments, existing reviews, thread resolution state, and CI status using the host's GitHub integration or authenticated `gh` fallback.
3. Read all modified source files in full (not just the diff hunks) and identify their consumers/call sites.
4. Read existing GitHub comments and reviews on the PR. **Skip issues that have already been raised or resolved** — do not duplicate findings.
5. Review accessibility first, then consistency, API correctness, test adequacy, blast radius, build/dependency correctness, documentation, and scope. Verify APG, ARIA, and WCAG claims against their primary sources.
6. Cross-reference changes against how sibling modules/components handle the same patterns.
7. Use the `draft-review-comment` skill for delivery. By default, write the full review to `<pr-number>-review.md` in the OS temporary directory, then open it when supported or return the path. When the user explicitly requests chat delivery, return the requested comments in chat and skip file creation unless they also request file delivery.
8. Do NOT post anything to GitHub. No signature lines or AI-attribution footers (e.g., "Co-Authored-By: Claude").
9. Support multi-round reviews: when I say "do another round" or "the PR was updated", re-fetch and re-analyze, focusing on what changed since the last round. Preserve the chosen delivery mode: update the same review document for file delivery, or return the updated requested comments for chat delivery.

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
