# Skill: Review PR

A repeatable workflow for reviewing a GitHub PR. Invoked when I say "review this PR" or share a PR URL.

## Steps

1. Fetch the PR metadata, diff, comments, and CI status via `gh`.
2. Read all modified source files in full (not just the diff hunks) and identify their consumers/call sites.
3. Perform structured analysis against the review checklist from `instructions/code-review.md`, with accessibility as the first priority.
4. Cross-reference changes against how sibling modules/components handle the same patterns.
5. Output findings as portable markdown with the structure below.
6. Do NOT post anything to GitHub. Share findings in the conversation only.
7. Support multi-round reviews: when I say "do another round" or "the PR was updated", re-fetch and re-analyze, focusing on what changed since the last round.

## Output Format

```markdown
## PR Review: #NNNNN -- Title

### Summary
(2-3 sentences on what the PR does and overall assessment)

### Issues Found
1. **[severity]** Description (file:line)
2. ...

### Suggestions
- ...

### Questions for the Author
- ...
```
