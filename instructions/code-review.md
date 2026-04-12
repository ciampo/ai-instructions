# Code Review

How I review PRs, and how I expect AI to assist with reviews.

## Process

- Multi-round by default. A single review pass is rarely sufficient. Expect 2-3 rounds, each building on previous feedback.
- Read the full diff, all modified source files, and their consumers before forming opinions.
- Cross-reference against how other components/modules in the same codebase handle the same problem. Consistency is a first-class concern.
- Validate claims independently. Do not take PR descriptions at face value. Read the code and verify.

## Output Format

- Structured: Summary, Issues Found (numbered), Suggestions.
- Output as portable markdown. Never post directly to GitHub unless asked.
- When drafting comments for GitHub, follow the writing style and tone defined in `interaction-preferences.md` (GitHub comment writing style section).

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

- Always consider how changes affect downstream consumers (plugin/theme developers, external integrators) who depend on these APIs.
