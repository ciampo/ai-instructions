# Parent loop local candidate context

This is an immutable synthetic snapshot. Do not fetch or mutate a live PR.

- PR: authored <https://github.com/example/widgets/pull/69>
- Base revision: `e03ab1f5f0d5dcd508402d9ef766226423d1267d`
- Remote PR head and local HEAD: `a2e35d57534525d5a05421878d8c2d349c37d0c6`
- Parent: active `iterate-pr-review`, round two of five
- Candidate: the uncommitted source below, which differs from HEAD
- Local review capability: read-only subagents
- Previous PR feedback: complete, none
- CI: remote HEAD passed; the local candidate is not covered by that run
- Authority: local fixes and checks only, no commits, pushes, or remote mutations
- Delivery: internal handoff only, no review or reply artifacts

## Candidate diff

```diff
-return requestedLimit ?? 5;
+return requestedLimit || 5;
```

## Candidate source and consumers

```js
export function getChangeRoundLimit( requestedLimit ) {
  return requestedLimit || 5;
}
```

The caller supplies a numeric limit. Its existing contract permits zero to skip
change rounds and perform only the final read-only pass.

## Candidate tests

```js
import assert from 'node:assert/strict';
import { getChangeRoundLimit } from '../src/iteration-limit.mjs';

assert.equal( getChangeRoundLimit(), 5 );
assert.equal( getChangeRoundLimit( 2 ), 2 );
```
