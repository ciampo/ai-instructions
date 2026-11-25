# ADR 0009: Merge Review Coordination into `review-pr`

- **Status:** Accepted
- **Date:** 2026-11-25
- **Supersedes:** [ADR 0006](0006-review-coordinator.md)

## Context

ADR 0006 added `review-coordinator` as a second stage of `review-pr`. A review with two or more material specialist lanes, or an explicit panel request, loaded `review-pr`, then `review-simplicity`, then `review-coordinator`, in a fixed order and before any pull-request lookup. The coordinator then owned specialist selection, delegation sizing, the evidence recheck, and delivery.

Operating the two skills showed these costs:

- Both skills listed the same ten specialist lanes and the same delivery rules. The coordinator also carried its own copies of the snapshot and code-review references. Each change to a lane or to the severity contract had to be made in two or three places.
- The entry-routing contract was hard to follow. The [evaluation ledger](../skill-evaluation-results.md) records repeated runs in which the review output was correct but the run failed a load-order assertion, for example because the subject read the supplied context before it loaded `review-simplicity` in a separate action.
- A coordinated review loaded about 22.5 KB across the two skills and the coordinator's references. Their descriptions and the cross-references in other descriptions spent shared discovery-metadata budget on explaining which skill starts first.
- The decision that mattered, whether to delegate, did not depend on which skill was loaded. The sizing rules already said that zero subagents is valid and that methods run in the current agent by default.

## Decision

`review-pr` owns the whole review. After the core pass and the mandatory `review-simplicity` baseline, it selects the material specialist methods from one list, applies them in the current agent by default, and uses its delegation-sizing rules when the user asks for a panel or independent reviewers, or when two or more selected lanes are independent and material. It then holds the evidence review, normalizes severity, and delivers one response.

`review-coordinator` remains as a deprecated compatibility route that loads `review-pr`. It follows the [compatibility policy](../compatibility-policy.md).

The parts of ADR 0006 that still hold are unchanged: specialist methods stay in their own skills, agreement between reviewers is never proof, the final response is single and deduplicated, and no custom agents or model routing are distributed.

## Evidence

A comparison ran before the change was kept. Twenty output cases from the two skills' fixtures ran once on each design, each in a fresh subagent with the complete skill catalog and no access to the assertions. Blind graders then scored both outputs for each case against the original assertions.

| Measure | Two skills | Merged |
| --- | --- | --- |
| Design-neutral assertions passed | 84 of 86 | 83 of 86 |
| Summed quality score, 20 cases, 1 to 5 each | 86 | 87 |
| Instruction text loaded for a coordinated review | about 22.5 KB | about 10.2 KB |
| Aggregate skill-description bytes | 11,199 | 10,912 |

Two failures were shared by both designs. The one extra failure in the merged design was a process remark in an overview, which the output contract already prohibits. Severity results, lane selection, delegation decisions, chat-only delivery, and previous-feedback handling matched in every case.

The comparison has limits. Each case ran once. The runs used subagents that reported their own traces, not a product's real skill loader, and they did not spawn real subagents. It shows that the merged workflow gives equivalent reviews on these fixtures. It does not show better findings.

## Consequences

- One workflow and one lane list to maintain. The coordinator's duplicate references are removed.
- No skill-loading order is part of the contract beyond loading `review-simplicity` before reading the pull request.
- `review-pr` grows by about 1 KB for every review, including single-lane reviews that never delegate.
- Prompts that name `review-coordinator` keep working through the compatibility route.
- The comparison should be repeated in a real client when the next evaluation campaign runs.

## Alternatives considered

### Keep both skills and only relax the load-order rules

Rejected. It removes the failing assertions but keeps the duplicated lane list, references, and delivery rules.

### Remove `review-coordinator` without a compatibility route

Rejected. Existing prompts and notes name the skill, and the compatibility policy keeps a retired skill name as a route through a stated window.
