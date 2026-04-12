# Skill: Scaffold Component

A workflow for creating a new design system component following established patterns. Invoked when I say "create a component", "scaffold ComponentName", or "new component."

## Dependencies

Load these instruction files before executing this skill:

- `instructions/design-system-components.md`
- `instructions/coding-principles.md`
- `instructions/naming-conventions.md`
- `instructions/accessibility.md`

## Steps

1. **Gather requirements**: Confirm the component name, what headless/unstyled primitive it wraps (if any), and whether it uses the compound component pattern. Ask if unclear.
2. **Check for existing patterns**: Look at sibling components in the same package. Identify the directory structure, file naming, export patterns, and styling conventions they use. Match them exactly.
3. **Create the directory and files**:
   - `component-name/` directory (kebab-case)
   - `component-name.tsx` — component implementation with compound pattern (`ComponentName.Root`, etc.) if applicable
   - `component-name.module.css` — CSS Module using design tokens only
   - `component-name.stories.tsx` — Storybook stories with interactive controls
   - `component-name.test.tsx` — tests using React Testing Library with semantic queries
   - `types.ts` — prop types and context types (if complex enough to warrant a separate file)
   - `context.tsx` — React Context for compound component communication (if applicable)
   - `index.ts` — public API re-exports
4. **Component implementation**:
   - Wrap the headless primitive with a thin styled layer. Stay close to the upstream API surface.
   - Use `forwardRef` on all sub-components that render DOM elements.
   - Use React Context for internal state sharing between sub-components.
   - Apply all visual styles via design tokens (CSS custom properties). No hardcoded values.
   - Add JSDoc on the root component describing behavior, not internals.
5. **Stories**: Create at least a Default story and variant stories for key props. Use `args`/`controls`. Disable irrelevant controls.
6. **Tests**: Include tests for:
   - Rendering with default props
   - Key prop variations
   - Accessibility: roles, ARIA attributes, keyboard interaction
   - Focus management (if applicable)
7. **Exports**: Add the component to the package's public index file.
8. **CHANGELOG**: Add a "New Feature" entry.
9. **Verify**: Run lint, type-check, and tests before presenting the result.
