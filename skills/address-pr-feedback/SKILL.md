---
name: address-pr-feedback
description: Inspect current pull-request feedback, evaluate each suggestion, implement and publish accepted fixes for an authored or explicitly owned fix-and-push loop, verify them, and draft replies without posting. Use when asked to address, act on, or implement PR review feedback. Do not use when the user only wants wording for a comment or reply, or asks for a general PR review. Do not infer branch integration, history rewrite, PR-metadata, or reply-posting authority.
---

# Address PR Feedback

A workflow for systematically addressing review comments on a PR. Invoked when I say "address the feedback" or "work through the review comments."

## Authority

Reading the current remote PR state is allowed. For a pull request authored by the user, or one whose branch and fix-and-push loop the user explicitly owns, a request to address feedback authorizes accepted fixes, required verification, coherent commits, pushes to the same pull-request branch, and remote-head verification. Ask one consolidated question only when ownership or another required action is missing, and retain that answer while the repository, pull request, branch, and requested outcome remain unchanged.

For another author's pull request without explicit fix-and-push ownership, keep remote publication out of scope. Addressing feedback still authorizes accepted local fixes unless the request is read-only, but do not commit, push, integrate branches, or rewrite history. Never infer rebase, history-rewrite, pull-request metadata, review-thread resolution, or reply-posting authority from a feedback request.

A `chat only` or `no artifact` request changes only reply delivery; it does not revoke local-fix authority. An explicit `do not write files` or `do not modify files` instruction revokes local-fix authority and limits the workflow to read-only assessment with replies in chat.

## Steps

1. **Identify the repository**: Derive repository identity from the canonical PR URL instead of assuming the local `origin` is upstream.
2. **Gather feedback**: Start with a CLI-first snapshot: record the repository and both SHAs, resolve them to explicit refs, and inspect the merge-base diff and changed source. Retrieve the ordinary conversation and all inline comments before categorizing. Use the connector only for merged discussion, resolved review state, or a CLI authentication/capability gap; check CI separately. If required PR or feedback state cannot be verified with the available reads, stop and report the missing capability; do not categorize feedback or change code. Immediately before categorizing or changing code, re-read both SHAs and rebuild the snapshot if either changed. When the user supplies a self-contained snapshot at immutable revisions and asks to work from it, use that snapshot as the read boundary instead of attempting unavailable live reads. Do not integrate branches merely to inspect them.
3. **Categorize each comment**: Classify as must-fix (blocking), should-address (non-blocking but valid), or won't-fix (disagree — needs discussion). Evaluate whether each suggestion is correct before acting and account for issues resolved in previous rounds. Draft the reply outcome while categorizing so final delivery is not deferred until after every optional check.
4. **Keep changes granular**: Group edits and coherent commits by review comment or tightly related concern. Omit AI-attribution footers (e.g., "Co-Authored-By: Claude").
5. **Verify and publish**: Run the smallest repository-native checks that directly exercise the accepted fixes before any broader suite. Confirm the repository configuration before retrying a failed tool. Complete every verification step the user requested or the repository requires. In a time-bounded task, preserve enough time to deliver the replies and defer only optional broader checks. If required verification cannot finish, report the exact incomplete check and do not claim the work is verified. For a self-contained fixture or incomplete checkout, do not reconstruct missing repository configuration. Use the available focused checks and report the exact remaining gap. For an authored or explicitly owned fix-and-push loop, commit and push the verified fixes unless the user prohibited either action. Otherwise, preserve and report the local state without remote publication.
6. **Verify fixes against actual code**: Refresh the PR metadata and remote refs without integrating another branch. If either SHA changed unexpectedly, rebuild the snapshot and re-evaluate feedback before reporting. After an authorized push, confirm that the remote pull-request head matches the published commit. For a supplied self-contained snapshot, re-read its recorded boundaries, feedback, and resulting local files instead of making a live refresh. Then check the actual code to confirm the fix is correct -- do not just trust that a commit exists. Report which issues are properly fixed and which still need work.
7. **Prepare reply document**:
   - For each addressed comment, draft a short, plain-language reply that starts with the outcome or reason before any code-level detail.
   - When practical, include brief steps the reviewer can use to reproduce or verify the result.
   - For won't-fix items, explain the high-level trade-off respectfully.
   - Use the `draft-review-comment` skill for structure and quality. Identify the original feedback honestly: use its exact file path and line range for inline comments, its file path for file-level comments, and a PR thread link or short label for general feedback. Never invent a code location. Keep each reply self-contained and copy-pasteable.
   - Follow the `draft-review-comment` delivery rules. Return replies in chat without creating or opening a local file for `chat only`, `no artifact`, `do not write files`, or `do not modify files`; otherwise override the default filename and write all replies to `<pr-number>-replies.md` in the OS temporary directory. Open it when the host supports editor control; otherwise return the path.
   - For chat delivery after applying local fixes, this calling workflow overrides `draft-review-comment`'s comment-only chat format: name the focused verification commands and results before the replies. Report unfinished required verification as incomplete, and report optional broad-check gaps without withholding the replies. For read-only chat delivery, follow `draft-review-comment` and return only the requested assessment and replies.
   - Never post replies to GitHub unless the user explicitly asks.
8. **Prepare metadata changes**: If the scope or approach shifted based on feedback, draft the necessary PR-description update. Apply it only when the user authorized GitHub writes.
