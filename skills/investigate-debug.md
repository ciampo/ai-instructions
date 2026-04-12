# Skill: Investigate / Debug

A structured workflow for debugging issues. Invoked when I say "debug this", "investigate why X", "this is broken", or share an error message.

## Dependencies

Load these instruction files before executing this skill:

- `instructions/interaction-preferences.md`
- `instructions/coding-principles.md`

## Steps

1. **Understand the symptom**: Read the error message, stack trace, or description carefully. Identify the exact failure: what is expected vs. what is happening. Ask clarifying questions if the symptom is ambiguous.
2. **Start simple**: Before diving deep, check the mundane causes:
   - Is the dev server running? Does it need a restart?
   - Are dependencies installed (`npm install`)? Is the lockfile up to date?
   - Is there a stale build? Try `npm run build` or clearing the cache.
   - Are environment variables set correctly?
3. **Reproduce**: Confirm you can reproduce the issue. If it is intermittent, note the conditions under which it occurs.
4. **Isolate**: Narrow down the cause:
   - Check `git log` for recent changes that could have introduced the issue.
   - Comment out or bypass sections of code to isolate the failing part.
   - Use binary search (git bisect or manual) for regressions with unclear origin.
   - Check whether the issue exists on the main branch (regression vs. pre-existing).
5. **Form a hypothesis**: Based on isolation, propose a specific cause. State it explicitly: "I believe the issue is X because Y."
6. **Verify the hypothesis**: Write a minimal test or check that confirms the root cause before writing the fix. Do not jump to fixing based on a guess.
7. **Fix**: Apply the root-cause fix, not a workaround. Keep the fix minimal and focused.
8. **Add a regression test**: Write a test that would have caught this bug. Verify it fails without the fix and passes with it.
9. **Verify**: Run the project's verification suite. Confirm the original symptom is resolved and no new issues were introduced.
10. **Report**: If the debugging process hits a dead end, say so. Describe what was tried, what was ruled out, and what remains uncertain. Do not keep iterating silently on broken approaches.
