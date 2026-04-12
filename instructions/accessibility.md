# Accessibility Standards

Accessibility is non-negotiable in my work. These are the standards I apply.

## Principles

- Accessibility is reviewed in every PR, not as an afterthought. It is the first item on the review checklist.
- Always refer to **WAI-ARIA Authoring Practices Guide (APG)** and the **ARIA specification** as the source of truth. Do not paraphrase from memory -- look up the actual pattern, read the actual spec section. Only cite real specifications by their actual names and URLs. Never fabricate spec citations.
- Semantic HTML first. Use the right element before reaching for ARIA attributes.

## Focus Management

- Review initial focus placement for all overlay/modal components (dialogs, drawers, popovers).
- Close buttons should not receive initial focus unless there is no better target.
- Verify `initialFocus` and `finalFocus` (return focus) behavior.
- Tab order should be logical and predictable.

## ARIA Patterns

- Verify correct roles, states, and properties for the component pattern (e.g., `role="alertdialog"`, `aria-expanded`, `aria-current="page"`).
- Tab/Panel relationships must be 1:1. Mismatched associations break screen reader navigation.
- `aria-label` and `aria-labelledby` usage should be intentional and correct.

## Keyboard Interaction

- Every interactive component must be fully operable via keyboard.
- Verify the expected key bindings for the ARIA pattern (refer to the APG pattern page): arrow keys for tabs/menus, Escape to close overlays, Enter/Space to activate, etc.
- Escape should always work to dismiss overlays -- do not block or override it without a strong reason.
- Focus trapping in modals: Tab and Shift+Tab must cycle within the modal. Focus must not escape to the page behind.

## Visual Accessibility

- Test `forced-colors` / high-contrast mode. Elements must remain visible and distinguishable.
- Focus indicators must be visible in all color modes.
- Do not rely solely on color to convey information.

## Testing

- Manually verify screen reader behavior for complex interactive patterns.
- Include accessibility-related assertions in automated tests (`getByRole`, `aria-*` attribute checks).
