---
name: iterate-pr-review
description: Iterate an authored GitHub pull request through Copilot review, independent adversarial self-review, and accepted fixes until both sources have no actionable feedback. Use when asked to iterate or repeat reviews on a PR, or to run a Copilot-and-self-review loop before handoff. Do not use for a one-time review or to review someone else's PR.
---

# Iterate PR Review

Run a bounded review-and-fix loop while keeping remote feedback, the local review, and source revisions attributable to the same pull-request head.

## Authority and boundary

- Treat the invoking request as the authority for requesting a Copilot review, editing source, committing, pushing, or changing pull-request metadata. Do not infer authority to mark ready, merge, resolve threads, or post replies.
- Establish an iteration limit before starting. Default to three completed change rounds unless the request specifies another limit. Stop at that limit and report remaining work rather than continuing indefinitely.
- Use `self-review-pr` for the independent review and `address-pr-feedback` to collect, assess, and implement accepted remote feedback. Do not duplicate their detailed procedures here.
- Treat a missing, failed, or pending Copilot review as incomplete evidence, never as a clean result.

## Iterate

1. Capture a fresh PR snapshot: canonical URL, title, base and head revisions, changed files, existing review state, and CI status. Record the head revision for this round. Rebuild the snapshot whenever it changes.
2. Request a Copilot review for that recorded head through the supported GitHub surface when authorized. Record when it was requested and do not reuse a review for an earlier head.
3. Independently run the adversarial self-review for the same head. Do not give it Copilot's conclusions before its first pass. Wait for the Copilot review and local review to complete before deciding whether to change code.
4. Consolidate both results. Account for every current comment or finding as accepted, already fixed, stale, or declined with source-backed reasoning. Deduplicate overlapping reports; a suggestion is actionable only when it identifies a real problem or a required change.
5. Implement accepted fixes only when authorized. Verify the changed behavior with the relevant project checks, then commit, push, and refresh the PR only when the request authorizes each action. Start the next round from the resulting head revision.
6. Finish only when the Copilot review for the current head is complete with no actionable feedback and the independent self-review for that same head has no actionable findings. Re-read the PR revisions and review state immediately before declaring completion.

## Wait and recover

- Wait only for a known pending review or check, using the platform's normal monitoring mechanism. Refresh the PR state after it completes.
- If Copilot is unavailable, cannot be requested, or never completes, stop with that verification gap. Do not substitute an unrequested human review or silently omit the Copilot condition.
- If the head changes outside this loop, discard stale results and restart the affected round from a fresh snapshot.
- If the iteration limit is reached, stop and deliver the unresolved actionable feedback and the next recommended action.

## Recap

Report a concise recap with one row per round: head revision, Copilot state, self-review result, accepted changes, verification, and why the loop ended. Distinguish completion, iteration-limit stop, and blocked verification clearly.
