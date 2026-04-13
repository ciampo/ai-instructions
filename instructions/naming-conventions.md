# Naming Conventions

Consistent naming reduces cognitive load and helps AI agents produce code that fits the codebase.

## Files and Directories

- **[STRONG]** `kebab-case` for files and directories: `date-picker.tsx`, `use-resize-observer.ts`, `date-picker.module.css`.
- **[STRONG]** `PascalCase` only when the file exports a single class or component and the project convention requires it. Follow whatever the project already does.
- **[STRONG]** Test and Storybook files should follow the same conventions and naming scheme as the current project.
- **[PREFER]** Index files (`index.ts`) for public API re-exports. Keep them thin -- only exports, no logic.

<details>
<summary>Example: component directory structure</summary>

```text
date-picker/
  index.ts                    # public exports
  date-picker.tsx             # main component
  date-picker.module.css      # styles
  date-picker.stories.tsx     # Storybook stories
  date-picker.test.tsx        # tests
  context.tsx                 # React Context (if compound)
  types.ts                    # shared types (if complex)
```

</details>

## Components

- **[RULE]** `PascalCase` for React component names: `DatePicker`, `AlertDialog`.
- **[STRONG]** Compound component sub-components use dot notation: `Tabs.Root`, `Tabs.List`, `Tabs.Trigger`, `Tabs.Content`.
- **[PREFER]** Name the file after the component: `date-picker.tsx` exports `DatePicker`.

## Hooks

- **[RULE]** Prefix custom hooks with `use`: `useResizeObserver`, `useClickOutside`.
- **[STRONG]** Name hooks after what they provide, not how they work: `useScrollLock` (what) over `useBodyOverflowHidden` (how).

## CSS

- **[STRONG]** CSS Module class names in `camelCase`: `.datePickerHeader`, `.triggerButton`.
- **[STRONG]** CSS custom properties (design tokens) use kebab-case with a namespace: `--ds-color-primary`, `--ds-spacing-sm`.
- **[PREFER]** Internal (component-scoped) custom properties should convey intent: `--button-padding` over `--p`.

## Variables and Functions

- **[STRONG]** `camelCase` for variables, functions, and object properties: `isOpen`, `handleClick`, `formatDate`.
- **[STRONG]** `UPPER_SNAKE_CASE` for true constants (values known at module load time): `MAX_RETRIES`, `DEFAULT_TIMEOUT_MS`.
- **[RULE]** Boolean variables start with `is`, `has`, `should`, `can`, or similar: `isDisabled`, `hasError`, `shouldAnimate`.

## Types and Interfaces

- **[STRONG]** `PascalCase` for types and interfaces: `ButtonProps`, `TabsContextValue`.
- **[PREFER]** Suffix props types with `Props`: `DialogProps`, `TooltipProps`.
- **[PREFER]** Suffix context value types with `ContextValue`: `TabsContextValue`.

## Branches

- **[PREFER]** `type/short-description`: `fix/focus-trap-escape`, `add/date-picker-component`, `update/radix-tooltip-v2`.
- Common prefixes: `add/`, `update/`, `fix/`, `remove/`, `try/`, `docs/`.
