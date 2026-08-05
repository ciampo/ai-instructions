---
name: self-review-pr
description: Review the current pull request read-only and independently before it is marked ready, always including the deletion-first `review-simplicity` baseline and using a read-only subagent when available with a fresh-context fallback otherwise. Apply selected local fixes only when requested; never infer commit, push, PR-update, or ready-for-review authority.
---

# Self-Review PR

A workflow for reviewing your own PR before marking it ready. Invoked when I say "self-review" or "review before shipping."

The preferred technique is a read-only subagent to reduce confirmation bias. When the host has no subagent capability, perform a clearly identified fresh-context second pass and disclose that limitation.

## Authority

The review and any local Markdown artifact are read-only with respect to repository source and GitHub. If the request already authorizes addressing valid findings, apply those local fixes after recording the independent review; otherwise report the findings and wait for the user's decision. `chat only` and `no artifact` change only delivery, but an explicit `do not write files` or `do not modify files` instruction overrides local-fix authority and prohibits every local file write. Create commits or mutate the remote PR only when those actions are separately authorized.

## Steps

1. Gather a fresh PR snapshot: record the PR URL, title, description, commit history, and both SHAs. If neither the prompt nor retained task state supplies the canonical pull-request identity, stop immediately before tool or repository discovery and request it; do not inspect the current directory to infer the target. Accept a supplied complete immutable snapshot without remote lookup. Otherwise, resolve the recorded SHAs through only the recorded exact local checkout or one authenticated supported pull-request read interface, then inspect the merge-base diff and full changed source. When reviewing unpushed local commits, use the verified local `HEAD` as the candidate after pinning the remote base, and derive scope locally. Check CI separately. If neither evidence route can verify required PR or review state, stop after those checks and report the missing capability; do not search for alternate clients or repository metadata, enumerate unrelated local files, try unauthenticated web clients, or retry network routes. Re-read both SHAs before concluding and restart if either changed.
2. Load `review-simplicity` and require its deletion-first baseline for the same snapshot even when simplification was not requested. Launch a read-only subagent with the captured context when available. Otherwise, start a fresh review pass without relying on the implementation rationale. Cover correctness, accessibility, consistency, simplicity, completeness, risks, and suggestions; an explicit no-findings simplicity result is valid.
3. Use the `draft-review-comment` skill for delivery. Return comments in chat without creating or opening a local file for `chat only`, `no artifact`, `do not write files`, or `do not modify files`; otherwise write the self-review to `<pr-number>-self-review.md` in the OS temporary directory, then open it when supported or return the path. Use exact file paths and line ranges for inline findings, file paths for file-level findings, and no fabricated location for general findings.
4. When local fixes were not already requested, let me decide what to act on.
5. When local fixes were requested before or after the review and no explicit no-write instruction revoked that authority, implement each accepted finding in a coherent batch. Prefer simple, direct solutions. Commit only if the user also requested commits.
6. Run the project's relevant verification suite after all fixes, then report the review output, any changed files, and remaining actions that still require authorization.
