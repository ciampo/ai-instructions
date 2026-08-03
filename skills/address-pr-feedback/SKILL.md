---
name: address-pr-feedback
description: Inspect current pull-request feedback, evaluate each suggestion, implement accepted local fixes, verify them, and draft replies without posting. Use when asked to address, act on, or implement PR review feedback. Do not use when the user only wants wording for a comment or reply, or asks for a general PR review. Do not infer branch integration, commit, push, PR-update, or reply-posting authority.
---

# Address PR Feedback

A workflow for systematically addressing review comments on a PR. Invoked when I say "address the feedback" or "work through the review comments."

## Authority

Reading the current remote PR state is allowed. Addressing feedback authorizes accepted local fixes, but not merging or rebasing remote changes into the local branch, committing, pushing, editing PR metadata, resolving threads, or posting replies unless the user separately requests those actions.

A `chat only` or `no artifact` request changes only reply delivery; it does not revoke local-fix authority. An explicit `do not write files` or `do not modify files` instruction revokes local-fix authority and limits the workflow to read-only assessment with replies in chat.

## Steps

1. **Identify the repository**: Derive repository identity from the canonical PR URL instead of assuming the local `origin` is upstream.
2. **Gather feedback**: Start with a CLI-first snapshot: record the repository and both SHAs, resolve them to explicit refs, and inspect the merge-base diff and changed source. Retrieve the ordinary conversation and all inline comments before categorizing. Use the connector only for merged discussion, resolved review state, or a CLI authentication/capability gap; check CI separately. If required PR or feedback state cannot be verified with the available reads, stop and report the missing capability; do not categorize feedback or change code. Immediately before categorizing or changing code, re-read both SHAs and rebuild the snapshot if either changed. Do not integrate branches merely to inspect them.
3. **Categorize each comment**: Classify as must-fix (blocking), should-address (non-blocking but valid), or won't-fix (disagree — needs discussion). Evaluate whether each suggestion is correct before acting and account for issues resolved in previous rounds.
4. **Keep changes granular**: Group edits by review comment or tightly related concern. If the user asked for commits, keep those commits focused and omit AI-attribution footers (e.g., "Co-Authored-By: Claude").
5. **Verify**: Run the project's relevant verification suite after local fixes. Push only when explicitly requested.
6. **Verify fixes against actual code**: Refresh the PR metadata and remote refs without changing the local branch. If either SHA changed, rebuild the snapshot and re-evaluate feedback before reporting. Then read the review comments and check the actual code to confirm the fix is correct -- do not just trust that a commit exists. Report which issues are properly fixed and which still need work.
7. **Prepare reply document**:
   - For each addressed comment, draft a short, plain-language reply that starts with the outcome or reason before any code-level detail.
   - When practical, include brief steps the reviewer can use to reproduce or verify the result.
   - For won't-fix items, explain the high-level trade-off respectfully.
   - Use the `draft-review-comment` skill for structure and quality. Identify the original feedback honestly: use its exact file path and line range for inline comments, its file path for file-level comments, and a PR thread link or short label for general feedback. Never invent a code location. Keep each reply self-contained and copy-pasteable.
   - Follow the `draft-review-comment` delivery rules. Return replies in chat without creating or opening a local file for `chat only`, `no artifact`, `do not write files`, or `do not modify files`; otherwise override the default filename and write all replies to `<pr-number>-replies.md` in the OS temporary directory. Open it when the host supports editor control; otherwise return the path.
   - Never post replies to GitHub unless the user explicitly asks.
8. **Prepare metadata changes**: If the scope or approach shifted based on feedback, draft the necessary PR-description update. Apply it only when the user authorized GitHub writes.
