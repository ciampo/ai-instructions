---
name: review-documentation
description: Perform a read-only review of documentation, examples, public API docs, migration guidance, and code comments for accuracy, audience fit, maintainability, and concise human-readable writing. Use for documentation review, README, docs, examples, JSDoc, code comments, migration guide, developer experience, or verbose generated prose review. Do not use as a standalone general PR review; review-pr may invoke this skill as a targeted specialist pass. Never edit source, commit, or write remotely.
---

# Review Documentation

Review whether written guidance helps its intended reader complete a real task without unsupported claims, duplicated implementation narration, or unnecessary prose.

## Authority and scope

- Keep the review read-only. Inspect the changed documentation, code and behavior it describes, surrounding conventions, examples, generated sources, and stated audience.
- Treat repository terminology, public documentation policy, and source behavior as authoritative. Do not substitute personal style preferences for a documented requirement.
- Do not modify prose, generated documents, comments, source, or remote state.

## Review method

1. **Identify the reader and task**: Determine whether the text serves users, integrators, maintainers, translators, or contributors, and what decision or action it must support.
2. **Verify claims against behavior**: Check commands, APIs, defaults, examples, links, prerequisites, migration steps, and limitations against the scoped source and authoritative documentation.
3. **Check information architecture**: Look for omitted prerequisites, unsafe ordering, buried consequences, duplicate sources of truth, stale examples, and documentation that cannot be maintained with the code.
4. **Review examples and comments**: Examples must be runnable or clearly illustrative. Comments should explain a constraint, rationale, or non-obvious behavior; do not preserve comments that merely restate nearby code.
5. **Remove observable verbosity**: Flag prose only when it repeats itself, hides the action or constraint, adds unsupported certainty, or makes the reader work harder than a shorter accurate alternative. Do not label text as AI-generated or impose a tone preference.
6. **Recommend a focused revision**: State the reader consequence, evidence, and smallest correction. Prefer removing or consolidating text over adding boilerplate.

## Output contract

When `review-pr` or `review-coordinator` invokes this skill, return an internal handoff with confirmed findings, verification gaps, and an explicit no-findings result when applicable. Do not create a separate review artifact.

For direct use, `chat only` and `no artifact` select chat delivery. `do not write files` and `do not modify files` prohibit every local file write and also require chat delivery. In either chat mode, return the findings in chat and do not create or open a local file. Otherwise, write one portable Markdown artifact in the OS temporary directory. A documentation finding must identify an incorrect, missing, unsafe, stale, or demonstrably obstructive statement and its reader impact. A subjective preference about concise writing without a reader consequence is not a finding.

## Completion criteria

- Claims and examples are checked against the scoped implementation or primary source.
- Comments and prose are assessed by reader value, not presumed authorship.
- Findings are concrete and actionable; stylistic preference stays out of the report.
- Source and remote state remain unchanged.
