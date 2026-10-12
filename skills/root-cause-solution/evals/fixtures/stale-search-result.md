# Search result ownership

The user requests a read-only recommendation. Do not modify files or publish anything. The following is the complete source relevant to the decision.

```js
let activeController;
let currentQuery = '';

export async function search(query, showResults, transport) {
  currentQuery = query;
  activeController?.abort();
  activeController = new AbortController();
  const results = await transport(query, activeController.signal);
  if (query === currentQuery) showResults(results);
}
```

The documented contract requires only the latest invocation to publish results. Two invocations with the same query are distinct requests. A supported transport can ignore the abort signal and resolve anyway. The module belongs to one search widget and must keep cancellation to reduce unnecessary work when the transport supports it. Errors are handled by the caller and are outside this change.

An existing disposable reproduction uses controlled promises and records these observations:

- Request A for `cat` starts, then B for `dog` starts. B resolves first, then A. Only B publishes.
- Request A for `cat` starts, then B for `cat` starts. B resolves first, then A. Both publish, leaving A's stale result visible.
- The same-query failure happens when the transport ignores abort. A transport that rejects on abort masks it.

The user suggests delaying each result publication by 100 ms. The intended contract has no time limit on transport completion. No browser-native behavior is part of the failure. The promise ordering and abort behavior are controlled by the transport.
