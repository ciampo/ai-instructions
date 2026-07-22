---
name: self-review-pr
description: Review the current pull request read-only and independently before it is marked ready, using a read-only subagent when available and a fresh-context fallback otherwise. Apply selected local fixes only when requested; never infer commit, push, PR-update, or ready-for-review authority.
---

# Self-Review PR

A workflow for reviewing your own PR before marking it ready. Invoked when I say "self-review" or "review before shipping."

The preferred technique is a read-only subagent to reduce confirmation bias. When the host has no subagent capability, perform a clearly identified fresh-context second pass and disclose that limitation.

## Authority

The review and its local Markdown artifact are read-only with respect to repository source and GitHub. If the request already authorizes addressing valid findings, apply those local fixes after recording the independent review; otherwise report the findings and wait for the user's decision. Create commits or mutate the remote PR only when those actions are separately authorized.

## Steps

1. Gather context: full diff against the base branch, commit log, CI status, and the PR description.
2. Launch a read-only subagent with the captured context when available. Otherwise, start a fresh review pass without relying on the implementation rationale. Cover correctness, accessibility, consistency, completeness, risks, and suggestions.
3. Use the `draft-review-comment` skill to write `<pr-number>-self-review.md` in the OS temporary directory. Use exact file paths and line ranges for inline findings, file paths for file-level findings, and no fabricated location for general findings. Open it when supported; otherwise return the path.
4. When local fixes were not already requested, let me decide what to act on.
5. When local fixes were requested before or after the review, implement each accepted finding in a coherent batch. Prefer simple, direct solutions. Commit only if the user also requested commits.
6. Run the project's relevant verification suite after all fixes, then report the review artifact, any changed files, and remaining actions that still require authorization.
