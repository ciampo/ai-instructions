---
name: address-pr-feedback
description: Inspect unresolved pull-request feedback, evaluate each suggestion, implement accepted fixes, verify them, and prepare concise replies. Use when addressing PR review comments.
---

# Address PR Feedback

A workflow for systematically addressing review comments on a PR. Invoked when I say "address the feedback" or "work through the review comments."

## Steps

1. **Identify the repository**: Derive the base repository from the PR instead of assuming the local `origin` is upstream.
2. **Gather feedback**: Use the host's GitHub integration when available, otherwise use authenticated `gh`. Fetch review threads, PR conversation, and CI status, including thread resolution state when the API exposes it.
3. **Categorize each comment**: Classify as must-fix (blocking), should-address (non-blocking but valid), or won't-fix (disagree — needs discussion). Evaluate whether each suggestion is correct before acting and account for issues resolved in previous rounds.
4. **Keep changes granular**: Group edits by review comment or tightly related concern. If the user asked for commits, keep those commits focused and omit AI-attribution footers (e.g., "Co-Authored-By: Claude").
5. **Verify**: Run the project's verification suite before pushing.
6. **Verify fixes against actual code**: When checking whether previously raised issues have been addressed, pull the latest branch, read the review comments, then check the actual code to confirm the fix is correct — do not just trust that a commit exists. Report which issues are properly fixed and which still need work.
7. **Prepare reply document**:
   - For each addressed comment, draft a short, plain-language reply that starts with the outcome or reason before any code-level detail.
   - When practical, include brief steps the reviewer can use to reproduce or verify the result.
   - For won't-fix items, explain the high-level trade-off respectfully.
   - Use the `draft-review-comment` skill for structure and quality. Each reply section must reference the exact file path and line range of the original comment, be self-contained, and be copy-pasteable.
   - Override the default filename: write all replies to `<pr-number>-replies.md` in the OS temporary directory. Open it when the host supports editor control; otherwise return the path.
   - Never post replies to GitHub unless the user explicitly asks.
8. **Prepare metadata changes**: If the scope or approach shifted based on feedback, draft the necessary PR-description update. Apply it only when the user authorized GitHub writes.
