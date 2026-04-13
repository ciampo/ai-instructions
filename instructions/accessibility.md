# Accessibility Standards

Accessibility is non-negotiable in my work. These are the standards I apply.

## Principles

- **[RULE]** Accessibility is reviewed in every PR, not as an afterthought. It is the first item on the review checklist.
- **[RULE]** Always refer to **WAI-ARIA Authoring Practices Guide (APG)** and the **ARIA specification** as the source of truth. Do not paraphrase from memory -- look up the actual pattern, read the actual spec section. Only cite real specifications by their actual names and URLs. Never fabricate spec citations.
- **[RULE]** Semantic HTML first. Use the right element before reaching for ARIA attributes.

## Focus Management

- **[STRONG]** Review initial focus placement for all overlay/modal components (dialogs, drawers, popovers).
- **[STRONG]** Close buttons should not receive initial focus unless there is no better target.
- **[STRONG]** Verify `initialFocus` and `finalFocus` (return focus) behavior.
- **[STRONG]** Tab order should be logical and predictable.

## ARIA Patterns

- **[RULE]** Verify correct roles, states, and properties for the component pattern (e.g., `role="alertdialog"`, `aria-expanded`, `aria-current="page"`).
- **[RULE]** Tab/Panel relationships must be 1:1. Mismatched associations break screen reader navigation.
- **[STRONG]** `aria-label` and `aria-labelledby` usage should be intentional and correct.

## Live Regions

- **[STRONG]** Use `aria-live` regions for dynamic content updates that users need to know about (notifications, status changes, async operation results).
- **[STRONG]** Choose the right assertiveness: `aria-live="polite"` for non-urgent updates (status messages, search result counts), `aria-live="assertive"` only for time-sensitive information (errors, alerts).
- **[PREFER]** Prefer `role="status"` (implicitly `aria-live="polite"`) and `role="alert"` (implicitly `aria-live="assertive"`) over raw `aria-live` attributes when the semantics match.
- **[RULE]** Live regions must exist in the DOM before content is injected. Adding a live region and its content simultaneously will not be announced.

## Keyboard Interaction

- **[RULE]** Every interactive component must be fully operable via keyboard.
- **[STRONG]** Verify the expected key bindings for the ARIA pattern (refer to the APG pattern page): arrow keys for tabs/menus, Escape to close overlays, Enter/Space to activate, etc.
- **[RULE]** Escape should always work to dismiss overlays -- do not block or override it without a strong reason.
- **[RULE]** Focus trapping in modals: Tab and Shift+Tab must cycle within the modal. Focus must not escape to the page behind.

## Motion and Animation

- **[STRONG]** Respect `prefers-reduced-motion`. Reduce or remove non-essential animations when the user has requested reduced motion.
- **[PREFER]** Ensure animations are non-essential -- the UI should be fully functional and understandable without them.
- **[PREFER]** Avoid rapid flashing content (3 flashes per second or more) that could trigger seizures.

## Visual Accessibility

- **[STRONG]** Test `forced-colors` / high-contrast mode. Elements must remain visible and distinguishable.
- **[RULE]** Focus indicators must be visible in all color modes.
- **[RULE]** Do not rely solely on color to convey information.
- **[STRONG]** Ensure sufficient color contrast ratios (WCAG AA: 4.5:1 for normal text, 3:1 for large text and UI components).

## Touch and Mobile

- **[STRONG]** Touch targets should be at least 44x44 CSS pixels (WCAG 2.5.5).
- **[PREFER]** Provide alternatives for complex gestures (drag, multi-finger) -- a simple tap or click alternative should always exist.
- **[PREFER]** Ensure content is usable at 200% zoom without horizontal scrolling.

## Common Mistakes

Patterns AI agents get wrong frequently -- watch for these:

- Using `role="button"` on a `<div>` instead of using a `<button>` element. The native element provides keyboard interaction and accessibility for free.
- Applying `aria-label` to non-interactive elements where it has no effect (e.g., `<div aria-label="...">`). Use `aria-label` on interactive elements, landmarks, or elements with widget roles.
- Using `aria-hidden="true"` on focusable elements. This creates a disconnect where screen readers cannot see the element but keyboard users can focus it.
- Relying on `placeholder` text as the only label for form inputs. Placeholders disappear on input and are not reliably announced as labels.

<details>
<summary>Examples: Common mistakes with fixes</summary>

```tsx
// Bad: div with role="button" -- missing keyboard handling, no implicit focus
<div role="button" onClick={ handleClick }>Save</div>

// Good: use a <button>
<button onClick={ handleClick }>Save</button>
```

```tsx
// Bad: aria-label on a non-interactive <div>
<div aria-label="User profile">{ user.name }</div>

// Good: use a heading or landmark with aria-label
<section aria-label="User profile">
  <h2>{ user.name }</h2>
</section>
```

```tsx
// Bad: placeholder as the only label
<input placeholder="Email address" type="email" />

// Good: visible label (or visually-hidden label if design requires it)
<label htmlFor="email">Email address</label>
<input id="email" type="email" />
```

```tsx
// Bad: live region added at the same time as content
{ showStatus && <div aria-live="polite">Saved successfully</div> }

// Good: live region always in DOM, content injected into it
<div aria-live="polite">{ showStatus ? 'Saved successfully' : '' }</div>
```

</details>

## Testing

- **[STRONG]** Manually verify screen reader behavior for complex interactive patterns.
- **[STRONG]** Include accessibility-related assertions in automated tests (`getByRole`, `aria-*` attribute checks).
