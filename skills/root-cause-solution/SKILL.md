---
name: root-cause-solution
description: Compare materially different solutions for a nontrivial bug or feature before recommending or implementing one. Use when a proposed fix may put behavior in the wrong owner, depend on hidden conditions, or conflict with a governing contract. Diagnosis alone, routine edits, and general PR reviews belong to their existing workflows.
---

# Root-cause solution

Treat a proposed fix as a candidate, including one suggested by the user. Preserve the requested outcome and explicit constraints. Use this workflow when choosing the mechanism matters; do not manufacture alternatives for a routine edit with one established solution.

## Scope and authority

An assessment or recommendation is read-only. Keep experimental state in a disposable workspace. Implement only when requested, and preserve any narrower authority from the parent workflow. This skill grants no commit, push, publication, or remote-write authority.

Use the existing debugging workflow to establish an unexplained failure. Use this skill to decide between solutions once there is enough evidence to compare them. Keep the reasoning proportionate to the decision.

## Establish the contract

Define the required observable behavior before choosing a mechanism. Use explicit requirements, documented APIs, applicable standards, supported platform behavior, and consumers. Existing precedent is evidence; verify that it governs this task before treating it as a requirement.

- State what happens, when it happens, and under which conditions.
- Identify what callers can rely on, including supported ways to override, cancel, or compose the behavior.
- Separate verified requirements from assumptions and unresolved choices.

Trace the events, calls, state changes, and owners that produce the current result. Identify the divergence from the contract and verify the causal explanation. An observed mismatch locates the problem but does not, by itself, establish its cause.

Distinguish intended behavior from implementation side effects. Check consumers before changing either. A behavior being incidental does not make it safe to break if callers rely on it or the public contract preserves it.

## Compare different mechanisms

For a material design choice, consider a local adjustment, moving responsibility to the correct owner or time, and removing or delegating the behavior to an existing mechanism. Include the suggested fix. Use distinct approaches rather than cosmetic variants, and explain when an approach is inapplicable. Do not require a fixed candidate count or numerical scores.

Ask where this behavior would belong if implemented directly from the contract. Check whether guards, delays, precedence rules, or overrides remove the cause or merely hide the conflict. Timing changes can be valid when timing is part of the contract; prove that relationship.

Compare candidates against the scenarios that could decide the choice:

- The reported case and the default behavior that must still work.
- Relevant callers and entry points, including cancellation, overrides, and composition.
- Material boundary conditions such as re-entry, concurrency, failure, empty inputs, or changed prior state.
- Supported environments and versions where the candidates may differ.

A compact candidate-by-scenario table can help. Label each result as observed, source-supported, or unverified. Keep unverified scenarios visible as open questions rather than silently dropping them from the decision.

Choose a candidate that satisfies the governing contract and supported scope. Among equally correct candidates, prefer fewer special cases and direct mechanisms. Account for compatibility, migration cost, and reversibility. A smaller diff does not justify a known correctness defect; a theoretical model does not justify breaking an existing public contract.

## Resolve deciding uncertainty

When an uncertain fact changes the recommendation, verify it with the narrowest useful check. Use source and existing tests for facts they can establish. For browser, OS, device, or runtime behavior, read [environment evidence](references/environment-evidence.md).

Check that the reproduction exercises the suspected cause. List likely deciding conditions, including inputs, prior state, settings, versions, and how the action was triggered. Vary relevant conditions while keeping other conditions fixed. Do not require exhaustive variation of every value.

Record which tested conditions affect the result and which variations leave it unchanged. Do not infer independence from one unchanged result. State the conditions under which the conclusion holds. A solution must preserve a required condition or define what happens without it.

If a deciding fact remains unavailable, state the blocked conclusion and the next useful check. Continue independent work within the authorized scope. Do not present a hypothetical fix as verified.

## Verify authorized implementation

Establish a failing regression test or equivalent reproduction before fixing a bug or adding behavior. Cover the scenarios where plausible candidates differ, and run the repository's relevant checks. Prefer behavior tests over tests that mirror the chosen implementation.

Do not remove a workaround solely because it is redundant in one tested environment. Check the supported range and affected consumers first. When evidence is incomplete, preserve the required compatibility or flag the decision for the user.

## Explain the recommendation

Lead with the recommended change, then give only the evidence needed to assess it:

- The governing behavior and the verified cause or feature requirement.
- Why the chosen approach meets it and why material alternatives fail or cost more.
- Conditions the solution depends on, verification performed, and remaining uncertainty.
- Behavior changes, compatibility costs, and any decision that still needs user input.

Include a table, code, or a longer explanation only when it helps the user act. For a plausible unverified edge case, name when it matters and how to check it. Offer a contingent approach if useful, clearly labeled as unverified. Do not require ready-to-apply fallback code or testing outside the requested scope.
