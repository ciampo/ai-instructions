# Design System Components Reference

Patterns for building and maintaining a design system component library. Generalized from my work but applicable to any component library wrapping headless primitives.

## Architecture

- **[RULE]** Stay close to the upstream API surface. Do not re-invent props that the primitive already exposes. Deviations need justification.
- **[PREFER]** Use a compound component pattern such as `Component.Root`, `Component.Header`, and `Component.Content` when it matches the repository and the parts need a coherent shared API.
- **[PREFER]** Use React Context for internal communication when descendants need shared IDs or state and a more explicit composition would be cumbersome.
- **[STRONG]** Private exports for internally shared utilities. Public API surface should be minimal.

## Polymorphic Rendering

- **[STRONG]** Follow the component library's established polymorphic composition pattern, such as a `render` prop, Ariakit's `render`, or Radix's `asChild`. Do not introduce a competing pattern without a concrete need.
- **[STRONG]** When exposing `render` props, ensure `ref` forwarding works correctly. The component's internal ref and the consumer's ref must be merged.
- **[PREFER]** Type polymorphic props precisely. The rendered element's props should be available on the component (e.g., if rendering as `<a>`, `href` should be valid).

## Styling

- **[RULE]** Use design tokens where the target design system defines them. Do not invent tokens or replace intentional one-off values merely to satisfy a universal rule.
- **[STRONG]** Follow the library's established typography abstraction when it has one; otherwise use semantic HTML and locally appropriate CSS.
- **[PREFER]** CSS layer organization when the system supports it (component styles vs composition styles).

## Theming and Tokens

- **[STRONG]** Tokens are structured in layers: global primitives (colors, scales) -> semantic tokens (foreground, background, border) -> component-scoped tokens (button-bg, input-border).
- **[STRONG]** Dark mode and other themes override semantic tokens, not component styles. Components should not need conditional logic for theming.
- **[PREFER]** Expose component-scoped custom properties for controlled customization, rather than relying on consumers overriding internal class names.

## Storybook

- **[STRONG]** Add stories when the repository uses Storybook and its contribution policy requires or benefits from an interactive example.
- **[STRONG]** Reuse public API documentation as the Storybook description only when the repository's tooling supports that flow.
- **[PREFER]** For props accepting ReactElement or ReactNode, show a custom control accepting strings of text.
- **[PREFER]** For props with complex types (eg objects), either disable the control or provide a custom choice across a prepared list of viable options.
- **[PREFER]** Disable irrelevant controls for specific stories. Prefer systematic disabling over one-by-one exclusion.
- **[PREFER]** Stories should use `args`/`controls` properly, thus linking them to Storybook controls.

## Testing

- **[STRONG]** Unit tests with React Testing Library. Use semantic queries (`getByRole`, `getByLabelText`) over test IDs.
- **[PREFER]** Type-level tests for complex prop types (`@ts-expect-error`, `satisfies`).
- **[RULE]** Test accessibility: roles, ARIA attributes, focus management, keyboard interaction.

## Versioning and Deprecation

- **[STRONG]** When the repository permits a compatibility period, deprecate props with recoverable developer guidance such as a development-only runtime warning. Follow the repository's release policy for how long the old prop remains supported.
- **[STRONG]** Document deprecations and their migration path in the surfaces the repository uses, such as a changelog, API documentation, or migration guide.
- **[PREFER]** When removing a feature, check the codebase and downstream consumers for usage before removing. Provide a codemod or migration guide for non-trivial changes.

## Consistency

- **[RULE]** Keep sibling APIs consistent where their semantics support the same capability. Do not force symmetry that creates an invalid state; for example, the [APG alert-dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/) is modal by definition.
- **[STRONG]** When adding a pattern to one component, audit whether siblings need the same treatment.
- **[STRONG]** Document deviations from upstream behavior explicitly.
