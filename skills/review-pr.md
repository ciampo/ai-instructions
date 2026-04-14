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

1. **Identify the repository and diff base**:
   - Extract `owner/repo` from `git remote get-url origin` — do not guess the repository path.
   - Determine the actual base branch with `PAGER=cat gh pr view <N> --json baseRefName` — PRs can be stacked, do NOT assume they all target `trunk` or `main`.
   - Diff against the correct base: `git diff <base_branch>...HEAD`. Only review files in the PR (`gh pr diff <N> --name-only`). Do not comment on changes from parent PRs or other branches.
2. Fetch the PR metadata, diff, comments, existing reviews, and CI status via `gh`.
3. Read all modified source files in full (not just the diff hunks) and identify their consumers/call sites.
4. Read existing GitHub comments and reviews on the PR. **Skip issues that have already been raised or resolved** — do not duplicate findings.
5. Perform structured analysis against the review checklist from `instructions/code-review.md`, with accessibility as the first priority.
6. Cross-reference changes against how sibling modules/components handle the same patterns.
7. Write the full review to a markdown document in the OS temporary directory, following the `draft-review-comment` skill (see **Output Format** below). The file is named `<pr-number>-review.md` and opened in the editor — nothing is printed inline in the chat beyond a one-line confirmation.
8. Do NOT post anything to GitHub. No signature lines or AI-attribution footers (e.g., "Co-Authored-By: Claude").
9. Support multi-round reviews: when I say "do another round" or "the PR was updated", re-fetch and re-analyze, focusing on what changed since the last round. Update the same review document.

## Output Format

The review document should contain a summary followed by individual comment sections.

### Review Summary

```markdown
## PR Review: #NNNNN -- Title

### Summary
(2-3 sentences on what the PR does and overall assessment)

### Findings Overview
1. **[severity]** One-line description (`file:start-end`)
2. ...
```

### Individual Comments

After the summary, one section per finding. Each section must:

- State the **exact file path and line range** it applies to (e.g., **`src/components/Button.tsx:42-45`**) so I know where to leave the comment on GitHub.
- Be self-contained and copy-pasteable into a GitHub review thread.
- Follow the formatting rules from the `draft-review-comment` skill: concise, collaborative tone, `<details>` for extended content, concrete alternatives or clarifying questions.
