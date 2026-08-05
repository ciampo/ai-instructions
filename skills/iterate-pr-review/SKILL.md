---
name: iterate-pr-review
description: Iterate a GitHub pull request through Copilot review, independent adversarial self-review, and accepted fixes until both sources have no actionable feedback. Use only when the user explicitly says the pull request is theirs or they own its branch and fix-and-push loop; that ownership is a trigger precondition, not a later workflow check. Without it, including iterative requests for a contributor's pull request, use review-pr. Use self-review-pr for a one-time authored review.
---

# Iterate PR Review

Run a bounded review-and-fix loop while keeping remote feedback, the local review, and source revisions attributable to the same pull-request head.

## Authority and boundary

- Confirm that the pull request is authored by the user or that the user explicitly owns its fix-and-push loop. If neither is established, use `review-pr` and keep the review read-only.
- Treat an explicit request to run this workflow as authority for the complete bounded loop: one current-head Copilot request per round, independent review, accepted fixes, required checks and evaluations, coherent commits, and pushes to the same branch. Respect narrower limits.
- When the request also includes a rebase, publish only the verified rewritten task branch with `--force-with-lease` against its recorded remote head. Do not infer history-rewrite authority from iteration alone.
- Record the repository, pull request, branch, evaluation destination and payload, and round limit once. Ask one consolidated question for missing authority, retain the answer while that scope is unchanged, and ask again only when it changes.
- Use matching personal standing consent for model-backed evaluations. Otherwise, include the repository, public tracked payload, destination, and rerun scope in the consolidated question. Never send secrets, private material, untracked files, or unrelated repository data.
- Matching standing consent may also authorize `write-pr-description` to update only the Evaluation section of the recorded authored draft pull request for the exact current head.
- Keep other reviewers, public comments or reviews, thread resolution, unrelated metadata, ready-for-review transitions, merges, and releases outside the bundle. Runtime approval controls remain independent of task intent.
- Establish a maximum number of completed change rounds before starting. Default to five unless the request specifies another limit, and reserve a final review-only pass for the head created by the last allowed change.
- Load `self-review-pr` and `address-pr-feedback`. If either is unavailable, perform the same fresh, source-backed review, include a deletion-first pass through `review-simplicity` when available, and do not mutate remote review state.
- Treat a missing, failed, or pending Copilot review as incomplete evidence, never as a clean result.

## Request Copilot review

1. Refresh the pull request and request a review only when the recorded current head has neither completed nor pending Copilot evidence.
2. Prefer the GitHub connector with `copilot-pull-request-reviewer[bot]`. If that fails, use `gh pr edit` with `@copilot`, then the authenticated GitHub UI as a final fallback.
3. Record the requested head and result. Refresh ambiguous state before retrying to avoid duplicate requests.

## Iterate

1. Capture a fresh PR snapshot before any rebase or review action: canonical URL, title, base and head revisions, changed files, existing review state, and CI status. Accept a supplied immutable context that records the boundary and review evidence without remote lookup. If supplied capability context explicitly records that the canonical pull-request identity and all supported evidence routes are unavailable, stop immediately before repository discovery and request them. Otherwise, use the identity from the prompt or retained task state, or resolve it through only the exact current checkout or one authenticated supported pull-request read interface. If neither bounded route can provide the boundary and diff, stop after those checks and request the missing snapshot; do not search for alternate clients or unrelated repository metadata, enumerate unrelated local files, try unauthenticated web clients, or retry network routes. Record the head revision for this round. Rebuild the snapshot whenever it changes.
2. When a rebase is explicitly requested, use the recorded snapshot to refresh the base and pull-request head, rebase the task branch, verify the replay, and run required checks and evaluations. Publish the verified branch with `--force-with-lease`, then confirm that local, remote, and pull-request heads match.
3. Reuse a completed Copilot review tied to the recorded head. If its review or request is pending, wait without creating a duplicate. If the head has neither, follow the request procedure above under the retained task bundle, then wait for current-head evidence. If no supported request route can provide it, stop with that verification gap. Do not reuse a review for an earlier head.
4. Independently run the adversarial self-review for the same head. Do not give it Copilot's conclusions before its first pass. Wait for the Copilot review and local review to complete before deciding whether to change code.
5. Consolidate both results. Account for every current comment or finding as accepted, already fixed, stale, or declined with source-backed reasoning. Deduplicate overlapping reports; a suggestion is actionable only when it identifies a real problem or a required change.
6. Implement accepted fixes, verify them, commit coherently, and run required model evaluations against that exact commit. Push only after those checks pass, then verify the remote head before the next round. Honor local-only limits and report blocked verification without publishing.
7. Finish only when the Copilot review for the current head is complete with no actionable feedback, the independent self-review for that same head has no actionable findings, and every required exact-head evaluation is complete. Re-read the PR revisions and review state immediately before declaring completion.

## Wait and recover

- Wait only for a known pending review or check, using the platform's normal monitoring mechanism. Refresh the PR state after it completes.
- If current-head Copilot evidence is unavailable or never completes, stop with that verification gap. Do not substitute an unrequested human review or silently omit the Copilot condition.
- If the head changes outside this loop, discard stale results and restart the affected round from a fresh snapshot.
- After the last allowed change round, complete the reserved review-only pass for its resulting head. If either review finds actionable feedback, stop and deliver it with the next recommended action rather than making another change round.

## Recap

Report the active authority bundle and one concise row per round: full base and head revisions, both review results, accepted changes, verification, and why the loop ended. Distinguish completion, the iteration limit, failed verification, and runtime approval blockers.
