---
name: iterate-pr-review
description: Iterate a GitHub pull request authored by the user, or one whose fix-and-push loop the user explicitly owns, through Copilot review, independent adversarial self-review, and accepted fixes until both sources have no actionable feedback. Use only when that authorship or ownership is explicit. Iterative wording alone is insufficient. Use review-pr for another person's pull request when the user does not explicitly own its fix-and-push loop, even when asked to repeat reviews, and self-review-pr for a one-time authored review.
---

# Iterate PR Review

Run a bounded review-and-fix loop while keeping remote feedback, the local review, and source revisions attributable to the same pull-request head.

## Authority and boundary

- Confirm that the pull request is authored by the user or that the user explicitly owns its fix-and-push loop. If neither is established, use `review-pr` and keep the review read-only.
- Treat only actions explicitly named in the invoking request as authorized. An authorized review request permits only adding that reviewer for the recorded head; it does not authorize source edits, commits, pushes, other pull-request metadata changes, thread resolution, replies, marking ready, or merging.
- Establish a maximum number of completed change rounds before starting. Default to five unless the request specifies another limit, and reserve a final review-only pass for the head created by the last allowed change.
- Load `self-review-pr` for the independent review and `address-pr-feedback` to collect, assess, and implement accepted remote feedback. If either is unavailable, use this bounded fallback: capture the same fresh snapshot, independently re-read the full diff, changed source, tests, PR feedback, and CI in a fresh pass, then categorize each concern with source-backed reasoning. The fallback must load `review-simplicity` for its mandatory deletion-first handoff when available. Otherwise, directly check whether the same outcome can be preserved while removing new state, branches, wrappers, dependencies, duplication, or speculative abstractions, and explicitly report no findings when none are material. Do not post, resolve, or otherwise mutate remote review state in the fallback.
- Treat a missing, failed, or pending Copilot review as incomplete evidence, never as a clean result.

## Request Copilot review

- After confirming that the current head has neither a completed review nor a pending request, prefer the GitHub connector's reviewer-request action with the exact reviewer login `copilot-pull-request-reviewer[bot]`. If that corrected connector route is unavailable or still fails, use `gh pr edit <PR-NUMBER> --repo <OWNER/REPO> --add-reviewer @copilot`.
- If GitHub returns a collaborator-related `422` after receiving `copilot-pull-request-reviewer` without the `[bot]` suffix, correct the identifier and retry once. Do not infer that API review requests are unsupported from that error.
- Use the authenticated GitHub UI only when the connector and CLI routes are unavailable or still fail with the documented identifiers. If a request result is ambiguous, refresh reviewer or timeline state before retrying so one head does not receive duplicate requests.

## Iterate

1. Capture a fresh PR snapshot: canonical URL, title, base and head revisions, changed files, existing review state, and CI status. Record the head revision for this round. Rebuild the snapshot whenever it changes.
2. Reuse a completed Copilot review tied to that recorded head. If a current-head request or review is pending, wait for it instead of requesting another. Only when the current head has neither should you follow the request procedure above when authorized. Record when it was requested and do not reuse a review for an earlier head.
3. Independently run the adversarial self-review for the same head. Do not give it Copilot's conclusions before its first pass. Wait for the Copilot review and local review to complete before deciding whether to change code.
4. Consolidate both results. Account for every current comment or finding as accepted, already fixed, stale, or declined with source-backed reasoning. Deduplicate overlapping reports; a suggestion is actionable only when it identifies a real problem or a required change.
5. Implement accepted fixes only when authorized. Verify the changed behavior with the relevant project checks. If commit and push are not both separately authorized, report the verified local changes and stop; they cannot begin a new remote-review round. After an authorized commit and push, refresh the PR and verify that its remote head matches the new commit before starting the next round.
6. Finish only when the Copilot review for the current head is complete with no actionable feedback and the independent self-review for that same head has no actionable findings. Re-read the PR revisions and review state immediately before declaring completion.

## Wait and recover

- Wait only for a known pending review or check, using the platform's normal monitoring mechanism. Refresh the PR state after it completes.
- If Copilot is unavailable, cannot be requested, or never completes, stop with that verification gap. Do not substitute an unrequested human review or silently omit the Copilot condition.
- If the head changes outside this loop, discard stale results and restart the affected round from a fresh snapshot.
- After the last allowed change round, complete the reserved review-only pass for its resulting head. If either review finds actionable feedback, stop and deliver it with the next recommended action rather than making another change round.

## Recap

Report a concise recap with one row per round: immutable base revision, exact reviewed head revision, Copilot state, self-review result, accepted changes, verification, and why the loop ended. Do not omit or abbreviate either revision. Distinguish completion, iteration-limit stop, and blocked verification clearly.
