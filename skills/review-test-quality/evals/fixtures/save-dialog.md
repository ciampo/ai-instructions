# Save dialog test context

Review this component and test as a read-only test-quality exercise.

```jsx
export function SettingsDialog( { onSave } ) {
  return <button onClick={ onSave }>Save changes</button>;
}
```

```jsx
it( 'saves settings', () => {
  const onSave = vi.fn();
  const { container } = render( <SettingsDialog onSave={ onSave } /> );
  expect( container.querySelector( '.save-button' ) ).not.toBeNull();
} );
```

The regression being fixed is that users could not save after opening the dialog. No browser or assistive-technology evidence is provided.
