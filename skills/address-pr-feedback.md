# Skill: Address PR Feedback

A workflow for systematically addressing review comments on a PR. Invoked when I say "address the feedback" or "work through the review comments."

## Dependencies

Load these instruction files before executing this skill:

- `instructions/interaction-preferences.md`
- `instructions/code-review.md`
- `instructions/writing-conventions.md`
- `instructions/tools-and-cli.md`

Chain into this skill when drafting reply snippets:

- `skills/draft-review-comment.md`

## Steps

1. **Identify the repository**: per `tools-and-cli.md` (GitHub API Patterns).
2. **Gather feedback**: Fetch all review comments, PR conversation, and current CI status via `gh`. Identify which comments are resolved vs. outstanding. Follow `tools-and-cli.md` for the two-step review comment fetching approach and the zsh `--jq` pitfall.
3. **Categorize each comment**: Classify as must-fix (blocking), should-address (non-blocking but valid), or won't-fix (disagree — needs discussion). For each, evaluate whether the suggestion is actually correct before acting on it (per `interaction-preferences.md`: never follow feedback blindly). Take into account issues that were already resolved in previous rounds.
4. **Make granular commits**: One commit per review comment or tightly related group. Keep code changes, test changes, and config changes in separate commits when practical. No AI-attribution footers (e.g., "Co-Authored-By: Claude") in commit messages.
5. **Verify**: Run the project's verification suite before pushing.
6. **Verify fixes against actual code**: When checking whether previously raised issues have been addressed, pull the latest branch, read the review comments, then check the actual code to confirm the fix is correct — do not just trust that a commit exists. Report which issues are properly fixed and which still need work.
7. **Prepare reply document**: For each addressed comment, draft a short reply explaining what was done. For won't-fix items, draft a respectful explanation of why. Follow the `draft-review-comment` skill for structure and quality — each reply section must reference the exact file path and line range of the original comment, be self-contained, and be copy-pasteable — but override the default filename. Write all replies to `<pr-number>-replies.md` in the OS temporary directory and open the file in the editor (per `interaction-preferences.md`: never post to GitHub directly).
8. **Update PR metadata**: If the scope or approach shifted based on feedback, update the PR description accordingly.
