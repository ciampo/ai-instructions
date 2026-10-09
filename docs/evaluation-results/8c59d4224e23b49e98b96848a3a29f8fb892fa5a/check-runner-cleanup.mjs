import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const [ runner, repository ] = process.argv.slice( 2 );
if ( ! runner || ! repository ) throw new Error( 'Usage: cleanup check <runner> <repository>' );
const fixture = await fs.mkdtemp( '/private/tmp/synthetic-screenshot-evaluation-' );
try {
	await fs.writeFile( path.join( fixture, 'auth.json' ), '{"fixture":"synthetic credential"}', { mode: 0o600 } );
	const results = [];
	for ( const kind of [ 'setup', 'launch' ] ) {
		const ownedRoot = path.join( fixture, kind );
		const preload = path.join( fixture, `${ kind }-preload.mjs` );
		await fs.writeFile( preload, `
import fs from 'node:fs';
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
const mkdtemp = fs.promises.mkdtemp.bind(fs.promises);
fs.promises.mkdtemp = async (prefix, ...args) => {
  if (!String(prefix).startsWith('/private/tmp/screenshot-evaluation-')) return mkdtemp(prefix, ...args);
  await fs.promises.mkdir(${ JSON.stringify( ownedRoot ) });
  return ${ JSON.stringify( ownedRoot ) };
};
${ kind === 'launch' ? "const spawn = childProcess.spawn; childProcess.spawn = (command, args, options) => spawn('nonexistent-screenshot-evaluator-fixture', args, options); syncBuiltinESMExports();" : '' }
` );
		const output = path.join( fixture, `${ kind }-result.json` );
		const revision = kind === 'setup' ? '0'.repeat( 40 ) : '8c59d4224e23b49e98b96848a3a29f8fb892fa5a';
		const child = spawnSync( process.execPath, [ '--import', preload, path.resolve( runner ), path.resolve( repository ), revision, 'focused', output ], { env: { ...process.env, CODEX_HOME: fixture }, encoding: 'utf8' } );
		const removed = await fs.access( ownedRoot ).then( () => false, ( error ) => error.code === 'ENOENT' );
		let recorded = false;
		if ( kind === 'launch' && child.status === 0 ) {
			const campaign = JSON.parse( await fs.readFile( output, 'utf8' ) );
			recorded = campaign.results.length === 4 && campaign.results.every( ( result ) => result.exitCode !== 0 && result.stderr.includes( 'ENOENT' ) );
		}
		results.push( { kind, exitCode: child.status, temporaryRootRemoved: removed, pass: removed && ( kind === 'setup' ? child.status !== 0 : recorded ) } );
	}
	console.log( JSON.stringify( results ) );
	assert.ok( results.every( ( result ) => result.pass ), 'Failed setup or launch must remove temporary credentials and report the failure.' );
} finally {
	await fs.rm( fixture, { recursive: true, force: true } );
}
