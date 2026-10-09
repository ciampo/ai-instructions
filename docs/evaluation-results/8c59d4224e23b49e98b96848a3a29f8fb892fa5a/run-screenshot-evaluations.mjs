import { spawn, spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [ repository, revision, mode, destination ] = process.argv.slice( 2 );
if ( ! repository || ! /^[a-f0-9]{40}$/.test( revision ) || ! [ 'focused', 'full' ].includes( mode ) || ! destination ) {
	throw new Error( 'Usage: runner <repository> <revision> <focused|full> <result.json>' );
}
function git( args ) {
	const result = spawnSync( 'git', args, { cwd: repository, encoding: 'utf8' } );
	if ( result.status !== 0 ) throw new Error( result.stderr );
	return result.stdout;
}
const root = await fs.mkdtemp( '/private/tmp/screenshot-evaluation-' );
const staged = path.join( root, 'public' );
const client = path.join( root, 'client' );
await fs.mkdir( staged );
await fs.mkdir( client, { mode: 0o700 } );
await fs.copyFile( path.join( process.env.CODEX_HOME ?? path.join( os.homedir(), '.codex' ), 'auth.json' ), path.join( client, 'auth.json' ) );
await fs.chmod( path.join( client, 'auth.json' ), 0o600 );
const archive = spawnSync( 'git', [ 'archive', revision, 'skills' ], { cwd: repository, maxBuffer: 16 * 1024 * 1024 } );
if ( archive.status !== 0 ) throw new Error( 'Cannot stage exact skill revision.' );
const extract = spawnSync( 'tar', [ '-xf', '-', '-C', staged ], { input: archive.stdout } );
if ( extract.status !== 0 ) throw new Error( 'Cannot extract exact skill revision.' );
const fixture = JSON.parse( git( [ 'show', `${ revision }:skills/take-screenshots/evals/evals.json` ] ) );
const jobs = fixture.outputCases.map( ( testCase ) => ( { kind: 'decision', ...testCase } ) );
if ( mode === 'full' ) for ( const testCase of fixture.triggerCases ) for ( let attempt = 1; attempt <= 3; attempt++ ) jobs.push( { kind: 'trigger', attempt, ...testCase } );
const quote = ( value ) => JSON.stringify( value );
const table = ( object ) => `{ ${ Object.entries( object ).map( ( [ key, value ] ) => `${ quote( key ) } = ${ quote( value ) }` ).join( ', ' ) } }`;
const results = [];
let next = 0;
async function run( job, index ) {
	const home = path.join( staged, `case-${ index }` );
	await fs.mkdir( path.join( home, '.agents' ), { recursive: true } );
	await fs.symlink( path.join( staged, 'skills' ), path.join( home, '.agents', 'skills' ) );
	const workspace = path.join( home, 'workspace' );
	await fs.mkdir( workspace );
	const boundary = { filesystem: { ':root': 'read', '/Users': 'deny', '/private': 'deny', [ staged ]: 'read', [ client ]: 'deny' }, network: { mode: 'restricted' } };
	const filesystem = table( boundary.filesystem );
	const profile = `{ filesystem = ${ filesystem }, network = { mode = "limited" } }`;
	const shellEnvironment = table( { HOME: home, PATH: '/usr/bin:/bin:/usr/sbin:/sbin', ZDOTDIR: workspace, LANG: 'en_US.UTF-8' } );
	const prompt = job.kind === 'trigger'
		? `${ job.prompt }\nThis is an isolated routing evaluation. Read the SKILL.md entrypoints of applicable installed skills with cat before responding so selection is observable. Do not perform browser, network, or write operations. Explain only what the supplied information permits.`
		: `Read ${ path.join( staged, 'skills/take-screenshots/SKILL.md' ) } with cat, then answer this simulated screenshot request: ${ job.prompt }\n\n${ git( [ 'show', `${ revision }:skills/take-screenshots/${ job.context }` ] ) }\n\nThis is a decision-only evaluation. The capabilities described above are hypothetical, not live tools. Describe the intended tool-call sequence, parameters, capture framing, verification, and delivery. Do not call browser tools or claim operations were performed. Use only supplied facts and installed skill instructions.`;
	const args = [ 'exec', '--ephemeral', '--skip-git-repo-check', '--ignore-user-config', '--ignore-rules', '--json', '-C', workspace,
		'-c', 'default_permissions="evaluation"', '-c', `permissions.evaluation=${ profile }`, '-c', 'shell_environment_policy.inherit="none"', '-c', `shell_environment_policy.set=${ shellEnvironment }` ];
	for ( const feature of [ 'plugins', 'apps', 'memories', 'hooks', 'multi_agent', 'browser_use', 'computer_use', 'remote_plugin' ] ) args.push( '--disable', feature );
	args.push( '-' );
	const child = spawn( 'codex', args, { env: { ...process.env, HOME: home, CODEX_HOME: client }, stdio: [ 'pipe', 'pipe', 'pipe' ] } );
	let stdout = '', stderr = '';
	child.stdout.on( 'data', ( chunk ) => stdout += chunk );
	child.stderr.on( 'data', ( chunk ) => stderr += chunk );
	child.stdin.end( prompt );
	let timedOut = false;
	const timeout = setTimeout( () => { timedOut = true; child.kill( 'SIGTERM' ); }, 180_000 );
	const exitCode = await new Promise( ( resolve ) => child.on( 'close', resolve ) );
	clearTimeout( timeout );
	const events = stdout.split( '\n' ).filter( Boolean ).flatMap( ( line ) => { try { return [ JSON.parse( line ) ]; } catch { return []; } } );
	const items = events.filter( ( event ) => event.type === 'item.completed' ).map( ( event ) => event.item );
	const commands = items.filter( ( item ) => item.type === 'command_execution' ).map( ( item ) => ( { command: item.command, output: item.aggregated_output, exitCode: item.exit_code } ) );
	const loaded = [ ...new Set( commands.flatMap( ( item ) => [ ...String( item.output ).matchAll( /^name: ([a-z0-9-]+)$/gm ) ].map( ( match ) => match[ 1 ] ) ) ) ];
	const result = { kind: job.kind, id: job.id, attempt: job.attempt, expectedTrigger: job.shouldTrigger, loaded, exitCode, timedOut,
		pass: job.kind === 'trigger' ? exitCode === 0 && loaded.includes( 'take-screenshots' ) === job.shouldTrigger : undefined,
		response: items.filter( ( item ) => item.type === 'agent_message' ).map( ( item ) => item.text ).join( '\n' ), commands,
		errors: events.filter( ( event ) => event.type === 'error' ).map( ( event ) => event.message ), stderr: stderr.slice( -2000 ) };
	results.push( result );
	console.log( `${ index + 1 }/${ jobs.length } ${ job.kind } ${ job.id } exit=${ exitCode } loaded=${ loaded.join( ',' ) }` );
}
try {
	await Promise.all( Array.from( { length: 3 }, async () => { while ( next < jobs.length ) { const index = next++; await run( jobs[ index ], index ); } } ) );
	const sanitize = ( text ) => text.replaceAll( root, '[evaluation]' ).replaceAll( repository, '[repository]' ).replaceAll( os.homedir(), '[home]' ).replace( /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '[thread]' ).replace( /\b(?:sk-|gh[opsu]_)[A-Za-z0-9_-]+\b/g, '[secret]' );
	await fs.writeFile( destination, sanitize( JSON.stringify( { revision, skillsTree: git( [ 'rev-parse', `${ revision }:skills` ] ).trim(), mode, client: spawnSync( 'codex', [ '--version' ], { encoding: 'utf8' } ).stdout.trim(), model: 'CLI default; no model override', limitation: 'Decision outputs simulate capabilities. No live browser capture was executed.', results }, null, 2 ) ) + '\n' );
} finally {
	await fs.rm( root, { recursive: true, force: true } );
}
