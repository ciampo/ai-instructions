import assert from 'node:assert/strict';
import { getChangeRoundLimit } from '../src/iteration-limit.mjs';

assert.equal( getChangeRoundLimit(), 5 );
assert.equal( getChangeRoundLimit( 2 ), 2 );
assert.equal( getChangeRoundLimit( 0 ), 0 );
