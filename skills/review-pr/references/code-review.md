# Code Review Reference

How I review PRs, and how I expect AI to assist with reviews.

## Process

- **[STRONG]** Support additional review rounds when the PR head changes or the user requests follow-up. Do not require multiple passes when one complete pass resolves the scoped review.
- **[RULE]** Read the full diff, all modified source files, and their consumers before forming opinions.
- **[STRONG]** Cross-reference against how other components/modules in the same codebase handle the same problem. Consistency is a first-class concern.
- **[RULE]** Validate claims independently. Do not take PR descriptions at face value. Read the code and verify.

## Severity Normalization Contract

Normalize every confirmed finding by concrete impact, affected scope, reachability or likelihood, and recovery or reversibility. The same evidence must receive the same severity regardless of whether the core review, a direct specialist, or the coordinator found it. Treat specialist labels as candidate input, not authority.

- **[critical]** — Must block merge because a reachable failure causes severe or hard-to-recover harm. Examples include an authorization bypass that permits destructive cross-account actions, sensitive-data exposure, unrecoverable data loss, or a broadly blocked core path.
- **[major]** — Must block merge because the issue materially breaks correctness, accessibility, compatibility, or a supported user or consumer workflow without reaching critical impact. This includes losing persisted user state during a supported upgrade.
- **[minor]** — Non-blocking, limited, and recoverable impact, or a narrow maintainability, documentation, or test gap that does not establish a material behavior regression.
- **[nit]** — Optional style or polish with no behavioral or contract impact.

Missing evidence is a verification gap, not a reason to lower a confirmed finding's severity. After deduplication, normalize from the retained evidence again instead of preserving the loudest, quietest, or majority label.

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
3. **Simplicity**: Does the outcome require all of the new state, branches, wrappers, dependencies, and abstractions? Always use `review-simplicity` for a dedicated deletion-first baseline pass.
4. **API correctness**: Is the API surface minimal and aligned with upstream/conventions? Are types precise and expressive? Use `review-api-design` when a public API is added or materially changed.
5. **Test adequacy**: Do tests exist? Do they test the right behavior? Would they fail on the bug they claim to fix? Would they pass against the previous (broken) code?
6. **Blast radius**: What else in the codebase consumes the modified API/utility? Are those consumers affected?
7. **Build, dependency, and performance correctness**: Missing or unused dependencies, `sideEffects` configuration, tree-shaking implications, critical-path loading, repeated runtime work, and CSS module versus global CSS distinctions. Use `review-performance` only when bundle, runtime, rendering, layout, or scale risks are material.
8. **Documentation**: CHANGELOGs, JSDoc, README updates, Storybook stories.
9. **Scope discipline**: Are there unrelated changes that should be in separate PRs?

Specialist skills deepen a relevant domain; they do not replace the complete core review. The main workflow verifies and deduplicates their findings before delivery.

## Third-Party Impact

- **[STRONG]** Always consider how changes affect downstream consumers (plugin/theme developers, external integrators) who depend on these APIs.
