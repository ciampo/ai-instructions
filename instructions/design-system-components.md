# Design System Components

Patterns for building and maintaining a design system component library. Generalized from my work but applicable to any component library wrapping headless primitives.

## Architecture

- Wrap headless/unstyled primitives (e.g., Base UI, Radix, Ariakit) with thin, styled layers.
- Stay close to the upstream API surface. Do not re-invent props that the primitive already exposes. Deviations need justification.
- Compound component pattern: `Component.Root`, `Component.Header`, `Component.Content`, etc.
- Use React Context for internal communication between sub-components (e.g., sharing IDs, state).
- Private exports for internally shared utilities. Public API surface should be minimal.

## Styling

- CSS Modules for component styles. One `.module.css` file per component.
- All visual values from design tokens (CSS custom properties). No hardcoded colors, spacing, typography, or radii.
- Typography through a shared `Text` component with semantic variants, not raw CSS font properties.
- CSS layer organization when the system supports it (component styles vs composition styles).

## Storybook

- Each component gets stories with working interactive examples.
- JSDoc on the root component provides the Storybook description automatically -- do not duplicate.
- Disable irrelevant controls for specific stories. Prefer systematic disabling over one-by-one exclusion.
- Stories should use `args`/`controls` properly.

## Testing

- Unit tests with React Testing Library. Use semantic queries (`getByRole`, `getByLabelText`) over test IDs.
- Type-level tests for complex prop types (`@ts-expect-error`, `satisfies`).
- Test accessibility: roles, ARIA attributes, focus management, keyboard interaction.

## Consistency

- Sibling components must follow the same patterns. If Dialog has a `modal` prop, AlertDialog should too. If one component uses a `render` prop, all should.
- When adding a pattern to one component, audit whether siblings need the same treatment.
- Document deviations from upstream behavior explicitly.
