# Skill: Self-Review PR

<!-- routing: [STRONG] Reviewing your own PR before marking it ready -->

**[STRONG]** This skill should be used before marking any PR as ready for review.

A workflow for reviewing your own PR before marking it ready. Invoked when I say "self-review" or "review before shipping."

The key technique: delegate the review to a **readonly subagent** to reduce confirmation bias. The agent that wrote the code should not be the one reviewing it.

## Dependencies

**[RULE]** Read each of these files before proceeding. Do not skip this section.

- `instructions/code-review.md`
- `instructions/accessibility.md`
- `instructions/coding-principles.md`

**[RULE]** Chain into this skill when presenting findings:

- `skills/draft-review-comment.md`

## Steps

1. Gather context: full diff against the base branch, commit log, CI status, and the PR description.
2. Launch a readonly subagent with the captured context. Ask it to perform a structured review covering: summary, correctness, consistency with codebase patterns, completeness (missing tests, docs, changelog), risks, and suggestions.
3. Write the subagent's review to a markdown document in the OS temporary directory, following the `draft-review-comment` skill: a brief summary plus individual comment sections (one per finding), each referencing the exact file path and line range. The file is named `<pr-number>-self-review.md` and opened in the editor — nothing is printed inline in the chat beyond a one-line confirmation. Findings are ready to post if the PR is being reviewed by others, or serve as a structured checklist for self-fixes.
4. Let me decide what to act on.
5. For each accepted finding, fix with a granular commit. Prefer simple, elegant solutions.
6. Run the project's verification suite after all fixes.
