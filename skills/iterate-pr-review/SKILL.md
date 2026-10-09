---
name: iterate-pr-review
description: Iterate a GitHub pull request through independent local agent reviews and accepted fixes until no actionable findings remain. Use only when the user explicitly says the pull request is theirs or they own its branch and fix-and-push loop; that ownership is a trigger precondition, not a later workflow check. Without it, including iterative requests for a contributor's pull request, use review-pr. Use self-review-pr for a one-time authored review.
---

# Iterate PR Review

Run a bounded local loop: review, assess each finding, fix accepted issues, verify, and review again. Keep each review tied to the exact source revision it inspected.

## Authority and boundary

- Confirm that the pull request is authored by the user or that the user explicitly owns its fix-and-push loop. If neither is established, use `review-pr` and keep the review read-only.
- Treat an explicit request to run this workflow as authority for the complete bounded loop: independent local agent review, accepted fixes, required checks and evaluations, coherent commits, and pushes to the same branch. Respect narrower limits.
- When the request also includes a rebase, publish only the verified rewritten task branch with `--force-with-lease` against its recorded remote head. Do not infer history-rewrite authority from iteration alone.
- Record the repository, pull request, branch, evaluation destination and payload, and round limit once. Ask one consolidated question for missing authority, retain the answer while that scope is unchanged, and ask again only when it changes.
- Use matching personal standing consent for model-backed evaluations. Otherwise, include the repository, public tracked payload, destination, and rerun scope in the consolidated question. Never send secrets, private material, untracked files, or unrelated repository data.
- Matching standing consent may also authorize `write-pr-description` to update only the Evaluation section of the recorded authored draft pull request for the exact current head.
- Keep remote review requests, public comments or reviews, thread resolution, unrelated metadata, ready-for-review transitions, merges, and releases outside the bundle. Runtime approval controls remain independent of task intent.
- Establish a maximum number of completed change rounds before starting. Default to five unless the request specifies another limit, and reserve a final review-only pass for the head created by the last allowed change.
- Load `self-review-pr` and `address-pr-feedback`. If either is unavailable, perform the same fresh, source-backed review, include a deletion-first pass through `review-simplicity` when available, and do not mutate remote review state.
- Do not request or re-request Copilot review. Existing remote feedback is evidence to assess, not a required new review source. A pending or unavailable Copilot review does not block the local loop. Incomplete access to existing discussion prevents claiming that all remote feedback is addressed.

## Local agent review

- Use a fresh read-only local subagent for each changed candidate, following `self-review-pr` and its `review-simplicity` baseline. Give it the pinned base, candidate source, diff, consumers, tests, and repository contracts. Do not give it implementation rationale, previous findings, or other reviewers' conclusions before its independent first pass.
- Request an internal findings handoff with source locations, evidence, and verification gaps. The reviewer must not edit source, commit, push, request remote reviews, or create a separate review artifact.
- If subagents are unavailable, use the fresh-context fallback in `self-review-pr` and disclose that limitation. Never substitute a Copilot request. A missing, failed, or pending local review is incomplete evidence, never a clean result.

## Iterate

1. Capture a fresh PR snapshot before any rebase or review action: canonical URL, title, base and head revisions, changed files, existing review state, and CI status. Accept a supplied immutable context that records the boundary and review evidence without remote lookup. If supplied capability context explicitly records that the canonical pull-request identity and all supported evidence routes are unavailable, stop immediately before repository discovery and request them. Otherwise, use the identity from the prompt or retained task state, or resolve it through only the exact current checkout or one authenticated supported pull-request read interface. If neither bounded route can provide the boundary and diff, stop after those checks and request the missing snapshot; do not search for alternate clients or unrelated repository metadata, enumerate unrelated local files, try unauthenticated web clients, or retry network routes. Record the head revision for this round. Rebuild the snapshot whenever it changes.
2. When a rebase is explicitly requested, use the recorded snapshot to refresh the base and pull-request head, rebase the task branch, verify the replay, and run required checks and evaluations. Keep the rebased candidate local for the review loop. Publish it only at the final publication gate, using `--force-with-lease` against the recorded remote head.
3. Pin the candidate to review. Use the verified local commit when it includes unpublished changes. For uncommitted fixes, also record the working-tree diff and source contents, since `HEAD` alone does not identify that state. Distinguish the candidate from the remote PR head and restart the review if either captured base or candidate source changes.
4. Run the independent local agent review for that candidate. After its first pass starts, assess existing PR feedback and findings from earlier rounds against the same source. Wait for the local review to complete before consolidating results.
5. Account for every comment or finding as accepted, already fixed, stale, or declined with source-backed reasoning. Deduplicate overlapping reports. An open GitHub thread can already be fixed, and a resolved thread can still identify a real issue. A suggestion is actionable only when it identifies a real problem or a required change; do not make unnecessary edits merely to clear comments.
6. Implement accepted fixes through `address-pr-feedback`, verify them, and return to the parent loop's commit, evaluation, and publication gates. Where authorized, commit coherently and run required model evaluations against that exact commit. Keep the review-and-fix rounds local until the candidate has no actionable findings. Respect local-only limits and continue reviewing the updated local candidate without committing or pushing. Every changed candidate needs another independent local review.
7. Finish only when the completed local review of the final candidate has no actionable findings, every known earlier concern is accounted for, and required verification and evaluations are complete. Re-read the base, candidate source, PR revisions, and accessible review state before declaring completion. Once the local loop converges and required checks pass, publish the authorized task branch and confirm that the PR head matches the reviewed candidate. If publication changes the base or candidate source, review again. State whether the result is local-only and report any incomplete discussion access separately.

## Wait and recover

- Wait only for a known pending local review or required check, using the platform's normal monitoring mechanism. Refresh the PR state after it completes.
- If the local review is unavailable or never completes, stop with that verification gap. Do not claim convergence from passing checks alone.
- If the head changes outside this loop, discard stale results and restart the affected round from a fresh snapshot.
- After the last allowed change round, complete the reserved review-only pass for its resulting head. If the local review or existing-feedback assessment finds actionable feedback, stop and deliver it with the next recommended action rather than making another change round.

## Recap

Report the active authority bundle and one concise row per round: full base and candidate revisions, any uncommitted diff identity, local review result, existing-feedback assessment, accepted changes, verification, and why the loop ended. Distinguish the reviewed local candidate from the published PR head. Distinguish completion, the iteration limit, failed verification, and runtime approval blockers.
