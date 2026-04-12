# Coding Principles

How I think about code. These principles apply across all projects.

## Philosophy

- **Simplicity over abstraction.** Only expose what is needed now. Avoid premature generalization. If the question "is this overengineered?" comes up -- it probably is.
- **Minimal API surface.** Defer features without immediate use cases. Add capabilities only when a concrete consumer exists. "Let's not add X for now -- we'll add it only when needed."
- **Root-cause fixes over patches.** When something breaks, find the real cause. Prefer the structural fix over the workaround.
- **Scope awareness.** Keep the end goal in focus. During feature implementation, it is fine to include related changes in the same PR even if they touch adjacent concerns -- extracting to a separate PR is a decision I will make later if needed.
- **Think before coding.** For non-trivial work, plan the approach before writing code. Understand the problem, identify the moving parts, and outline the strategy. This avoids wasted implementation cycles.

## TypeScript

- Use correct, tight types -- do not leave types loose or resort to `any`. Use generics when they add real value.
- Write code that lets TypeScript infer types naturally. Explicit annotations everywhere is a smell; good code structure makes inference work. Lean on `satisfies`, `as const`, and return type inference.
- Derive types from upstream libraries when possible rather than duplicating definitions.
- Use `@ts-expect-error` for compile-time type tests that document intentionally invalid usage.

## JavaScript

- Write elegant, idiomatic code. Prefer `array.some()`, `Array.from()`, optional chaining, nullish coalescing -- use modern language features naturally.
- Prefer `throw new Error()` (gated to dev mode when appropriate) over `console.warn()` or silent fallbacks. Errors should be concise: `ComponentName: Summary. Detail.`

## CSS

- Use CSS Modules (`.module.css`).
- Use design tokens and CSS custom properties over hardcoded values. Name internal variables to convey intent (self-documenting).
- Prefer modern CSS properties (`translate`, `rotate` over `transform`).
- DRY up shared styles. If a pattern repeats across sibling components, extract it.

## React

- Compound component pattern (`Component.Root`, `Component.Title`) for complex UI.
- React Context for internal component communication.
- Thin wrappers around headless/unstyled primitives. Stay close to the upstream API surface -- easier to maintain, less complex to implement.
- Composition via `render` prop pattern when crossing component boundaries.

## Consistency

- Consistency within a repo matters. Consistency within the same package matters even more. Before implementing something, check whether the same feature or pattern already exists in the codebase and follow it.
- When applying a refactor or fix, actively look for opportunities to apply the same change across the codebase where appropriate. Do not fix something in one place and leave identical instances untouched elsewhere.

## Dependencies

- Clean dependency management. Remove unused dependencies immediately after refactoring.
- Respect package boundaries and layering. Lower-level packages must not depend on higher-level ones.
- **When updating a dependency**, always read its release notes and changelog between the old and new versions. Then:
  - Apply any code changes required by breaking changes.
  - Check for bug fixes that the codebase may have been working around locally -- undo those workarounds.
  - Check for new features and APIs that the codebase could benefit from -- flag them (or adopt them if straightforward).

## Testing

- **Red/green workflow.** When fixing a bug or implementing a feature, write a failing test first that proves the bug exists or the feature is missing. Only then write the code to make the test pass. This ensures every change is backed by a test that would have caught the problem.
- Use semantic queries (`getByRole`, `getByLabelText`) over test IDs. Test what users experience, not implementation details.
- Question unnecessary mocks. If a mock can be avoided by using the real module, prefer that. Ask "are these mocks actually necessary?"
- Type-level tests (`@ts-expect-error`, `satisfies`) for complex prop types and API contracts.
- Test accessibility: roles, ARIA attributes, focus management, keyboard interaction.

## Comments

- Well-written code should be as self-explanatory as possible. Prefer meaningful names that convey intent.
- Do not narrate what the code does. But do leave comments for the important things: trade-offs, constraints, non-obvious reasoning, and context that future maintainers (including LLM agents inspecting the codebase) will benefit from. Good comments are an investment in long-term readability.
- JSDoc on all exported/public APIs. Describe behavior and constraints, not implementation internals.
