---
name: iterate-pr-review
description: Iterate a GitHub pull request authored by the user, or one whose fix-and-push loop the user explicitly owns, through Copilot review, independent adversarial self-review, and accepted fixes until both sources have no actionable feedback. Use only when that authorship or ownership is explicit. Iterative wording alone is insufficient. Use review-pr for another person's pull request when the user does not explicitly own its fix-and-push loop, even when asked to repeat reviews, and self-review-pr for a one-time authored review.
---

# Iterate PR Review

Run a bounded review-and-fix loop while keeping remote feedback, the local review, and source revisions attributable to the same pull-request head.

## Authority and boundary

- Confirm that the pull request is authored by the user or that the user explicitly owns its fix-and-push loop. If neither is established, use `review-pr` and keep the review read-only.
- Treat an explicit request to run this workflow as one task-scoped authority bundle for the identified pull request: request at most one current-head Copilot review per exact head; consume the resulting remote review evidence; run the independent review; apply accepted fixes; run required verification; make coherent commits; push the same pull-request branch; and repeat within the configured round limit. Respect narrower limits such as review-only, local-only, do-not-commit, do-not-push, or do-not-request-reviewers instructions.
- When the invoking request explicitly includes a rebase, extend the bundle only to the resulting exact `--force-with-lease` update of the same pull-request branch after patch-replay and remote-head verification. Do not use plain `--force`, rewrite another branch, or infer history-rewrite authority when the request did not include a rebase.
- Before the first affected action, record the repository, pull request, branch, external evaluation destination, payload class, and round limit. If a required action is outside the bundle, ask at most one consolidated authority question and retain the answer while those values remain unchanged. A different repository, pull request, branch, destination, payload class, or exceeded round limit requires a new authority decision.
- Use a loaded personal standing authorization for scoped model-backed evaluations when its repository, public tracked payload, OpenAI Codex destination, and rerun boundary all match. Otherwise, include those four facts in the single consolidated question. Never send secrets, credentials, private links or comments, untracked files, or unrelated repository data under this workflow.
- Keep pull-request description writes outside this task bundle. To record an exact-head evaluation result, load `write-pr-description` and require authority that explicitly grants that Evaluation-section write for the matching existing authored draft pull request, task branch, and exact head.
- Under the retained task bundle, request at most one Copilot review for the recorded repository, pull request, and exact head without a separate authority question. Keep every other reviewer mutation, the agent's own public comments, replies, or reviews, review-thread resolution, unrelated pull-request metadata, ready-for-review transitions, merges, and releases outside the bundle.
- Distinguish task authority from runtime sandbox, approval-reviewer, managed-policy, and command-rule controls. Report an independent runtime blocker without asking the user to restate unchanged task intent.
- Establish a maximum number of completed change rounds before starting. Default to five unless the request specifies another limit, and reserve a final review-only pass for the head created by the last allowed change.
- Load `self-review-pr` for the independent review and `address-pr-feedback` to collect, assess, and implement accepted remote feedback. If either is unavailable, use this bounded fallback: capture the same fresh snapshot, independently re-read the full diff, changed source, tests, PR feedback, and CI in a fresh pass, then categorize each concern with source-backed reasoning. The fallback must load `review-simplicity` for its mandatory deletion-first handoff when available. Otherwise, directly check whether the same outcome can be preserved while removing new state, branches, wrappers, dependencies, duplication, or speculative abstractions, and explicitly report no findings when none are material. Do not post, resolve, or otherwise mutate remote review state in the fallback.
- Treat a missing, failed, or pending Copilot review as incomplete evidence, never as a clean result.

## Request Copilot review

1. Immediately before requesting a review, refresh the pull request and confirm that its current head still equals the recorded head for the round. Confirm that the head has neither a completed Copilot review nor a pending Copilot request.
2. Prefer the GitHub connector's reviewer-request action with the exact reviewer login `copilot-pull-request-reviewer[bot]`. If GitHub returns a collaborator-related `422` after receiving `copilot-pull-request-reviewer` without the `[bot]` suffix, correct the identifier and retry once. Do not infer that API review requests are unsupported from that error.
3. If the corrected connector route is unavailable or still fails, use `gh pr edit <PR-NUMBER> --repo <OWNER/REPO> --add-reviewer @copilot`.
4. Use the authenticated GitHub UI only when the connector and CLI routes are unavailable or still fail with the documented identifiers.
5. Record the requested head and result. If the result is ambiguous, refresh reviewer or timeline state before retrying so one head does not receive duplicate requests.

## Iterate

1. When a rebase is explicitly requested, refresh the intended base and remote pull-request head, rebase the task branch, and verify patch replay. Run required project checks and any required model-backed evaluations for the exact rebased commit before publishing it. If verification or a required evaluation fails, do not push. Otherwise, publish only with an exact lease for the recorded remote head, then confirm that the local, remote, and pull-request heads match before reviewing. Do not use this step to rewrite history when the request did not include a rebase.
2. Capture a fresh PR snapshot: canonical URL, title, base and head revisions, changed files, existing review state, and CI status. Record the head revision for this round. Rebuild the snapshot whenever it changes.
3. Reuse a completed Copilot review tied to the recorded head. If its review or request is pending, wait without creating a duplicate. If the head has neither, follow the request procedure above under the retained task bundle, then wait for current-head evidence. If no supported request route can provide it, stop with that verification gap. Do not reuse a review for an earlier head.
4. Independently run the adversarial self-review for the same head. Do not give it Copilot's conclusions before its first pass. Wait for the Copilot review and local review to complete before deciding whether to change code.
5. Consolidate both results. Account for every current comment or finding as accepted, already fixed, stale, or declined with source-backed reasoning. Deduplicate overlapping reports; a suggestion is actionable only when it identifies a real problem or a required change.
6. Implement accepted fixes within the active bundle and verify the changed behavior with the relevant project checks. Make a coherent local commit, then run required model-backed evaluations for that exact commit only within the recorded payload and destination boundary. Push the evaluated commit to the same pull-request branch, refresh the pull request, and verify that its remote head matches the evaluated commit before starting the next round. If evaluation finds an actionable content failure, do not push; fix the failure in a new coherent local commit and evaluate that new exact commit. If evaluation cannot complete because of an infrastructure, policy, or other runtime blocker, do not push or make an unrelated commit; report the blocker. If the request explicitly limited the workflow to local or uncommitted work, report the verified local state and stop because it cannot begin a new remote-review round.
7. Finish only when the Copilot review for the current head is complete with no actionable feedback, the independent self-review for that same head has no actionable findings, and every required exact-head evaluation is complete. Re-read the PR revisions and review state immediately before declaring completion.

## Wait and recover

- Wait only for a known pending review or check, using the platform's normal monitoring mechanism. Refresh the PR state after it completes.
- If current-head Copilot evidence is unavailable or never completes, stop with that verification gap. Do not substitute an unrequested human review or silently omit the Copilot condition.
- If the head changes outside this loop, discard stale results and restart the affected round from a fresh snapshot.
- After the last allowed change round, complete the reserved review-only pass for its resulting head. If either review finds actionable feedback, stop and deliver it with the next recommended action rather than making another change round.

## Recap

Report the active authority bundle and a concise recap with one row per round: immutable base revision, exact reviewed head revision, Copilot state, self-review result, accepted changes, verification, and why the loop ended. Do not omit or abbreviate either revision. Distinguish completion, iteration-limit stop, blocked verification, and an independent runtime approval blocker clearly.
