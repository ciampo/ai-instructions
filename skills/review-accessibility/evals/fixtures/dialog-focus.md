# Dialog focus context

Review the following version-controlled source and consumer as a read-only accessibility exercise.

```jsx
export function Dialog( { open, onClose } ) {
  if ( ! open ) {
    return null;
  }
  return (
    <div role="dialog" aria-modal="true" aria-label="Preferences">
      <button onClick={ onClose }>Close</button>
      <label>
        Display name
        <input />
      </label>
    </div>
  );
}
```

```jsx
export function Preferences() {
  const [ open, setOpen ] = useState( false );
  return <><button onClick={ () => setOpen( true ) }>Preferences</button><Dialog open={ open } onClose={ () => setOpen( false ) } /></>;
}
```

No rendered-browser or assistive-technology evidence is provided.
