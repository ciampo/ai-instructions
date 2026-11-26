# Third review round on the same function

This is a synthetic, complete immutable PR snapshot. Use only this fixture; do not use the network. The base, head, discussion, and CI state remain unchanged at the final freshness check.

- PR: <https://github.com/example/client/pull/330>
- Title: Add filters to the reports request
- Repository: `example/client`
- Base: `5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e`
- Head: `6f6f6f6f6f6f6f6f6f6f6f6f6f6f6f6f6f6f6f6f`
- Merge base: same as base
- Target audience: maintainers reviewing a contributor's PR. The user reviewed the two earlier revisions and asks for another round.
- Description: "Adds `status`, `tags`, and `owner` filters to `fetchReports`."
- Linked issue #322, complete: "The reports page needs status, tag, and owner filters. The API takes them as query parameters. `tags` repeats the key: `?tags=a&tags=b`. Omit a filter that is not set." No other comment.
- CI: all configured checks passed.
- Changed files: `src/api/reports.js` and `test/reports.test.js`. The source at the head follows.

## Full head source, src/api/reports.js, lines 1-17

```js
function buildQuery( params ) {
  const parts = [];
  for ( const key in params ) {
    const value = params[ key ];
    if ( Array.isArray( value ) ) {
      for ( const item of value ) {
        parts.push( key + '=' + encodeURIComponent( item ) );
      }
    } else {
      parts.push( key + '=' + encodeURIComponent( value ) );
    }
  }
  return parts.join( '&' );
}

export function fetchReports( filters ) {
  return fetch( '/reports?' + buildQuery( filters ) );
}
```

## Complete discussion, including replies and resolution state

- Round 1, <https://github.com/example/client/pull/330#discussion_r401>, resolved, `src/api/reports.js`, on `buildQuery`: "Values are not encoded, so an owner name with `&` breaks the query." The author replied "Fixed" and added `encodeURIComponent` to values. The head source confirms the fix.
- Round 2, <https://github.com/example/client/pull/330#discussion_r402>, resolved, `src/api/reports.js`, on `buildQuery`: "`tags` is sent as `tags=a,b`, but the API needs a repeated key." The author replied "Fixed" and added the array branch. The head source confirms the fix.
- There are no other comments, reviews, or decisions.

## Consumers, siblings, and tests

- The reports page calls `fetchReports( { status, tags, owner } )`. `owner` is `undefined` when no owner is selected, and `status` is `null` for "any status". With the head source, those calls send `owner=undefined` and `status=null`, and the API returns no reports.
- `src/api/users.js` and `src/api/teams.js` build their queries with `URLSearchParams` and a shared `appendDefined( searchParams, key, value )` helper in `src/api/query.js`. The helper skips `null` and `undefined`, appends each item of an array under the same key, and has tests for each case.
- No other module in `src/api/` builds a query string by hand.
- `test/reports.test.js` covers an encoded owner name and two tags. It does not cover an unset filter.
