---
name: iterate-pr-review
description: Iterate an authored or explicitly owned PR through independent local agent reviews and accepted fixes until no actionable findings remain. For automatic selection, authorship or ownership of the branch and fix-and-push loop must already be explicit before loading. Do not infer ownership from requests to iterate, fix, commit, or push. Contributor PR iteration without it belongs to review-pr. Use self-review-pr for a one-time authored review.
---

# Iterate PR Review

Review locally, assess findings, fix accepted issues, verify, and review again.

## Authority and limits

- Require user authorship or explicit ownership of the branch and fix-and-push loop. Requests to iterate, fix, commit, or push do not establish ownership. Otherwise hand off to read-only `review-pr`.
- An iteration request authorizes accepted fixes, required checks and evaluations, coherent commits, and publication to that same branch. Honor narrower instructions, including local-only or review-only requests.
- Record the repository, PR, branch, evaluation destination and payload, and round limit once. Ask one consolidated question for missing authority; retain it while that scope is unchanged. Use matching personal standing consent for model-backed evaluations. Never send secrets, private material, untracked files, or unrelated data.
- Only explicit rebase authority permits rewriting the task branch. Use `--force-with-lease` against its recorded remote head after verification.
- Keep remote review requests, public comments or reviews, thread resolution, unrelated metadata, ready state, merges, and releases outside the loop. Matching standing consent may separately authorize `write-pr-description` to update only the recorded draft PR's Evaluation section for its exact head. Runtime approval controls remain independent of task authority.
- Default to five completed change rounds unless the user specifies another limit. Reserve a final review-only pass for the last changed candidate.

## Local review

Load `self-review-pr` and `address-pr-feedback`. Use a fresh read-only local subagent for every changed candidate, with the `review-simplicity` baseline. Give it the pinned base, candidate source, diff, consumers, tests, and repository contracts. Withhold implementation rationale and previous reviewers' conclusions before its first pass. Request internal findings with locations, evidence, and verification gaps; the reviewer must not edit, publish, request remote reviews, or create a separate artifact.

If subagents are unavailable, including supplied capability limits, use `self-review-pr`'s fresh-context fallback and explicitly state that no independent agent ran. If a sibling skill is missing, apply the same source-backed review and feedback assessment, including `review-simplicity` when available. A missing, failed, or pending local review is incomplete evidence.

Do not request or re-request Copilot review. Assess existing remote feedback, but do not wait for Copilot as a completion condition. Incomplete discussion access limits claims about remote feedback, not the ability to review local source.

## Iterate

1. Capture the canonical PR URL, title, base and remote head, changed files, existing feedback, and CI through the bounded snapshot procedure in `self-review-pr`. Accept complete immutable context without remote lookup. If supplied capability facts rule out every evidence route, stop before discovery and request the snapshot. Otherwise use only the exact current checkout or one authenticated supported PR read interface; stop if neither can verify the boundary and source. Do not search unrelated files, alternate clients, or unauthenticated routes.
2. If a rebase was requested, refresh the base and remote head, replay the task branch, and verify it. Keep the rebased candidate local until final publication.
3. Pin the local candidate separately from the remote PR head. For uncommitted fixes, record the working-tree diff and source contents as well as `HEAD`. Restart the affected review whenever the captured base or candidate source changes.
4. Start the independent local review. Then assess existing PR feedback and earlier findings against that same candidate. Wait for the local review before consolidating results.
5. Classify each concern as accepted, already fixed, stale, or declined with source evidence. Deduplicate overlaps. GitHub thread state and an author's reply do not prove whether an issue is fixed. Act only on real problems or required changes.
6. Have `address-pr-feedback` apply and verify accepted fixes, then return to this loop's commit, evaluation, and publication gates. Commit only where authorized and run required evaluations against that exact commit. Review every changed candidate again, including uncommitted local-only fixes. Keep these rounds local.
7. Converge only after the final candidate has a completed local review with no actionable findings, every known concern is accounted for, and required checks and evaluations pass. Recheck the base, candidate source, PR revisions, and accessible feedback. Publish only where authorized, then confirm the PR head matches the reviewed candidate. Review again if the base or source changed. Report local-only state and incomplete discussion access explicitly.

## Stop and report

Wait only for a known pending local review or required check. If review evidence or verification remains unavailable, report the gap rather than claiming convergence. After the last allowed change, complete its final review-only pass; report remaining actionable findings without making another change round.

Give a concise recap with the authority boundary, full base and candidate revisions, uncommitted diff identity when applicable, local review and existing-feedback results, accepted changes, verification, and stopping reason. Distinguish local candidates from the published PR head and completion from a round limit or blocker.
