# Local-only fix authority context

- Pull request: <https://github.com/example/widgets/pull/46>
- Base revision: `d18f0aa51b92fa6409f7cc2e94fcf4de18f55d91`
- Current remote head revision: `f433b7eb0c92f2b2fa9769280f17330e602f2e72`
- Copilot and independent reviews for the remote head: both confirm that the explicit-limit test is missing.
- Authority: edit source and run checks only. Do not commit, push, update the pull request, resolve threads, post replies, mark ready, or merge.

## Current remote-head source

```js
export function getChangeRoundLimit( requestedLimit ) {
  return requestedLimit ?? 5;
}
```

## Current remote-head test

```js
import assert from 'node:assert/strict';
import { getChangeRoundLimit } from '../src/iteration-limit.mjs';

assert.equal( getChangeRoundLimit(), 5 );
```

Add the missing `getChangeRoundLimit( 2 )` assertion locally and run the relevant test. Because that new local state is not committed and pushed, report it and stop instead of starting a new remote-review round.
