# Design System Components

Patterns for building and maintaining a design system component library. Generalized from my work but applicable to any component library wrapping headless primitives.

## Architecture

- **[RULE]** Stay close to the upstream API surface. Do not re-invent props that the primitive already exposes. Deviations need justification.
- **[STRONG]** Compound component pattern: `Component.Root`, `Component.Header`, `Component.Content`, etc.
- **[STRONG]** Use React Context for internal communication between sub-components (e.g., sharing IDs, state).
- **[STRONG]** Private exports for internally shared utilities. Public API surface should be minimal.

## Polymorphic Rendering

- **[STRONG]** Use the `render` prop pattern (or equivalent like Ariakit's `render` / Radix's `asChild`) for component composition. This allows consumers to control the rendered element while the component provides behavior.
- **[STRONG]** When exposing `render` props, ensure `ref` forwarding works correctly. The component's internal ref and the consumer's ref must be merged.
- **[PREFER]** Type polymorphic props precisely. The rendered element's props should be available on the component (e.g., if rendering as `<a>`, `href` should be valid).

## Styling

- **[RULE]** All visual values from design tokens (CSS custom properties). No hardcoded colors, spacing, typography, or radii.
- **[STRONG]** Typography through a shared `Text` component with semantic variants, not raw CSS font properties.
- **[PREFER]** CSS layer organization when the system supports it (component styles vs composition styles).

## Theming and Tokens

- **[STRONG]** Tokens are structured in layers: global primitives (colors, scales) -> semantic tokens (foreground, background, border) -> component-scoped tokens (button-bg, input-border).
- **[STRONG]** Dark mode and other themes override semantic tokens, not component styles. Components should not need conditional logic for theming.
- **[PREFER]** Expose component-scoped custom properties for controlled customization, rather than relying on consumers overriding internal class names.

<details>
<summary>Example: Token layers and theming</summary>

```css
/* Global primitives (design-tokens.css) */
:root {
  --color-gray-50: #fafafa;
  --color-gray-900: #1a1a1a;
  --spacing-4: 4px;
  --spacing-8: 8px;
}

/* Semantic tokens (theme-light.css) */
:root {
  --ds-color-text-primary: var(--color-gray-900);
  --ds-color-surface-primary: var(--color-gray-50);
}

/* Dark mode overrides semantic tokens, not components */
:root[data-theme='dark'] {
  --ds-color-text-primary: var(--color-gray-50);
  --ds-color-surface-primary: var(--color-gray-900);
}

/* Component uses semantic tokens -- works in any theme automatically */
.button {
  --button-bg: var(--ds-color-surface-primary);
  color: var(--ds-color-text-primary);
  background: var(--button-bg);
  padding: var(--spacing-4) var(--spacing-8);
}
```

</details>

## Storybook

- **[STRONG]** Each component gets stories with working interactive examples.
- **[STRONG]** JSDoc on the root component provides the Storybook description automatically -- do not duplicate.
- **[PREFER]** For props accepting ReactElement or ReactNode, show a custom control accepting strings of text.
- **[PREFER]** For props with complex types (eg objects), either disable the control or provide a custom choice across a prepared list of viable options.
- **[PREFER]** Disable irrelevant controls for specific stories. Prefer systematic disabling over one-by-one exclusion.
- **[PREFER]** Stories should use `args`/`controls` properly, thus linking them to Storybook controls.

## Testing

- **[STRONG]** Unit tests with React Testing Library. Use semantic queries (`getByRole`, `getByLabelText`) over test IDs.
- **[PREFER]** Type-level tests for complex prop types (`@ts-expect-error`, `satisfies`).
- **[RULE]** Test accessibility: roles, ARIA attributes, focus management, keyboard interaction.

## Versioning and Deprecation

- **[STRONG]** Deprecate props with a runtime warning in dev mode (e.g., ``console.warn( 'ComponentName: `oldProp` is deprecated. Use `newProp` instead.' )``). Keep the old prop working for at least one major version.
- **[STRONG]** Document deprecations in the CHANGELOG and JSDoc. Include the migration path.
- **[PREFER]** When removing a feature, check the codebase and downstream consumers for usage before removing. Provide a codemod or migration guide for non-trivial changes.

## Consistency

- **[RULE]** Sibling components must follow the same patterns. If Dialog has a `modal` prop, AlertDialog should too. If one component uses a `render` prop, all should.
- **[STRONG]** When adding a pattern to one component, audit whether siblings need the same treatment.
- **[STRONG]** Document deviations from upstream behavior explicitly.
