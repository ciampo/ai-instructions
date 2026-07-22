# Code Review Reference

How I review PRs, and how I expect AI to assist with reviews.

## Process

- **[STRONG]** Support additional review rounds when the PR head changes or the user requests follow-up. Do not require multiple passes when one complete pass resolves the scoped review.
- **[RULE]** Read the full diff, all modified source files, and their consumers before forming opinions.
- **[STRONG]** Cross-reference against how other components/modules in the same codebase handle the same problem. Consistency is a first-class concern.
- **[RULE]** Validate claims independently. Do not take PR descriptions at face value. Read the code and verify.

## Severity Labels

Use these consistently in review output:

- **[critical]** — Must be fixed before merge because the concrete impact and likelihood are severe, such as an exploitable security flaw, data loss, or a blocking correctness or accessibility failure.
- **[major]** — Should be fixed before merge because the issue materially affects users, consumers, correctness, accessibility, or maintainability.
- **[minor]** — Worth addressing but not blocking. Naming improvements, small simplifications, minor doc gaps.
- **[nit]** — Trivial or stylistic. Take it or leave it. Import ordering, slightly better variable name, etc.

## Output Format

- Structured: Summary, Issues Found (numbered with severity), Suggestions.
- Output as portable markdown. Never post directly to GitHub unless asked.
- When drafting comments for GitHub, keep them concise, collaborative, actionable, and self-contained. Put extended detail in `<details>` when useful.

## Uncertain Findings

- Investigate suspected issues privately and use available source, consumer, test, and specification evidence before reporting them.
- Report a **"Possible issue"** only when the unresolved risk is material, the uncertainty cannot reasonably be resolved during review, and the author is better positioned to verify it. Do not surface low-impact speculation merely to avoid suppressing a thought.

<details>
<summary>Examples: review comment quality</summary>

Good review comment (actionable, specific, references the code):

> **[major]** The `onClose` callback is not called when the user presses Escape (`dialog.tsx:42`). The `Dialog` component in the same package handles this via `onKeyDown` -- this should match that pattern.

Noisy comment (vague, opinion-based, no impact):

> **[nit]** I would name this variable differently.

Uncertain finding (hedged, asks for verification):

> **[Possible issue]** I'm not certain, but it looks like `ref` might be null when `useEffect` runs on first render (`tooltip.tsx:28`). Could you verify whether the ref is guaranteed to be attached by that point?

</details>

## Do NOT Flag

To avoid noise, do not raise comments on:

- Pure stylistic preferences that have no functional impact and no existing convention either way.
- Import ordering (unless the project has an explicit sorting config).
- Minor whitespace or formatting differences handled by automated formatters.
- Choices that are clearly intentional and well-reasoned, unless there's an objectively better way of implementing them.

## Review Priorities (in order)

1. **Accessibility**: semantic HTML, accessible names, keyboard behavior, focus management, announcements, contrast, motion, zoom, and pointer targets. Use `review-accessibility` for the deeper method when UI or interaction changes make this domain material.
2. **Consistency**: Does this follow established patterns across sibling modules and the broader codebase?
3. **API correctness**: Is the API surface minimal and aligned with upstream/conventions? Are types precise and expressive? Use `review-api-design` when a public API is added or materially changed.
4. **Test adequacy**: Do tests exist? Do they test the right behavior? Would they fail on the bug they claim to fix? Would they pass against the previous (broken) code?
5. **Blast radius**: What else in the codebase consumes the modified API/utility? Are those consumers affected?
6. **Build, dependency, and performance correctness**: Missing or unused dependencies, `sideEffects` configuration, tree-shaking implications, critical-path loading, repeated runtime work, and CSS module versus global CSS distinctions. Use `review-performance` only when bundle, runtime, rendering, layout, or scale risks are material.
7. **Documentation**: CHANGELOGs, JSDoc, README updates, Storybook stories.
8. **Scope discipline**: Are there unrelated changes that should be in separate PRs?

Specialist skills deepen a relevant domain; they do not replace the complete core review. The main workflow verifies and deduplicates their findings before delivery.

## Third-Party Impact

- **[STRONG]** Always consider how changes affect downstream consumers (plugin/theme developers, external integrators) who depend on these APIs.
