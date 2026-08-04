---
name: investigate-debug
description: Diagnose a reported error or regression read-only by default, or implement and verify a root-cause fix when explicitly requested. Use for debugging requests, unexplained failures, and requests to fix a reproduced defect; do not infer commit or remote-write authority.
---

# Investigate / Debug

A structured workflow for debugging issues. Invoked when I say "debug this", "investigate why X", "this is broken", or share an error message.

## Authority

Treat investigation, explanation, and diagnosis as read-only. Use non-mutating checks in the user's checkout, and isolate any necessary experimental state in a disposable environment. Modify local source, tests, dependencies, caches, or checkout state only when the user asks to fix or implement the solution. A fix request does not authorize a commit, push, pull request, or other remote write.

## Steps

1. **Understand the symptom**: Read the error message, stack trace, or description carefully. Identify the exact failure: what is expected vs. what is happening. Ask clarifying questions if the symptom is ambiguous.
2. **Start simple**: Before diving deep, check the mundane causes:
   - Is the dev server running? Does it need a restart?
   - Are dependencies installed using the repository's package manager? Is the lockfile up to date?
   - Could a stale build or cache explain the symptom? Inspect its state, but clear or regenerate it only when local changes were authorized.
   - Are environment variables set correctly?
3. **Reproduce**: Confirm you can reproduce the issue. If it is intermittent, note the conditions under which it occurs.
4. **Isolate**: Narrow down the cause:
   - Inspect recent changes that could have introduced the issue.
   - Trace or inspect suspect sections without editing them. When implementation was requested, a temporary local bypass may help isolate the failing part.
   - Use history bisection for regressions with unclear origins, but only in a disposable checkout unless changing the current checkout was authorized.
   - Compare against the main-branch ref without switching the user's checkout (regression vs. pre-existing).
5. **Form a hypothesis**: Based on isolation, propose a specific cause. State it explicitly: "I believe the issue is X because Y."
6. **Verify the hypothesis**: For diagnosis-only work, use an existing check or an external disposable reproduction that does not modify the repository. When implementation was requested, write a minimal failing test or check before writing the fix. Do not jump to fixing based on a guess.
7. **Stop or fix according to the request**: For diagnosis-only requests, stop with the evidence-backed cause, remaining uncertainty, and a proposed fix. When implementation was requested, apply the root-cause fix, not a workaround, and keep it minimal and focused.
8. **Add a regression test for an implemented fix**: Write a test that would have caught the bug. Verify it fails without the fix and passes with it.
9. **Verify implemented work**: Run the project's relevant verification suite. Confirm the original symptom is resolved and no new issues were introduced.
10. **Report**: State the diagnosis, whether files changed, verification, and any remaining uncertainty. If the investigation hits a dead end, describe what was tried and ruled out instead of iterating silently on broken approaches.
