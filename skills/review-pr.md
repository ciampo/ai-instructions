# Skill: Review PR

A repeatable workflow for reviewing a GitHub PR. Invoked when I say "review this PR" or share a PR URL.

## Dependencies

Load these instruction files before executing this skill:

- `instructions/code-review.md`
- `instructions/accessibility.md`
- `instructions/interaction-preferences.md`

Chain into this skill for final output formatting:

- `skills/draft-review-comment.md`

## Steps

1. Fetch the PR metadata, diff, comments, and CI status via `gh`.
2. Read all modified source files in full (not just the diff hunks) and identify their consumers/call sites.
3. Perform structured analysis against the review checklist from `instructions/code-review.md`, with accessibility as the first priority.
4. Cross-reference changes against how sibling modules/components handle the same patterns.
5. Write the full review to a markdown document following the `draft-review-comment` skill (see **Output Format** below). The file is written to `.ai-reviews/<pr-number>-review.md` and opened in the editor — nothing is printed inline in the chat beyond a one-line confirmation.
6. Do NOT post anything to GitHub.
7. Support multi-round reviews: when I say "do another round" or "the PR was updated", re-fetch and re-analyze, focusing on what changed since the last round. Update the same review document.

## Output Format

The review document should contain a summary followed by individual comment sections.

### Review Summary

```markdown
## PR Review: #NNNNN -- Title

### Summary
(2-3 sentences on what the PR does and overall assessment)

### Findings Overview
1. **[severity]** One-line description (`file:line`)
2. ...
```

### Individual Comments

After the summary, one section per finding. Each section must:

- State the **exact file path and line range** it applies to (e.g., `**`src/components/Button.tsx:42-45`**`) so I know where to leave the comment on GitHub.
- Be self-contained and copy-pasteable into a GitHub review thread.
- Follow the formatting rules from the `draft-review-comment` skill: concise, collaborative tone, `<details>` for extended content, concrete alternatives or clarifying questions.
