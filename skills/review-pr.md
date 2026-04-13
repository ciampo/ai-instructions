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
5. Output a brief summary (the **Review Summary** below) so I can see the big picture at a glance.
6. Format each actionable finding (issue, suggestion, question) as a **separate, copy-pasteable GitHub comment snippet** following the `draft-review-comment` skill. Each snippet must be self-contained, reference the relevant code, and be ready to paste into a GitHub review thread.
7. Do NOT post anything to GitHub. Share findings in the conversation only.
8. Support multi-round reviews: when I say "do another round" or "the PR was updated", re-fetch and re-analyze, focusing on what changed since the last round.

## Output Format

Start with the summary, then list individual comment snippets.

### Review Summary

```markdown
## PR Review: #NNNNN -- Title

### Summary
(2-3 sentences on what the PR does and overall assessment)

### Findings Overview
1. **[severity]** One-line description (file:line)
2. ...
```

### Individual Comment Snippets

After the summary, output each finding as its own markdown snippet I can copy-paste into a GitHub review comment. Follow the formatting rules from the `draft-review-comment` skill: concise, collaborative tone, `<details>` for extended content, concrete alternatives or clarifying questions.
