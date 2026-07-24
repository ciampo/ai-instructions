---
name: review-test-quality
description: Perform a read-only review of test and verification quality for a change, including user-observable UI behavior, semantic queries, regression coverage, realistic failure paths, and the limits of mocks. Use for test strategy, test quality, behavioral testing, UI test, verification, regression-test, or implementation-detail testing review. Never edit source, commit, or write remotely.
---

# Review Test Quality

Review whether the available evidence establishes the changed behavior from the user's or consumer's point of view, not merely that the implementation executes.

## Authority and scope

- Keep the review read-only. Inspect the pinned change, tests, test helpers, user-facing consumers, existing test conventions, and relevant runtime or CI evidence.
- Do not require a testing framework or test layer that the repository does not support. Treat the project's testing strategy and risk tolerance as authoritative.
- Do not modify tests, fixtures, snapshots, source, CI configuration, or remote state.

## Review method

1. **State the observable contract**: Identify the changed user, consumer, or system outcome; the regression it prevents; and the failure or edge paths that matter.
2. **Trace tests to behavior**: Check that assertions exercise the public behavior rather than private functions, component internals, incidental markup, implementation-specific calls, or snapshots that do not establish the claim.
3. **Review UI tests semantically**: Prefer accessible roles, names, labels, values, and user interactions. Use test IDs only when no stable semantic query represents the intended interaction. Do not mistake a testing-library query for proof of accessible runtime behavior; route that question to `review-accessibility`.
4. **Assess coverage quality**: Inspect representative success, failure, boundary, state-transition, and integration paths. Check whether mocks preserve the contract and whether they hide the behavior the change is meant to prove.
5. **Check test independence and signal**: Look for order dependence, shared state, overbroad snapshots, false-positive assertions, non-determinism, and assertions that would pass if the regression returned.
6. **Recommend the smallest behavioral proof**: Describe the missing observable behavior, why the existing evidence is insufficient, and the focused test or verification that would establish it.

## Output contract

When `review-pr` or `review-coordinator` invokes this skill, return an internal handoff with confirmed findings, verification gaps, and an explicit no-findings result when applicable. Do not create a separate review artifact.

For direct use, write one portable Markdown artifact in the OS temporary directory unless chat delivery is explicitly requested. A test-quality finding must name a concrete changed behavior and explain why the existing test could pass while that behavior regresses. Missing runtime, browser, or integration evidence belongs under verification gaps when the source does not establish a defect.

## Completion criteria

- Assertions are evaluated against observable behavior and repository conventions.
- UI guidance distinguishes semantic tests from an accessibility audit.
- Findings identify a concrete regression escape.
- Source and remote state remain unchanged.
