# Code Review

How I review PRs, and how I expect AI to assist with reviews.

## Process

- **[STRONG]** Multi-round by default. A single review pass is rarely sufficient. Expect 2-3 rounds, each building on previous feedback.
- **[RULE]** Read the full diff, all modified source files, and their consumers before forming opinions.
- **[STRONG]** Cross-reference against how other components/modules in the same codebase handle the same problem. Consistency is a first-class concern.
- **[RULE]** Validate claims independently. Do not take PR descriptions at face value. Read the code and verify.

## Severity Labels

Use these consistently in review output:

- **critical** — Must be fixed before merge. Correctness bugs, a11y violations, security issues, data loss risks.
- **major** — Should be fixed before merge. Consistency violations, missing tests for new behavior, API design concerns.
- **minor** — Worth addressing but not blocking. Naming improvements, small simplifications, minor doc gaps.
- **nit** — Trivial or stylistic. Take it or leave it. Import ordering, slightly better variable name, etc.

## Output Format

- Structured: Summary, Issues Found (numbered with severity), Suggestions.
- Output as portable markdown. Never post directly to GitHub unless asked.
- When drafting comments for GitHub, follow the writing style and tone defined in `interaction-preferences.md` (GitHub comment writing style section).

## Uncertain Findings

- When you suspect something is wrong but cannot confirm, flag it as **"Possible issue"** with your reasoning. Ask the author to verify rather than stating it as a definitive problem.
- Do not suppress uncertain findings entirely -- surface them with appropriate hedging.

## Do NOT Flag

To avoid noise, do not raise comments on:

- Pure stylistic preferences that have no functional impact and no existing convention either way.
- Import ordering (unless the project has an explicit sorting config).
- Minor whitespace or formatting differences handled by automated formatters.
- Choices that are clearly intentional and well-reasoned, even if you would have done it differently.

## Review Priorities (in order)

1. **Accessibility**: ARIA patterns, focus management, screen reader behavior, `forced-colors` / high-contrast mode, semantic HTML.
2. **Consistency**: Does this follow established patterns across sibling modules and the broader codebase?
3. **API correctness**: Is the API surface minimal and aligned with upstream/conventions? Are types precise and expressive?
4. **Test adequacy**: Do tests exist? Do they test the right behavior? Would they fail on the bug they claim to fix? Would they pass against the previous (broken) code?
5. **Blast radius**: What else in the codebase consumes the modified API/utility? Are those consumers affected?
6. **Build/dependency correctness**: Missing or unused deps, `sideEffects` config, tree-shaking implications, CSS module vs global CSS distinctions.
7. **Documentation**: CHANGELOGs, JSDoc, README updates, Storybook stories.
8. **Scope discipline**: Are there unrelated changes that should be in separate PRs?

## Third-Party Impact

- **[STRONG]** Always consider how changes affect downstream consumers (plugin/theme developers, external integrators) who depend on these APIs.
