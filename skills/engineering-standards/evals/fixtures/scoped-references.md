# Scoped engineering review

The repository is a Node.js service. Existing route handlers read the authenticated actor from `request.context.actor`; middleware verifies the token and populates that context.

The proposed handler instead reads an unverified `x-user-id` header and uses it to authorize deletion:

```js
export async function removeProject( request ) {
  const actorId = request.headers[ 'x-user-id' ];
  return projects.removeForActor( request.params.id, actorId );
}
```

There is no UI, styling, localization, client bundle, rendering, or measured performance change. The user requested review only.
