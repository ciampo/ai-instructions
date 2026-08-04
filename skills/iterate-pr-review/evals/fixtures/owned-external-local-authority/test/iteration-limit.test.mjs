import assert from 'node:assert/strict';
import { getChangeRoundLimit } from '../src/iteration-limit.mjs';

assert.equal( getChangeRoundLimit(), 5 );
