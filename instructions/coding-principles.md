# Coding Principles

How I think about code. These principles apply across all projects.

## Philosophy

- **[RULE]** Simplicity over abstraction. Only expose what is needed now. Avoid premature generalization. If the question "is this overengineered?" comes up -- it probably is.
- **[RULE]** Minimal API surface. Defer features without immediate use cases. Add capabilities only when a concrete consumer exists. "Let's not add X for now -- we'll add it only when needed."
- **[STRONG]** Root-cause fixes over patches. When something breaks, find the real cause. Prefer the structural fix over the workaround.
- **[STRONG]** Scope awareness. Keep the end goal in focus. During feature implementation, it is fine to include related changes in the same PR even if they touch adjacent concerns -- extracting to a separate PR is a decision I will make later if needed.
- **[STRONG]** Think before coding. For non-trivial work, plan the approach before writing code. Understand the problem, identify the moving parts, and outline the strategy. This avoids wasted implementation cycles.
- **[STRONG]** Modern code. Prefer platform-native APIs (especially HTML tags/attributes, CSS properties) over custom JavaScript implementations.
- **[STRONG]** Feature support. Always rely on up-to-date, official data (MDN, caniuse.com) to check support for a given HTML/CSS/JS API. Choose only APIs supported by evergreen browsers, or APIs that are mostly supported and for which a reasonable fallback is available.

## TypeScript

- **[RULE]** Use correct, tight types -- do not leave types loose or resort to `any`. Use generics when they add real value.
- **[STRONG]** Write code that lets TypeScript infer types naturally. Explicit annotations everywhere is a smell; good code structure makes inference work. Lean on `satisfies`, `as const`, and return type inference.
- **[PREFER]** Derive types from upstream libraries when possible rather than duplicating definitions.
- **[PREFER]** Use `@ts-expect-error` for compile-time type tests that document intentionally invalid usage.
- **[STRONG]** Use discriminated unions for modeling states with mutually exclusive properties. Use exhaustive checks (`never` in the default case) to catch unhandled variants at compile time.
- **[PREFER]** Use `const` type parameters and template literal types when they add real expressiveness (e.g., mapping string keys to related types). Do not use them just to be clever.

<details>
<summary>Examples: TypeScript patterns</summary>

Discriminated union with exhaustive check:

```ts
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function renderState( state: AsyncState<User> ) {
  switch ( state.status ) {
    case 'idle':      return null;
    case 'loading':   return <Spinner />;
    case 'success':   return <Profile data={ state.data } />;
    case 'error':     return <ErrorNotice error={ state.error } />;
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}
```

Let inference work -- avoid redundant annotations:

```ts
// Bad: redundant annotation
const isOpen: boolean = someCondition && anotherCondition;

// Good: let TypeScript infer
const isOpen = someCondition && anotherCondition;

// Good: satisfies validates without widening
const config = {
  variant: 'primary',
  size: 'large',
} satisfies ButtonConfig;
```

</details>

## JavaScript

- **[PREFER]** Write elegant, idiomatic code. Prefer `array.some()`, `Array.from()`, optional chaining, nullish coalescing -- use modern language features naturally.
- **[STRONG]** Prefer `throw new Error()` (gated to dev mode when appropriate) over `console.warn()` or silent fallbacks. Errors should be concise: `ComponentName: Summary. Detail.`
- **[STRONG]** Prefer named exports / imports over default exports / imports.

## CSS

- **[RULE]** Use design tokens and CSS custom properties over hardcoded values. Name internal variables to convey intent (self-documenting).
- **[PREFER]** Prefer modern CSS properties (`translate`, `rotate` over `transform`).
- **[STRONG]** DRY up shared styles. If a pattern repeats across sibling components, extract it.
- **[PREFER]** Use CSS layers (`@layer`) when the system supports it, to manage specificity between component styles and composition overrides.
- **[PREFER]** Use container queries for component-level responsive behavior instead of viewport media queries where the component's container size is what matters.

<details>
<summary>Examples: CSS tokens and modern properties</summary>

```css
/* Bad: hardcoded values */
.button {
  padding: 8px 16px;
  color: #1e1e1e;
  background: #f0f0f0;
  border-radius: 4px;
  transform: translateY(-2px);
}

/* Good: tokens and modern properties */
.button {
  --button-bg: var(--ds-color-surface-secondary);
  --button-fg: var(--ds-color-text-primary);

  padding: var(--ds-spacing-sm) var(--ds-spacing-md);
  color: var(--button-fg);
  background: var(--button-bg);
  border-radius: var(--ds-radius-sm);
  translate: 0 -2px;
}
```

</details>

## React

- **[STRONG]** Compound component pattern (`Component.Root`, `Component.Title`) for complex UI.
- **[STRONG]** React Context for internal component communication.
- **[STRONG]** Thin wrappers around headless/unstyled primitives. Stay close to the upstream API surface -- easier to maintain, less complex to implement.
- **[PREFER]** Composition via `render` prop pattern when crossing component boundaries.
- **[STRONG]** Use `forwardRef` on all components that render a DOM element consumers might need to reference. Type the ref precisely (e.g., `HTMLButtonElement`, not `HTMLElement`).
- **[STRONG]** Extract custom hooks when logic is reused across components or when a component's body becomes difficult to follow. A hook should encapsulate a single concern.
- **[PREFER]** Split a component when it handles multiple distinct responsibilities, or when a section of JSX grows complex enough to obscure the overall structure.

<details>
<summary>Examples: Compound component skeleton</summary>

```tsx
import { createContext, forwardRef, useContext, useState } from 'react';
import styles from './tabs.module.css';

type TabsContextValue = { activeTab: string; setActiveTab: ( id: string ) => void };
const TabsContext = createContext< TabsContextValue | undefined >( undefined );

function useTabsContext() {
  const ctx = useContext( TabsContext );
  if ( ! ctx ) {
    throw new Error( 'Tabs: sub-components must be used within Tabs.Root.' );
  }
  return ctx;
}

const Root = forwardRef< HTMLDivElement, React.ComponentProps< 'div' > >(
  ( props, ref ) => {
    const [ activeTab, setActiveTab ] = useState( '' );
    return (
      <TabsContext.Provider value={ { activeTab, setActiveTab } }>
        <div ref={ ref } className={ styles.root } { ...props } />
      </TabsContext.Provider>
    );
  }
);

const Trigger = forwardRef< HTMLButtonElement, { id: string } & React.ComponentProps< 'button' > >(
  ( { id, ...props }, ref ) => {
    const { activeTab, setActiveTab } = useTabsContext();
    return (
      <button
        ref={ ref }
        role="tab"
        aria-selected={ activeTab === id }
        onClick={ () => setActiveTab( id ) }
        { ...props }
      />
    );
  }
);

export const Tabs = { Root, Trigger, /* Panel, List */ };
```

</details>

## Module Organization

- **[STRONG]** Keep files focused. If a file grows beyond ~300-400 lines, consider whether it is doing too much and should be split.
- **[PREFER]** Colocate related code: a component's styles, tests, stories, and types should live near the component, not in distant directories.
- **[PREFER]** Extract shared helpers into a dedicated `utils` or `helpers` file within the same package. Do not export them beyond the package unless there is a clear external consumer.

## Consistency

- **[RULE]** Consistency within a repo matters. Consistency within the same package matters even more. Before implementing something, check whether the same feature or pattern already exists in the codebase and follow it.
- **[STRONG]** When applying a refactor or fix, actively look for opportunities to apply the same change across the codebase where appropriate. Do not fix something in one place and leave identical instances untouched elsewhere.

## Dependencies

- **[STRONG]** Clean dependency management. Remove unused dependencies immediately after refactoring.
- **[RULE]** Respect package boundaries and layering. Lower-level packages must not depend on higher-level ones.
- **[STRONG]** When updating a dependency, always read its release notes and changelog between the old and new versions. Then:
  - Apply any code changes required by breaking changes.
  - Check for bug fixes that the codebase may have been working around locally -- undo those workarounds.
  - Check for new features and APIs that the codebase could benefit from -- flag them (or adopt them if straightforward).

## Testing

- **[STRONG]** Red/green workflow. When fixing a bug or implementing a feature, write a failing test first that proves the bug exists or the feature is missing. Only then write the code to make the test pass. This ensures every change is backed by a test that would have caught the problem.
- **[STRONG]** Use semantic queries (`getByRole`, `getByLabelText`) over test IDs. Test what users experience, not implementation details.
- **[STRONG]** Question unnecessary mocks. If a mock can be avoided by using the real module, prefer that. Ask "are these mocks actually necessary?"
- **[PREFER]** Type-level tests (`@ts-expect-error`, `satisfies`) for complex prop types and API contracts.
- **[RULE]** Test accessibility: roles, ARIA attributes, focus management, keyboard interaction.
- **[PREFER]** For E2E tests (Playwright, Cypress), test user flows end-to-end rather than individual components. Focus on critical paths: navigation, form submission, authentication, core feature workflows.
- **[PREFER]** For visual regression tests, review snapshot diffs carefully. Update snapshots only when the visual change is intentional.

## Comments

- **[STRONG]** Well-written code should be as self-explanatory as possible. Prefer meaningful names that convey intent.
- **[RULE]** Do not narrate what the code does. But do leave comments for the important things: trade-offs, constraints, non-obvious reasoning, and context that future maintainers (including LLM agents inspecting the codebase) will benefit from. Good comments are an investment in long-term readability.
- **[STRONG]** JSDoc on all exported/public APIs. Describe behavior and constraints, not implementation internals.
