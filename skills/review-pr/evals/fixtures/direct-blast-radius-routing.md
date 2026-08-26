# Direct blast-radius routing context

This is a static evaluation fixture, not a live pull request. Treat it as the
complete immutable boundary; do not fetch a remote branch.

- Repository: `example/session-cache-fixture`
- Base revision: `5213b39675209cc565416a365133b3024b03ddca`
- Head revision: `265c94080f400f26b5870bfa290392880ee15ce2`
- Target audience: maintainers deciding whether the cleanup change is safe
- Existing review state: no comments or reviews

The head changes `closeSession` in `src/session-cache.js:18` from synchronous
deletion to this deferred cleanup:

```js
export function closeSession( accountId ) {
  const session = sessions.get( accountId );
  if ( ! session ) {
    return;
  }

  session.close();
  queueMicrotask( () => sessions.delete( accountId ) );
}
```

The reconnect handler can synchronously store a replacement session for the same
account after `closeSession` returns. The executable probe is at
`skills/review-blast-radius/evals/fixtures/deferred-cleanup-probe.mjs` and can be
run with Node. No other consumers, integration tests, or running application are
available.
