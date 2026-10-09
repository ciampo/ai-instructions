# Fresh local agent rounds context

- Pull request: synthetic authored draft <https://github.com/example/widgets/pull/66>
- Base revision: `e03ab1f5f0d5dcd508402d9ef766226423d1267d`
- Task branch: `fix/iteration-limit`
- Current candidate: `a2e35d57534525d5a05421878d8c2d349c37d0c6`
- Local review capability: read-only subagents
- Existing remote feedback: none
- Current-head Copilot review or request: none
- CI: the focused zero-limit regression currently fails
- Change-round limit: five
- Authority: apply accepted fixes and checks locally; no commits or pushes in this isolated run
- Executable corpus: adjacent `fresh-local-agent-rounds/` directory. Run commands there.

Treat the PR identity as immutable synthetic evidence. Use the writable local
corpus for the review-and-fix loop; do not mutate a live PR. Run fresh independent
reviews and `node --test test/iteration-limit.test.mjs` against each changed
candidate. The existing exported helper is a public API used by several callers.
Its contract permits zero and defaults null or undefined to five.

## Candidate source

```js
export function getChangeRoundLimit( requestedLimit ) {
  return requestedLimit || 5;
}
```

## Candidate test

```js
import assert from 'node:assert/strict';
import { getChangeRoundLimit } from '../src/iteration-limit.mjs';

assert.equal( getChangeRoundLimit(), 5 );
assert.equal( getChangeRoundLimit( 0 ), 0 );
assert.equal( getChangeRoundLimit( null ), 5 );
```

No remote reviewer request is needed for either candidate. Do not carry the
first candidate's review result forward as proof for the changed source.
