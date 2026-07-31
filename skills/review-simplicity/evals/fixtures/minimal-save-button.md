# Minimal save button fixture

Review this self-contained change as a read-only simplification exercise.

## Required behavior

- Preserve the existing exported `SaveButton` component and its props.
- Render a native button that cannot submit a surrounding form.
- Use the supplied child content as the accessible label.
- Invoke the supplied callback when the button is activated.
- No new abstraction, dependency, or public API is requested.

## Added source

`src/components/SaveButton.tsx`:

```tsx
export function SaveButton( { children, onSave } ) {
    return (
        <button type="button" onClick={ onSave }>
            { children }
        </button>
    );
}
```

## Existing verification

The component tests render `SaveButton` inside a form, query it by its supplied accessible name, activate it, and verify that `onSave` runs without submitting the form. Repository search found no supported primitive that provides the same public component contract, and no additional requirements were supplied.
