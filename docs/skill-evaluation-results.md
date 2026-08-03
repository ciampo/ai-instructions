# Skill Evaluation Results

Status: pending the prerequisite instruction and evaluation changes listed below. This document does not claim that a model evaluation has run.

## Purpose

This is the durable ledger for model-backed skill evaluations. Fixture validation proves that the cases are complete and self-contained. It does not prove that a client loaded the intended skill or produced the expected result.

Record each evaluation campaign against one immutable repository revision. Do not combine outputs from different revisions into one result.

## Result contract

Each campaign must record:

- repository revision and evaluation-fixture revision;
- client name and exact version;
- authentication and tool-access context when it affects behavior;
- skill name and trigger or output case ID;
- at least three trigger attempts and whether the client loaded the skill;
- each output assertion as `pass`, `fail`, or `blocked`, with concise evidence;
- comparison revision or no-skill baseline when that comparison is material;
- wall time and token use when comparing direct and coordinated review;
- overall status as `pass`, `partial`, or `blocked`;
- follow-up issue or pull request for every accepted instruction failure.

Static fixture validation, installation checks, or one successful prompt cannot by themselves produce a `pass` result.

## Active campaign

Target revision: unassigned until all prerequisite pull requests merge into `main`.

| Prerequisite | Required behavior | Status |
| --- | --- | --- |
| [PR #69](https://github.com/ciampo/ai-instructions/pull/69) | No-file review delivery and review-only iterative launcher | Pending merge |
| [PR #70](https://github.com/ciampo/ai-instructions/pull/70) | Evaluation fixtures for all distributed skills | Pending merge |
| [PR #71](https://github.com/ciampo/ai-instructions/pull/71) | Immutable, least-privilege CI baseline | Pending merge and CI |

Run the campaign only after recording the resulting `main` revision. Use installed artifacts generated from that exact revision.

### Execution order

1. Run the `review-accessibility` no-artifact case in Codex and Antigravity. Confirm chat delivery and verify that no local file was created or opened.
2. Run the default `iterate-pr-review` launcher without mutation authority. Confirm that it does not edit, commit, push, or update the pull request.
3. Run the preparation-only and publication release boundaries. Confirm that ambiguous publication state stops before any consequential action.
4. Compare direct `review-pr` with `review-coordinator` on one immutable two-lane review. Record findings, false positives, duplicates, wall time, and token use.
5. Run the eight newly added baseline fixture sets in isolated sessions.
6. Run the remaining trigger and output cases. Record each result using the contract above.

Do not fix instruction failures in this evidence pull request. Record the result and open a focused follow-up so the evaluated revision remains immutable.

## Results

No model-backed results are recorded yet. This section remains intentionally empty until the prerequisite changes merge and the target revision is fixed.
