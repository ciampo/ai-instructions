# Prior explanation

The user asked why saved filters disappear. This was the assistant's previous answer:

> The saved-filter loss is not reproduced on `trunk`. The new persistence path, `FilterStore.hydrate()`, is behind the `filters-v2` flag, so the default build still reads filters from `localStorage` through `legacyFilters.read()`. With `filters-v2` on, `hydrate()` runs before the session token resolves and falls back to an empty list. That ordering is confirmed in `src/filters/store.ts:41`. Whether the empty list is then written back to the server is unverified, because the write is debounced and the test run ended before it fired.
