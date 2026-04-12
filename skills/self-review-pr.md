# Skill: Self-Review PR

A workflow for reviewing your own PR before marking it ready. Invoked when I say "self-review" or "review before shipping."

The key technique: delegate the review to a **readonly subagent** to reduce confirmation bias. The agent that wrote the code should not be the one reviewing it.

## Steps

1. Gather context: full diff against the base branch, commit log, CI status, and the PR description.
2. Launch a readonly subagent with the captured context. Ask it to perform a structured review covering: summary, correctness, consistency with codebase patterns, completeness (missing tests, docs, changelog), risks, and suggestions.
3. Present the subagent's review to me before making any changes. Let me decide what to act on.
4. For each accepted finding, fix with a granular commit. Prefer simple, elegant solutions.
5. Run the project's verification suite after all fixes.
