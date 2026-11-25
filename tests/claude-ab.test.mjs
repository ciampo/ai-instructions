import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { parseArguments, parseStream, runCheck } from '../scripts/evals/run-claude-ab.mjs';

const repoDir = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '..' );
const required = [ '--base', 'main', '--head', 'WORKTREE', '--model', 'example', '--output', 'out.json' ];

test( 'A/B runner requires both revisions, a model, an output, and a suite', () => {
	assert.throws( () => parseArguments( required ), /At least one --suite/ );
	assert.throws( () => parseArguments( [ '--suite', 'core' ] ), /--base is required/ );
	assert.throws( () => parseArguments( [ ...required, '--suite', 'everything' ] ), /--suite must be core or skill/ );
	assert.throws( () => parseArguments( [ ...required, '--suite', 'core', '--trials', '0' ] ), /between 1 and 10/ );
	const options = parseArguments( [ ...required, '--suite', 'core', '--suite', 'skill:review-pr' ] );
	assert.deepEqual( options.suites, [ 'core', 'skill:review-pr' ] );
	assert.equal( options.trials, 3 );
	assert.equal( options.graderModel, 'example' );
} );

test( 'A/B runner reads the response, loaded skills, and attempted tools from the event stream', () => {
	const stream = [
		{ type: 'system', subtype: 'init' },
		{
			type: 'assistant',
			message: {
				content: [
					{ type: 'tool_use', name: 'Skill', input: { skill: 'unslop' } },
					{ type: 'tool_use', name: 'Read', input: { file_path: '/work/.claude/skills/review-pr/SKILL.md' } },
					{ type: 'tool_use', name: 'Edit', input: { file_path: '/work/a.js' } },
				],
			},
		},
		{ type: 'result', result: 'Done.', total_cost_usd: 0.01, is_error: false },
	]
		.map( ( event ) => JSON.stringify( event ) )
		.join( '\n' );
	assert.deepEqual( parseStream( `${ stream }\nnot json` ), {
		response: 'Done.',
		loaded: [ 'review-pr', 'unslop' ],
		tools: [ 'Skill', 'Read', 'Edit' ],
		cost: 0.01,
		completed: true,
	} );
	assert.equal( parseStream( '' ).completed, false );
} );

test( 'A/B runner applies each deterministic check type', () => {
	const trial = { response: 'Use git push --force-with-lease now.', loaded: [ 'unslop' ], tools: [ 'Read' ] };
	assert.equal( runCheck( { type: 'regex', pattern: '--force-with-lease' }, trial ), true );
	assert.equal( runCheck( { type: 'notRegex', pattern: '--force(?!-with-lease)' }, trial ), true );
	assert.equal( runCheck( { type: 'notRegex', pattern: '\\p{Extended_Pictographic}' }, { ...trial, response: 'Done 🎉' } ), false );
	assert.equal( runCheck( { type: 'maxWords', value: 5 }, trial ), true );
	assert.equal( runCheck( { type: 'maxWords', value: 4 }, trial ), false );
	assert.equal( runCheck( { type: 'noToolUse', tools: [ 'Edit', 'Bash' ] }, trial ), true );
	assert.equal( runCheck( { type: 'noToolUse', tools: [ 'Read' ] }, trial ), false );
	assert.equal( runCheck( { type: 'loads', skill: 'unslop' }, trial ), true );
	assert.equal( runCheck( { type: 'notLoads', skill: 'unslop' }, trial ), false );
	assert.throws( () => runCheck( { type: 'unknown' }, trial ), /Unknown check type/ );
} );

test( 'core evaluation fixture is complete and uses only supported checks', async () => {
	const directory = path.join( repoDir, 'instructions' );
	const fixture = JSON.parse( await readFile( path.join( directory, 'evals', 'evals.json' ), 'utf8' ) );
	const ids = new Set();
	assert.ok( fixture.outputCases.length >= 10 );
	for ( const testCase of fixture.outputCases ) {
		assert.ok( ! ids.has( testCase.id ), `${ testCase.id } is duplicated` );
		ids.add( testCase.id );
		assert.ok( testCase.prompt && testCase.expectedOutcome, `${ testCase.id } needs a prompt and an expected outcome` );
		assert.ok(
			( testCase.checks?.length ?? 0 ) + ( testCase.assertions?.length ?? 0 ) > 0,
			`${ testCase.id } needs a check or an assertion`
		);
		if ( testCase.context ) {
			await readFile( path.join( directory, testCase.context ), 'utf8' );
		}
		for ( const check of testCase.checks ?? [] ) {
			runCheck( check, { response: '', loaded: [], tools: [] } );
		}
	}
} );
