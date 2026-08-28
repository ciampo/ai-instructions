---
name: address-pr-feedback
description: Inspect current pull-request feedback, evaluate each suggestion, implement and publish accepted fixes for an authored or explicitly owned fix-and-push loop, verify them, and draft replies without posting. Use when asked to address, act on, or implement PR review feedback. Do not use when the user only wants wording for a comment or reply, or asks for a general PR review. Do not infer branch integration, history rewrite, PR-metadata, or reply-posting authority.
---

# Address PR Feedback

A workflow for systematically addressing review comments on a PR. Invoked when I say "address the feedback" or "work through the review comments."

## Authority

- On an authored pull request, or an explicitly owned fix-and-push loop, addressing feedback includes accepted fixes, required checks, coherent commits, and pushes to the same branch unless the user narrows the task.
- On another author's pull request without that ownership, keep changes local and do not commit, push, integrate, or rewrite history. Never post replies, resolve threads, or edit pull-request metadata unless explicitly requested.
- Honor a parent workflow's later commit, evaluation, or publication gate. `Chat only` changes reply delivery, while `do not write files` makes the task read-only.

## Steps

1. **Identify the repository**: Derive repository identity from the canonical PR URL instead of assuming the local `origin` is upstream.
2. **Gather feedback**: Pin the repository, base, and head; inspect the exact diff, changed source, conversation, inline comments, material thread state, and CI. Refresh the revisions before acting and rebuild the snapshot if either changed. Use a supplied immutable snapshot when live reads are unavailable. Stop if required evidence is missing, and do not integrate branches merely to inspect them.
3. **Categorize each comment**: Classify as must-fix (blocking), should-address (non-blocking but valid), or won't-fix (disagree — needs discussion). Evaluate whether each suggestion is correct before acting and account for issues resolved in previous rounds. Draft the reply outcome while categorizing so final delivery is not deferred until after every optional check.
4. **Keep changes granular**: Group edits and coherent commits by review comment or tightly related concern. Omit AI-attribution footers (e.g., "Co-Authored-By: Claude").
5. **Verify and publish**: Run the smallest repository-native checks that exercise the accepted fixes, plus any checks the user or repository requires. Report incomplete required checks instead of claiming success. Do not reconstruct missing configuration in a self-contained fixture. Then follow the authority boundary above: return fixes to a parent gate, publish authorized fixes, or preserve the local state.
6. **Verify the result**: Re-read the PR boundaries and actual changed code. Rebuild the snapshot if either revision changed unexpectedly. After a push, confirm that the pull-request head matches the published commit. Report which concerns are fixed and which remain.
7. **Prepare reply document**:
   - Load `draft-review-comment` only at this step, after steps 1–6 produced verified outcomes and reply drafts are actually required. Do not preload it while gathering feedback, implementing fixes, or running verification.
   - For each accepted comment, default to one friendly sentence or two at most: acknowledge the point and state what changed. Include a short commit SHA when useful. Do not repeat the original concern, implementation mechanics, or verification unless the reviewer needs them.
   - For won't-fix items, give the high-level trade-off respectfully and briefly. Put necessary supporting detail in an optional `<details>` block.
   - Use the loaded `draft-review-comment` skill for structure and quality. Identify the original feedback outside the reply text: use its exact file path and line range for inline comments, its file path for file-level comments, and a PR thread link or short label for general feedback. Never invent a code location.
   - Follow the `draft-review-comment` delivery rules. Return replies in chat without creating or opening a local file for `chat only`, `no artifact`, `do not write files`, or `do not modify files`; otherwise override the default filename and write all replies to `<pr-number>-replies.md` in the OS temporary directory. Open it when the host supports editor control; otherwise return the path.
   - Keep workflow status and verification separate from the copy-pasteable replies. Mention them in chat only when they affect the user's next action; never pad each reply with test results.
   - Never post replies to GitHub unless the user explicitly asks.
8. **Prepare metadata changes**: If the scope or approach shifted based on feedback, draft the necessary PR-description update. Apply it only when the user authorized GitHub writes.
