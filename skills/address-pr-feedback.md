# Skill: Address PR Feedback

A workflow for systematically addressing review comments on a PR. Invoked when I say "address the feedback" or "work through the review comments."

## Dependencies

Load these instruction files before executing this skill:

- `instructions/interaction-preferences.md`
- `instructions/code-review.md`
- `instructions/writing-conventions.md`

Chain into this skill when drafting reply snippets:

- `skills/draft-review-comment.md`

## Steps

1. **Gather feedback**: Fetch all review comments, PR conversation, and current CI status via `gh`. Identify which comments are resolved vs. outstanding.
2. **Categorize each comment**: Classify as must-fix (blocking), should-address (non-blocking but valid), or won't-fix (disagree -- needs discussion). For each, evaluate whether the suggestion is actually correct before acting on it (per `interaction-preferences.md`: never follow feedback blindly).
3. **Make granular commits**: One commit per review comment or tightly related group. Keep code changes, test changes, and config changes in separate commits when practical.
4. **Verify**: Run the project's verification suite before pushing.
5. **Prepare reply snippets**: For each addressed comment, draft a short reply explaining what was done. For won't-fix items, draft a respectful explanation of why. Format each reply following the `draft-review-comment` skill: separate, self-contained, copy-pasteable markdown snippets (per `interaction-preferences.md`: never post to GitHub directly).
6. **Update PR metadata**: If the scope or approach shifted based on feedback, update the PR description accordingly.
