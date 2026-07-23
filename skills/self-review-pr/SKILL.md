---
name: self-review-pr
description: Review the current pull request read-only and independently before it is marked ready, using a read-only subagent when available and a fresh-context fallback otherwise. Apply selected local fixes only when requested; never infer commit, push, PR-update, or ready-for-review authority.
---

# Self-Review PR

A workflow for reviewing your own PR before marking it ready. Invoked when I say "self-review" or "review before shipping."

The preferred technique is a read-only subagent to reduce confirmation bias. When the host has no subagent capability, perform a clearly identified fresh-context second pass and disclose that limitation.

## Authority

The review and any local Markdown artifact are read-only with respect to repository source and GitHub. If the request already authorizes addressing valid findings, apply those local fixes after recording the independent review; otherwise report the findings and wait for the user's decision. Create commits or mutate the remote PR only when those actions are separately authorized.

## Steps

1. Gather a fresh PR snapshot: use field-limited `gh pr view` to capture the base and head SHAs plus the PR title and description, and capture the base-to-head commit log. Use `gh pr diff --name-only`, fetch both captured OIDs into distinct explicit local refs, verify each ref resolves to its recorded OID, then use the three-dot local diff and full source to inspect every changed file. Use `gh pr checks` plus failed Actions logs for CI. Use the connector when merged discussion or resolved review-thread state is material, or when `gh` authentication or capability cannot gather the needed state. Re-read PR metadata before concluding and refresh the snapshot if either captured SHA changed.
2. Launch a read-only subagent with the captured context when available. Otherwise, start a fresh review pass without relying on the implementation rationale. Cover correctness, accessibility, consistency, completeness, risks, and suggestions.
3. Use the `draft-review-comment` skill for delivery. By default, write the self-review to `<pr-number>-self-review.md` in the OS temporary directory, then open it when supported or return the path. When the user explicitly requests chat delivery, return the requested comments in chat and skip file creation unless they also request file delivery. Use exact file paths and line ranges for inline findings, file paths for file-level findings, and no fabricated location for general findings.
4. When local fixes were not already requested, let me decide what to act on.
5. When local fixes were requested before or after the review, implement each accepted finding in a coherent batch. Prefer simple, direct solutions. Commit only if the user also requested commits.
6. Run the project's relevant verification suite after all fixes, then report the review output, any changed files, and remaining actions that still require authorization.
