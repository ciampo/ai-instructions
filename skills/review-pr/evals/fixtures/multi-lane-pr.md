# Multi-lane change context

This is a static, version-controlled evaluation fixture, not a live pull request. Treat the evidence below as the complete immutable review boundary; do not fetch or refresh a remote branch.

- Fixture revision: `coordinator-multi-lane-v1`
- Repository: `example/coordinator-review-fixture`
- Base revision: `b4f0f8c5fbf24e05d4307c413be1cda7e73d4caa`
- Head revision: `e71df9a73ed7a0e43cae7271c1e68b7cbd2e6a9b`
- Existing review state: no comments or reviews
- Target audience: maintainers deciding whether the change is ready to merge
- Changed areas: account-deletion authorization, persisted-preference migration, and settings-dialog regression coverage

## Account-deletion route

```js
app.post( '/accounts/:accountId/delete', requireSession, async ( request, response ) => {
  await accounts.delete( request.params.accountId );
  response.sendStatus( 204 );
} );
```

`requireSession` verifies a session exists and assigns `request.user.id`. Account identifiers are discoverable by every signed-in user. The route does not compare `request.user.id` with `request.params.accountId`.

## Persisted-preference migration

```js
export function readPreferences( stored ) {
  return {
    showSidebar: stored.showSidebar,
  };
}
```

The previous persisted format used `sidebarVisible`. Existing installations can still have that key, and the repository supports upgrades from the previous format.

## Settings-dialog regression test

```jsx
export function SettingsDialog( { onSave } ) {
  return <button className="save-button" onClick={ onSave }>Save changes</button>;
}

it( 'saves settings', () => {
  const onSave = vi.fn();
  const { container } = render( <SettingsDialog onSave={ onSave } /> );
  expect( container.querySelector( '.save-button' ) ).not.toBeNull();
} );
```

The regression being fixed is that users could not save after opening the dialog. No browser, assistive-technology, profile, RTL-rendering, deployment-policy, or dependency-update evidence is supplied.
