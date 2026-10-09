import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [ repository, revision, mode, destination ] = process.argv.slice( 2 );
if ( ! repository || ! /^[a-f0-9]{40}$/.test( revision ) || ! [ 'focused', 'full', 'baseline' ].includes( mode ) || ! destination ) {
  throw new Error( 'Usage: runner <repository> <revision> <focused|full|baseline> <result.json>' );
}
const skill = 'root-cause-solution';
const root = await fs.mkdtemp( '/private/tmp/root-cause-evaluation-' );
const activeChildren = new Set();
const table = object => `{ ${ Object.entries( object ).map( ( [ key, value ] ) => `${ JSON.stringify( key ) } = ${ JSON.stringify( value ) }` ).join( ', ' ) } }`;
function git( args ) {
  const result = spawnSync( 'git', args, { cwd: repository, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 } );
  if ( result.status !== 0 ) throw new Error( result.stderr || 'Git operation failed.' );
  return result.stdout;
}
function signalChild( child, signal ) {
  try { process.kill( -child.pid, signal ); } catch ( error ) { if ( error.code !== 'ESRCH' ) throw error; }
}
let interrupted = false;
for ( const signal of [ 'SIGINT', 'SIGTERM', 'SIGHUP' ] ) process.on( signal, () => {
  interrupted = true;
  for ( const child of activeChildren ) signalChild( child, 'SIGTERM' );
} );
try {
  const staged = path.join( root, 'public' );
  const client = path.join( root, 'client' );
  await fs.mkdir( staged );
  await fs.mkdir( client, { mode: 0o700 } );
  const sourceClient = process.env.CODEX_HOME ?? path.join( os.homedir(), '.codex' );
  await fs.copyFile( path.join( sourceClient, 'auth.json' ), path.join( client, 'auth.json' ) );
  await fs.chmod( path.join( client, 'auth.json' ), 0o600 );
  const archive = spawnSync( 'git', [ 'archive', revision, 'skills' ], { cwd: repository, maxBuffer: 32 * 1024 * 1024 } );
  if ( archive.status !== 0 ) throw new Error( 'Cannot stage exact skill revision.' );
  const extract = spawnSync( 'tar', [ '-xf', '-', '-C', staged ], { input: archive.stdout } );
  if ( extract.status !== 0 ) throw new Error( 'Cannot extract exact skill revision.' );
  if ( mode === 'baseline' ) await fs.rm( path.join( staged, 'skills', skill ), { recursive: true } );
  const fixture = JSON.parse( git( [ 'show', `${ revision }:skills/${ skill }/evals/evals.json` ] ) );
  const jobs = fixture.outputCases.map( testCase => ( { kind: 'output', ...testCase } ) );
  if ( mode === 'full' ) for ( const testCase of fixture.triggerCases ) for ( let attempt = 1; attempt <= 3; attempt++ ) jobs.push( { kind: 'trigger', attempt, ...testCase } );
  const filesystem = {
    ':root': 'read', '/Users': 'deny', '/Volumes': 'deny', '/Applications': 'deny',
    '/Library': 'deny', '/private': 'deny', '/tmp': 'deny', '/usr/local': 'deny',
    '/private/var/select': 'read', [ staged ]: 'read', [ client ]: 'deny',
  };
  const profile = `{ filesystem = ${ table( filesystem ) }, network = { mode = "limited" } }`;
  const deniedProbe = path.join( client, 'denied-probe' );
  const allowedProbe = path.join( staged, 'allowed-probe' );
  await fs.writeFile( deniedProbe, 'synthetic private probe' );
  await fs.writeFile( allowedProbe, 'synthetic public probe' );
  const boundary = spawnSync( 'codex', [ 'sandbox', '-P', 'evaluation', '-c', `permissions.evaluation=${ profile }`, '-C', staged, '--', '/bin/sh', '-c',
    'test -r "$1" && ! test -r "$2" && ! test -r "$3" && ! test -r "$4"', 'boundary', allowedProbe, deniedProbe, path.join( client, 'auth.json' ), path.join( sourceClient, 'auth.json' ) ], { encoding: 'utf8' } );
  if ( boundary.status !== 0 ) throw new Error( `Sandbox boundary check failed: ${ boundary.stderr }` );
  const results = [];
  let next = 0;
  async function run( job, index ) {
    const home = path.join( staged, `case-${ index }` );
    const workspace = path.join( home, 'workspace' );
    await fs.mkdir( path.join( home, '.agents' ), { recursive: true } );
    await fs.symlink( path.join( staged, 'skills' ), path.join( home, '.agents', 'skills' ) );
    await fs.mkdir( workspace );
    let prompt;
    if ( job.kind === 'trigger' ) {
      prompt = `${ job.prompt }\n\nThis is an isolated routing evaluation. Select skills from the installed catalog normally, and read only applicable SKILL.md entrypoints with cat so selection is observable. The request is hypothetical: do not implement it, write files, contact services, or invent missing project evidence. Explain only what the supplied information permits.`;
    } else {
      const context = git( [ 'show', `${ revision }:skills/${ skill }/${ job.context }` ] );
      await fs.writeFile( path.join( workspace, 'context.md' ), context );
      prompt = `${ mode === 'baseline' ? 'Use the remaining installed skills normally.' : `Read ${ path.join( staged, 'skills', skill, 'SKILL.md' ) } with cat, then follow it.` } Read context.md as the complete immutable scenario evidence. The described environments and capabilities are hypothetical, not live tools. Use only supplied evidence and installed instructions; do not contact services or write files. Return the answer the user should receive.\n\nUser request: ${ job.prompt }`;
    }
    const environment = { HOME: home, PATH: '/usr/bin:/bin:/usr/sbin:/sbin', ZDOTDIR: workspace, LANG: 'en_US.UTF-8', SHELL: '/bin/zsh', TERM: 'dumb' };
    const args = [ 'exec', '--ephemeral', '--skip-git-repo-check', '--ignore-user-config', '--ignore-rules', '--json', '-C', workspace,
      '-c', 'approval_policy="never"', '-c', 'default_permissions="evaluation"', '-c', `permissions.evaluation=${ profile }`,
      '-c', 'shell_environment_policy.inherit="none"', '-c', `shell_environment_policy.set=${ table( environment ) }`, '-c', 'web_search="disabled"' ];
    for ( const feature of [ 'plugins', 'apps', 'memories', 'hooks', 'multi_agent', 'browser_use', 'browser_use_external', 'in_app_browser', 'computer_use', 'image_generation', 'remote_plugin', 'tool_suggest' ] ) args.push( '--disable', feature );
    args.push( '-' );
    const child = spawn( 'codex', args, { env: { ...environment, PATH: process.env.PATH, CODEX_HOME: client }, stdio: [ 'pipe', 'pipe', 'pipe' ], detached: true } );
    activeChildren.add( child );
    let stdout = '', stderr = '', timedOut = false;
    child.on( 'error', error => { stderr += error.message; } );
    child.stdin.on( 'error', error => { stderr += error.message; } );
    child.stdout.on( 'data', chunk => { stdout += chunk; } );
    child.stderr.on( 'data', chunk => { stderr += chunk; } );
    child.stdin.end( prompt );
    let killTimer;
    const timeout = setTimeout( () => {
      timedOut = true;
      signalChild( child, 'SIGTERM' );
      killTimer = setTimeout( () => signalChild( child, 'SIGKILL' ), 2000 );
    }, 240_000 );
    const exitCode = await new Promise( resolve => child.on( 'close', resolve ) );
    clearTimeout( timeout );
    clearTimeout( killTimer );
    activeChildren.delete( child );
    const events = stdout.split( '\n' ).filter( Boolean ).flatMap( line => { try { return [ JSON.parse( line ) ]; } catch { return []; } } );
    const items = events.filter( event => event.type === 'item.completed' ).map( event => event.item );
    const commands = items.filter( item => item.type === 'command_execution' ).map( item => ( { command: item.command, output: item.aggregated_output, exitCode: item.exit_code } ) );
    const loaded = [ ...new Set( commands.filter( item => item.exitCode === 0 ).flatMap( item => [ ...String( item.output ).matchAll( /^name: ([a-z0-9-]+)$/gm ) ].map( match => match[ 1 ] ) ) ) ];
    const result = { kind: job.kind, id: job.id, attempt: job.attempt, expectedTrigger: job.shouldTrigger, prompt: job.prompt, loaded, exitCode, timedOut,
      pass: job.kind === 'trigger' ? exitCode === 0 && loaded.includes( skill ) === job.shouldTrigger : undefined,
      response: items.filter( item => item.type === 'agent_message' ).map( item => item.text ).join( '\n' ), commands,
      events: events.filter( event => ! [ 'item.started' ].includes( event.type ) ), stderr: stderr.slice( -3000 ) };
    results.push( result );
    console.log( `${ index + 1 }/${ jobs.length } ${ job.kind } ${ job.id } exit=${ exitCode } loaded=${ loaded.join( ',' ) }` );
  }
  await Promise.all( Array.from( { length: 3 }, async () => { while ( next < jobs.length && ! interrupted ) { const index = next++; await run( jobs[ index ], index ); } } ) );
  const sanitize = text => text.replaceAll( root, '[evaluation]' ).replaceAll( repository, '[repository]' ).replaceAll( os.homedir(), '[home]' )
    .replace( /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '[thread]' ).replace( /\b(?:sk-|gh[opsu]_)[A-Za-z0-9_-]+\b/g, '[secret]' );
  const report = { revision, skillsTree: git( [ 'rev-parse', `${ revision }:skills` ] ).trim(), mode, interrupted,
    runnerSha256: createHash( 'sha256' ).update( await fs.readFile( new URL( import.meta.url ) ) ).digest( 'hex' ),
    client: spawnSync( 'codex', [ '--version' ], { encoding: 'utf8' } ).stdout.trim(), model: 'CLI default; user config ignored; no model override',
    boundaryProbe: 'Sandbox command verified staged public read access and denial of synthetic private data, source authentication, and copied client authentication.',
    limitation: 'Read-only routing and recommendation evaluation. Trigger instructions require observable entrypoint reads. No implementation, native browser behavior, or additional runtime compatibility is executed.',
    results: results.sort( ( a, b ) => a.kind.localeCompare( b.kind ) || a.id.localeCompare( b.id ) || ( a.attempt ?? 0 ) - ( b.attempt ?? 0 ) ) };
  await fs.writeFile( destination, sanitize( JSON.stringify( report, null, 2 ) ) + '\n' );
} finally {
  for ( const child of activeChildren ) signalChild( child, 'SIGKILL' );
  await fs.rm( root, { recursive: true, force: true } );
}
