---
name: review-accessibility
description: Perform a read-only, source-verified accessibility review of an interface, component, interaction, or UI-focused change. Use for explicit accessibility, WCAG, ARIA, keyboard, focus, screen-reader, contrast, reflow, motion, or pointer-target audits. Do not use as a standalone general PR review, implementation work, or non-UI content unless accessibility review is specifically requested; `review-pr` may invoke this skill as a targeted specialist pass. Never edit source, commit, or write remotely.
---

# Review Accessibility

Review the scoped user experience deeply enough to find material accessibility risks while keeping conclusions tied to observable behavior and current primary sources.

## Authority and scope

- Keep the review read-only. Reading source, consumers, tests, rendered behavior, and public standards is allowed.
- Do not modify repository source, snapshots, configuration, or generated files. Do not commit, push, post a review, resolve threads, or update pull-request metadata.
- A local Markdown review artifact is an allowed output of the requested review. Use chat snippets only when the user explicitly requests them.
- If the request asks for both review and implementation, finish and report the review first, then use an implementation workflow under that separate authority.

## Review method

1. **Define the review surface**: Identify the interface, affected behavior, target browsers and assistive technologies, and whether the request covers a diff or the whole component. For a diff, inspect the full modified files and relevant consumers rather than reviewing isolated hunks.
2. **Identify the actual pattern**: Prefer native HTML semantics. When ARIA is involved, classify the exact widget or structure before applying keyboard, focus, naming, state, or relationship requirements.
3. **Reproduce or inspect behavior**: Use the strongest evidence available for the risk: rendered browser behavior, accessibility-tree output, keyboard navigation, computed styles, source and types, or focused tests. Do not infer a failure from markup alone when runtime composition can change the result. Treat behavior that is merely absent from a partial snippet as a verification gap, not a finding, unless the available source proves no other layer can provide it.
4. **Check only relevant dimensions**: Review accessible names and descriptions, roles and states, keyboard operation, focus entry and return, reading and tab order, live announcements, zoom and reflow, contrast and forced colors, motion, pointer targets and gestures, and error or status communication where they apply.
5. **Verify current sources**: Look up the applicable section instead of relying on memory. Use [HTML](https://html.spec.whatwg.org/) for native semantics, [WAI-ARIA](https://www.w3.org/TR/wai-aria-1.2/) for roles and properties, the [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) for design patterns and keyboard guidance, and [WCAG 2.2](https://www.w3.org/TR/WCAG22/) for conformance requirements. Distinguish normative requirements, APG guidance, cross-browser reliability techniques, and optional enhancements.
6. **Investigate uncertainty privately**: Trace consumers, inspect sibling patterns, and test plausible edge cases before reporting. Raise an unresolved possible issue only when the risk is material, the uncertainty cannot reasonably be resolved, and the author is better positioned to verify it.
7. **Assign severity from impact and likelihood**: Do not make an issue critical merely because it concerns accessibility. State the affected users, failure mode, and practical consequence.
8. **Recommend the smallest correct direction**: Explain the expected behavior and a concrete remediation direction without implementing it. Preserve the target repository's public contracts and established accessible patterns.

## Output contract

When `review-pr` invokes this skill for its own review, return the scoped findings and verification gaps to that workflow as an internal handoff. Do not create a Markdown artifact or return a user-facing path; `review-pr` owns the single synthesized deliverable.

By default, write one portable Markdown artifact in the OS temporary directory and return its path. When the user explicitly requests chat delivery, return only the requested finding or findings in chat.

Structure a full review as:

- a short scope and overall assessment;
- findings ordered by severity;
- verification gaps or blocked checks;
- a no-findings statement when the reviewed evidence exposes no material issue.

For each finding include:

- `[critical]`, `[major]`, `[minor]`, or `[nit]` based on concrete impact and likelihood;
- the affected user and observable consequence;
- the exact file and line range for an inline issue, the file for a file-level issue, or no fabricated location for a general issue;
- the evidence that establishes the failure;
- the applicable primary-source link and whether it is a requirement, pattern, or recommendation;
- a concise remediation direction and a way to verify it.

Do not pad the output with generic checklists, low-impact speculation, or restatements of code that already works.
Limit findings to failures established by the available evidence. Put unobserved runtime behavior under verification gaps with the exact check still needed.

## Completion criteria

- The requested surface and meaningful consumers were inspected.
- Every material claim is supported by behavior and a current primary source.
- Requirements are separated from best practices and reliability techniques.
- The review contains only actionable, non-duplicate findings, or explicitly reports no findings.
- Source and remote state remain unchanged.
