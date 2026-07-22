# Accessibility Reference

Accessibility is non-negotiable in my work. Apply the requirements that match the affected interface and component pattern.

## Principles

- **[RULE]** Review accessibility first for changes that can affect user interface semantics, interaction, content, or presentation.
- **[RULE]** Always refer to the [WAI-ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/) and the [ARIA specification](https://www.w3.org/TR/wai-aria-1.2/) as the source of truth. Do not paraphrase from memory -- look up the actual pattern and specification section.
- **[RULE]** Semantic HTML first. Use the right element before reaching for ARIA attributes.

## Focus Management

- **[STRONG]** Review initial focus placement for components that move focus when opened, using the actual component pattern rather than treating every overlay as a modal dialog.
- **[STRONG]** Choose initial focus from the dialog's content and purpose. A close button can be appropriate, but do not use it as a universal default.
- **[STRONG]** Verify `initialFocus` and `finalFocus` (return focus) behavior.
- **[STRONG]** Tab order should be logical and predictable.

## ARIA Patterns

- **[RULE]** Verify correct roles, states, and properties for the component pattern (e.g., `role="alertdialog"` only for a modal alert dialog that communicates an important message and requires a response, `aria-expanded`, or `aria-current="page"`).
- **[RULE]** Tab/Panel relationships must be 1:1. Mismatched associations break screen reader navigation.
- **[STRONG]** `aria-label` and `aria-labelledby` usage should be intentional and correct.

## Live Regions

- **[STRONG]** Use `aria-live` regions for dynamic content updates that users need to know about (notifications, status changes, async operation results).
- **[STRONG]** Choose the right assertiveness: `aria-live="polite"` for non-urgent updates (status messages, search result counts), `aria-live="assertive"` only for time-sensitive information (errors, alerts).
- **[PREFER]** Prefer `role="status"` (implicitly `aria-live="polite"`) and `role="alert"` (implicitly `aria-live="assertive"`) over raw `aria-live` attributes when the semantics match.
- **[STRONG]** Prefer a stable live-region container when an announcement is important. Treat pre-mounting as a cross-browser reliability technique, not a universal ARIA requirement, and test the target browser and assistive-technology combinations. Follow the [APG alert pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) when the alert semantics apply.

## Keyboard Interaction

- **[RULE]** Every interactive component must be fully operable via keyboard.
- **[STRONG]** Verify the expected key bindings against the applicable APG pattern: arrow keys for tabs and menus, Enter or Space for activation, and Escape where the pattern defines dismissal.
- **[RULE]** Modal dialogs are expected to close on Escape, matching the [APG modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). If a nested interaction temporarily consumes Escape, verify that the dialog remains operable and the next Escape closes it.
- **[RULE]** In modal dialogs, Tab and Shift+Tab cycle within the dialog and do not move focus to the page behind it.

## Motion and Animation

- **[STRONG]** Respect `prefers-reduced-motion`. Reduce or remove non-essential animations when the user has requested reduced motion.
- **[PREFER]** Ensure animations are non-essential -- the UI should be fully functional and understandable without them.
- **[PREFER]** Avoid flashing content. If it is essential, verify [WCAG 2.2 Success Criterion 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html): no more than three flashes in any one-second period, or the complete general-flash and red-flash thresholds must be satisfied.

## Visual Accessibility

- **[STRONG]** Test `forced-colors` / high-contrast mode. Elements must remain visible and distinguishable.
- **[RULE]** Focus indicators must be visible in all color modes.
- **[RULE]** Do not rely solely on color to convey information.
- **[STRONG]** Verify the applicable contrast criterion: 4.5:1 for normal text and 3:1 for large text under Contrast (Minimum), plus 3:1 against adjacent colors for visual information required to identify UI components, states, and meaningful graphics under [Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

## Touch and Mobile

- **[RULE]** Meet [WCAG 2.2 Success Criterion 2.5.8: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) (Level AA): pointer targets must be at least 24x24 CSS pixels or satisfy one of the criterion's exceptions, including sufficient spacing.
- **[STRONG]** Aim for targets of at least 44x44 CSS pixels, the enhanced Level AAA size defined by [WCAG 2.2 Success Criterion 2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced), especially for frequently used or difficult-to-undo controls.
- **[PREFER]** Provide a single-pointer alternative for multipoint or path-based gestures unless that gesture is essential.
- **[STRONG]** Verify [WCAG 2.2 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html): non-excepted content must work without loss of information or functionality and without two-dimensional scrolling at a width equivalent to 320 CSS pixels for vertically scrolling content, or a height equivalent to 256 CSS pixels for horizontally scrolling content.

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
// Less reliable: live region added at the same time as content
{ showStatus && <div aria-live="polite">Saved successfully</div> }

// More reliable across browser and assistive-technology combinations:
// keep the live region mounted, then inject content into it
<div aria-live="polite">{ showStatus ? 'Saved successfully' : '' }</div>
```

</details>

## Testing

- **[STRONG]** Manually verify screen reader behavior for complex interactive patterns.
- **[STRONG]** Include accessibility-related assertions in automated tests (`getByRole`, `aria-*` attribute checks).
