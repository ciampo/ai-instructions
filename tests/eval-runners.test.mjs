import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repoDir = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '..' );
const revision = 'a'.repeat( 40 );
const runners = [
	{ file: 'run-output-evaluations.mjs', selfCheck: '--verify-self' },
	{ file: 'run-trigger-evaluations.mjs', selfCheck: '--verify-classifier' },
];

function run( file, args ) {
	return spawnSync( process.execPath, [ path.join( repoDir, 'scripts', 'evals', file ), ...args ], {
		encoding: 'utf8',
	} );
}

for ( const { file, selfCheck } of runners ) {
	test( `${ file } requires a full revision`, () => {
		for ( const args of [
			[ '--model', 'example-model', '--output', 'unused.json' ],
			[ '--revision', 'abc123', '--model', 'example-model', '--output', 'unused.json' ],
		] ) {
			const result = run( file, args );
			assert.notEqual( result.status, 0 );
			assert.match( result.stderr, /--revision requires a full 40-character commit SHA/ );
		}
	} );

	test( `${ file } requires an explicit model`, () => {
		const result = run( file, [ '--revision', revision, '--output', 'unused.json' ] );
		assert.notEqual( result.status, 0 );
		assert.match( result.stderr, /--model requires a model identifier/ );
	} );

	test( `${ file } rejects a malformed fixture revision`, () => {
		const result = run( file, [
			'--revision',
			revision,
			'--fixture-revision',
			'main',
			'--model',
			'example-model',
			'--output',
			'unused.json',
		] );
		assert.notEqual( result.status, 0 );
		assert.match( result.stderr, /--fixture-revision requires a full 40-character commit SHA/ );
	} );

	test(
		`${ file } passes its self-checks without campaign options`,
		{ skip: process.platform !== 'darwin' && 'The runners target macOS.' },
		() => {
			const result = run( file, [ selfCheck ] );
			assert.equal( result.status, 0, result.stderr );
			assert.match( result.stdout, /self-checks passed/ );
		}
	);
}
