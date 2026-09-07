# Review with earlier feedback

This is a synthetic, complete immutable PR snapshot. Use only this fixture; do not use the network. The base, head, discussion, and CI state remain unchanged at the final freshness check.

- PR: <https://github.com/example/widgets/pull/42>
- Title: Normalize imported items
- Repository: `example/widgets`
- Base: `1111111111111111111111111111111111111111`
- Head: `2222222222222222222222222222222222222222`
- Merge base: same as base
- Target audience: maintainers reviewing a contributor's PR
- History: one commit, `Normalize imported items`
- Description: Normalize names and defaults when importing saved items.
- CI: all configured checks passed; tests cover only a nonempty name and `enabled: true`.
- Changed files: `src/normalize.js` only. The full diff and source follow.

## Diff

```diff
 export function normalize(item) {
-  return item;
+  return {
+    id: String(item.id),
+    name: item.name.trim(),
+    enabled: item.enabled || true,
+    locale: item.locale || 'en',
+  };
 }
```

## Full head source, src/normalize.js, lines 1-8

```js
export function normalize(item) {
  return {
    id: String(item.id),
    name: item.name.trim(),
    enabled: item.enabled || true,
    locale: item.locale || 'en',
  };
}
```

## Consumers and contract

The importer calls `normalize` for each saved item, then stores it in a Map keyed by `id`. Existing callers use numeric IDs, including `items.get(7)`. Saved items can have `enabled: false` and `name: null`. Names should be trimmed, with null treated as an empty name. An omitted `enabled` should default to true, but explicit false must stay false. A supplied locale is a nonempty language code and must be preserved; an omitted one should default to `en`. No caller converts IDs between numbers and strings. There are no other helpers or dependencies in scope.

## Complete discussion, including replies and resolution state

All pages of review bodies, inline threads, and PR conversation comments are supplied. There are no additional review requests or decisions.

- <https://github.com/example/widgets/pull/42#discussion_r101>, open, `src/normalize.js:5`: "Could we preserve explicit false? Disabled items must stay disabled." Author replied "Fixed in the latest push." No further reply.
- <https://github.com/example/widgets/pull/42#discussion_r102>, open, `src/normalize.js:4`: "Can we trim spaces around names?" The latest code shown above is the author's fix. No reply has been posted.
- <https://github.com/example/widgets/pull/42#discussion_r103>, resolved, `src/normalize.js:4`: "Some saved names are null. Please handle those too." Author replied "Resolved." No evidence beyond the source above.
- <https://github.com/example/widgets/pull/42#discussion_r104>, resolved and outdated: "The locale is always being set to en, even when one is supplied." Author replied "The fallback now applies only when locale is omitted." Reviewer's final reply: "Thanks, that addresses it."
- <https://github.com/example/widgets/pull/42#pullrequestreview-105>, review body: "Do we need a compatibility note for existing numeric IDs?" No reply. This review contains no inline comments.
- <https://github.com/example/widgets/pull/42#issuecomment-106>, PR conversation: "Could we default enabled to false instead?" Author replied "No, the import contract requires true for omitted values." Reviewer replied "Agreed, keep true as the default."

The numeric-ID conversion has not been raised as a bug. The review-body question asks only about documentation. No one has discussed the demonstrated failure of `items.get(7)`.
