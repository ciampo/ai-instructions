# Compromise that the discussion already settled

This is a synthetic, complete immutable PR snapshot. Use only this fixture; do not use the network. The base, head, discussion, and CI state remain unchanged at the final freshness check.

- PR: <https://github.com/example/admin/pull/615>
- Title: Clamp the page size in the orders list
- Repository: `example/admin`
- Base: `5555555555555555555555555555555555555555`
- Head: `6666666666666666666666666666666666666666`
- Merge base: same as base
- Target audience: maintainers reviewing a contributor's PR
- History: one commit, `Clamp the page size in OrdersList`
- Description: "Fixes #590. Clamps the saved page size in `OrdersList`. Known limit: other lists that use `usePagedQuery` are not covered. #300 moves the validation into the hook and removes this clamp."
- CI: all configured checks passed. The new test covers a saved page size of 5000.
- Changed files: `src/orders-list.js` and `test/orders-list.test.js`. The source diff and source follow.
- Existing review state: no comments or reviews on the PR.

## Linked issue #590, complete

- Report: "A stale saved view has `pageSize: 5000`. The orders list requests 5000 rows and the page freezes."
- Maintainer A: "The correct place for this validation is the shared `usePagedQuery` hook."
- Maintainer B: "Agreed in principle, but the hook is frozen until the data-layer migration in #300 lands next quarter. Clamp in `OrdersList` now, link #300 in a comment, and remove the clamp in #300."
- Maintainer A: "OK. Go with the local clamp. I added it to the #300 checklist."
- No later comment changes this decision.

## Diff, src/orders-list.js

```diff
 export function OrdersList( { savedView } ) {
-  const pageSize = savedView.pageSize ?? 25;
+  // Temporary: #300 moves this validation into usePagedQuery.
+  const pageSize = Math.min( savedView.pageSize, 100 );
   const { rows } = usePagedQuery( '/orders', { pageSize } );
   return <Table rows={ rows } />;
 }
```

## Full head source, src/orders-list.js, lines 1-9

```js
import { usePagedQuery } from './use-paged-query';
import { Table } from './table';

export function OrdersList( { savedView } ) {
  // Temporary: #300 moves this validation into usePagedQuery.
  const pageSize = Math.min( savedView.pageSize, 100 );
  const { rows } = usePagedQuery( '/orders', { pageSize } );
  return <Table rows={ rows } />;
}
```

## Contract and consumers

- The orders API accepts a page size from 1 to 100. It returns HTTP 400 for any other value, including `NaN`.
- Saved views come from user storage. Many stored views have no `pageSize` field. Before this PR, those views requested the default of 25 rows.
- `usePagedQuery` passes `pageSize` to the API unchanged. Five other lists use it.
- The new test asserts that a saved page size of 5000 requests 100 rows. No test covers a saved view with no `pageSize`.
