# Account deletion context

Review this version-controlled endpoint as a read-only security exercise.

```js
app.post( '/accounts/:accountId/delete', requireSession, async ( request, response ) => {
  await accounts.delete( request.params.accountId );
  response.sendStatus( 204 );
} );
```

`requireSession` verifies that a session exists and assigns `request.user.id`. The route does not compare that user to `accountId`. Account identifiers are discoverable by every signed-in user. No infrastructure access-control information is supplied.
