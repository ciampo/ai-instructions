import assert from 'node:assert/strict';
import { getChangeRoundLimit } from '../src/iteration-limit.mjs';

assert.equal( getChangeRoundLimit(), 5 );
assert.equal( getChangeRoundLimit( 0 ), 0 );
assert.equal( getChangeRoundLimit( null ), 5 );
