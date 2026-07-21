---
name: self-review-pr
description: Review the current pull request independently before marking it ready, using a read-only subagent when available and a fresh-context fallback otherwise.
---

# Self-Review PR

A workflow for reviewing your own PR before marking it ready. Invoked when I say "self-review" or "review before shipping."

The preferred technique is a read-only subagent to reduce confirmation bias. When the host has no subagent capability, perform a clearly identified fresh-context second pass and disclose that limitation.

## Steps

1. Gather context: full diff against the base branch, commit log, CI status, and the PR description.
2. Launch a read-only subagent with the captured context when available. Otherwise, start a fresh review pass without relying on the implementation rationale. Cover correctness, accessibility, consistency, completeness, risks, and suggestions.
3. Use the `draft-review-comment` skill to write `<pr-number>-self-review.md` in the OS temporary directory, with exact file paths and line ranges. Open it when supported; otherwise return the path.
4. Let me decide what to act on.
5. For each accepted finding, fix with a granular commit. Prefer simple, elegant solutions.
6. Run the project's verification suite after all fixes.
