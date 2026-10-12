# Runtime cancellation support

The user asks whether a cleanup guard can be removed from a request wrapper. This is a read-only assessment.

The public contract permits a supported transport to resolve after cancellation. The wrapper must prevent cancelled results from publishing. Cancellation also requests transport cleanup.

```js
export async function load(transport, signal, publish) {
  const result = await transport(signal);
  if (!signal.aborted) publish(result);
}
```

The project supports Runtime R versions 4 through 8 and custom transports. A reproduction in Runtime R version 8 with its default transport shows that cancellation rejects the request before `publish` runs. The same reproduction did not exercise a custom transport. Versions 4 through 7 have not been tested, and no authoritative availability evidence for rejection on cancellation was supplied.

The user suggests that the guard is redundant because the tested default transport already rejects. There is no evidence that every supported transport rejects on cancellation, and the public contract explicitly allows resolving after cancellation.
