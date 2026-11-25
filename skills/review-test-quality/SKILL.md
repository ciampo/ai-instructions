---
name: review-test-quality
description: Review test and verification quality read-only, including user-observable UI behavior, semantic queries, regression coverage, realistic failures, and mock limits. Use directly only for focused test-strategy, test-quality, behavioral-testing, UI-test, verification, regression-test, or implementation-detail testing requests. General, panel, coordinated, and multi-lane PR reviews start with review-pr, which may delegate this specialist.
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
4. Assess new and existing tests directly related to the change, including relevant failure paths, boundaries, and state transitions. Identify the distinct failure each can catch in its environment and check whether a mock hides it. When deciding whether a dependency covers delegated behavior, inspect its relevant tests for the code in use. Identify what can still break in the caller, such as choosing the wrong option or mishandling a result. Treat unavailable coverage as unknown.
5. **Check test independence and signal**: Look for order dependence, shared state, overbroad snapshots, false-positive assertions, non-determinism, and assertions that would pass if the regression returned.
6. Recommend adding or adapting a test only for a specific gap, at the level that owns the behavior and can expose the failure. Recommend consolidation or removal when a test duplicates verified coverage, protects obsolete behavior, or served only to explore the change. Preserve repository-required tests and unique regression coverage. Sufficient coverage can warrant no new test.

## Output contract

When `review-pr` invokes this skill, return an internal handoff with confirmed findings, verification gaps, and an explicit no-findings result when applicable. Do not create a separate review artifact.

For direct use, `chat only` and `no artifact` select chat delivery. `do not write files` and `do not modify files` prohibit every local file write and also require chat delivery. In either chat mode, return the findings in chat and do not create or open a local file. Otherwise, write one portable Markdown artifact in the OS temporary directory. For a coverage gap, name the regression the suite could miss. For a redundant test, cite the assertion and environment that already cover its behavior. Missing runtime, browser, or integration evidence belongs under verification gaps when the source does not establish a defect.

## Completion criteria

- Assertions are evaluated against observable behavior and repository conventions.
- UI guidance distinguishes semantic tests from an accessibility audit.
- Each recommendation explains what coverage is missing or why the remaining tests are sufficient.
- Source and remote state remain unchanged.
