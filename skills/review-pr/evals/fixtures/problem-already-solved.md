# Problem that an existing capability already solves

This is a synthetic, complete immutable PR snapshot. Use only this fixture; do not use the network. The base, head, discussion, and CI state remain unchanged at the final freshness check.

- PR: <https://github.com/example/search-kit/pull/81>
- Title: Add a `debounceMs` option to `useSearch`
- Repository: `example/search-kit`
- Base: `7777777777777777777777777777777777777777`
- Head: `8888888888888888888888888888888888888888`
- Merge base: same as base
- Target audience: maintainers reviewing a contributor's PR
- History: one commit, `Add debounceMs to useSearch`
- Description: "Closes #77. `useSearch` now accepts `debounceMs` and waits that long before it sends a request."
- CI: all configured checks passed. No test changed.
- Changed files: `src/use-search.js` only. The full diff and source follow.
- Existing review state: no comments or reviews on the PR.

## Linked issue #77, complete

- Report by the PR author: "`useSearch` sends a request on every keystroke. Please add debouncing." The reproduction calls `useSearch( query )` with the raw input value.
- No maintainer has replied. The issue has no labels and no recorded decision.

## Diff

```diff
-export function useSearch( query ) {
+export function useSearch( query, { debounceMs = 0 } = {} ) {
+  const [ debounced, setDebounced ] = useState( query );
+  useEffect( () => {
+    setTimeout( () => setDebounced( query ), debounceMs );
+  }, [ query ] );
-  return useRequest( '/search', { q: query } );
+  return useRequest( '/search', { q: debounced } );
 }
```

## Full head source, src/use-search.js, lines 1-10

```js
import { useEffect, useState } from 'react';
import { useRequest } from './use-request';

export function useSearch( query, { debounceMs = 0 } = {} ) {
  const [ debounced, setDebounced ] = useState( query );
  useEffect( () => {
    setTimeout( () => setDebounced( query ), debounceMs );
  }, [ query ] );
  return useRequest( '/search', { q: debounced } );
}
```

## Related source, documentation, and consumers

- `src/use-debounced-value.js`: the package exports `useDebouncedValue( value, ms )`. It clears its timer when the value changes and on unmount, and it has tests for both.
- `README.md`, section "Debouncing": "`useSearch` sends a request each time its query changes. To debounce, pass a debounced query: `useSearch( useDebouncedValue( query, 300 ) )`."
- All three example apps in `examples/` use that documented pattern.
- `useSearch` and `useDebouncedValue` are public exports. No consumer in the repository passes a second argument to `useSearch`.
