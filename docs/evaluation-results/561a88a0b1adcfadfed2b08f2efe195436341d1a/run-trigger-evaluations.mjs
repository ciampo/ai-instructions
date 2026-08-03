#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promises as fs, realpathSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const targetRevision = '561a88a0b1adcfadfed2b08f2efe195436341d1a';
const attemptsPerCase = 3;
const concurrency = 3;
const timeoutMs = 90_000;
const model = 'gpt-5.6-sol';
const reasoningEffort = 'xhigh';
const serviceTier = 'priority';
const temporaryRoots = [
	...new Set( [ os.tmpdir(), realpathSync( os.tmpdir() ) ] ),
];

const scriptPath = fileURLToPath( import.meta.url );
const repositoryRoot = path.resolve( path.dirname( scriptPath ), '../../..' );
const outputFlag = process.argv.indexOf( '--output' );

if ( outputFlag === -1 || ! process.argv[ outputFlag + 1 ] ) {
	throw new Error( 'Usage: run-trigger-evaluations.mjs --output <path>' );
}

const outputPath = path.resolve( process.argv[ outputFlag + 1 ] );

function runGit( args ) {
	const result = spawnSync( 'git', args, {
		cwd: repositoryRoot,
		encoding: 'utf8',
	} );

	if ( result.status !== 0 ) {
		throw new Error( result.stderr || `git ${ args.join( ' ' ) } failed` );
	}

	return result.stdout.trim();
}

async function loadCases() {
	const skillNames = ( await fs.readdir( path.join( repositoryRoot, 'skills' ) ) )
		.sort();
	const cases = [];

	for ( const skill of skillNames ) {
		const fixturePath = path.join(
			repositoryRoot,
			'skills',
			skill,
			'evals',
			'evals.json'
		);
		const fixture = JSON.parse( await fs.readFile( fixturePath, 'utf8' ) );

		for ( const triggerCase of fixture.triggerCases ) {
			cases.push( {
				skill,
				caseId: triggerCase.id,
				prompt: triggerCase.prompt,
				shouldTrigger: triggerCase.shouldTrigger,
			} );
		}
	}

	return cases;
}

async function collectProvenance( skillNames ) {
	const skillStatus = spawnSync(
		'git',
		[ 'status', '--porcelain=v1', '--untracked-files=all', '--', 'skills' ],
		{ cwd: repositoryRoot, encoding: 'utf8' }
	);

	if ( skillStatus.status !== 0 || skillStatus.stdout.trim() ) {
		throw new Error( 'The checkout skill tree has tracked or untracked changes.' );
	}

	const installedRoot = path.join( os.homedir(), '.agents', 'skills' );
	const skills = [];

	for ( const skill of skillNames ) {
		const installedPath = path.join( installedRoot, skill );
		const expectedPath = path.join( repositoryRoot, 'skills', skill );
		const installedTarget = await fs.realpath( installedPath );

		if ( installedTarget !== expectedPath ) {
			throw new Error( `${ skill } does not resolve to the evaluated checkout.` );
		}

		const targetTree = runGit( [
			'rev-parse',
			`${ targetRevision }:skills/${ skill }`,
		] );
		const checkoutTree = runGit( [ 'rev-parse', `HEAD:skills/${ skill }` ] );

		if ( targetTree !== checkoutTree ) {
			throw new Error( `${ skill } does not match the target tree.` );
		}

		skills.push( {
			name: skill,
			targetTree,
			checkoutTree,
			installedTarget: `skills/${ skill }`,
			match: true,
		} );
	}

	return {
		method: 'Each user-level skill resolved to this checkout, whose complete skills tree matched the target revision.',
		installedRoot: '~/.agents/skills',
		skills,
	};
}

function sanitize( value ) {
	let sanitized = value
		.replaceAll( repositoryRoot, '[repository]' )
		.replaceAll( os.homedir(), '[home]' );

	for ( const temporaryRoot of temporaryRoots ) {
		sanitized = sanitized.replaceAll(
			`${ temporaryRoot }${ path.sep }`,
			'[temporary]/'
		);
	}

	return sanitized;
}

function escapeRegExp( value ) {
	return value.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}

function loadedSkillNames( command, aggregatedOutput, exitCode ) {
	if ( exitCode !== 0 ) {
		return [];
	}

	const matches = [
		...command.matchAll( /(?:^|\s|['"])(?:[^\s'"]*\/)?skills\/([^/\s'"]+)\/SKILL\.md/g ),
	];

	return [ ...new Set( matches.map( ( match ) => match[ 1 ] ) ) ].filter(
		( skill ) =>
			new RegExp(
				`(?:^|\\n)---\\r?\\nname:\\s*${ escapeRegExp( skill ) }\\r?\\n`
			).test( aggregatedOutput )
	);
}

function descendantProcessIds( parentPid, seen = new Set() ) {
	const result = spawnSync( 'pgrep', [ '-P', String( parentPid ) ], {
		encoding: 'utf8',
	} );
	const childPids = result.status === 0
		? result.stdout.trim().split( '\n' ).map( Number ).filter( Boolean )
		: [];
	const descendants = [];

	for ( const childPid of childPids ) {
		if ( seen.has( childPid ) ) {
			continue;
		}

		seen.add( childPid );
		descendants.push( ...descendantProcessIds( childPid, seen ), childPid );
	}

	return descendants;
}

function signalProcessTree( child, signal ) {
	const processIds = [ ...descendantProcessIds( child.pid ), child.pid ];

	for ( const processId of processIds ) {
		try {
			process.kill( processId, signal );
		} catch ( error ) {
			if ( error.code !== 'ESRCH' ) {
				throw error;
			}
		}
	}
}

async function runAttempt( testCase, attempt, ordinal ) {
	const workspace = await fs.mkdtemp(
		path.join( os.tmpdir(), 'ai-instructions-trigger-' )
	);
	const startedAt = Date.now();
	const observedSkills = [];
	const skillLoadEvents = [];
	const messages = [];
	let completed = false;
	let timedOut = false;
	let intentionallyStopped = false;
	let stdoutBuffer = '';
	let killTimer;

	const args = [
		'exec',
		'--ephemeral',
		'--skip-git-repo-check',
		'--sandbox',
		'read-only',
		'--json',
		'--ignore-user-config',
		'--ignore-rules',
		'--disable',
		'plugins',
		'--disable',
		'apps',
		'--disable',
		'browser_use',
		'--disable',
		'browser_use_external',
		'--disable',
		'in_app_browser',
		'--disable',
		'computer_use',
		'--disable',
		'image_generation',
		'--disable',
		'multi_agent',
		'--disable',
		'memories',
		'--disable',
		'hooks',
		'--disable',
		'remote_plugin',
		'--disable',
		'tool_suggest',
		'--model',
		model,
		'-c',
		`model_reasoning_effort="${ reasoningEffort }"`,
		'-c',
		`service_tier="${ serviceTier }"`,
		'-C',
		workspace,
		testCase.prompt,
	];

	const child = spawn( 'codex', args, {
		cwd: workspace,
		stdio: [ 'ignore', 'pipe', 'pipe' ],
	} );

	function requestStop() {
		signalProcessTree( child, 'SIGTERM' );
		killTimer ||= setTimeout( () => {
			signalProcessTree( child, 'SIGKILL' );
		}, 2_000 );
	}

	function inspectLine( line ) {
		if ( ! line.trim().startsWith( '{' ) ) {
			return;
		}

		let event;
		try {
			event = JSON.parse( line );
		} catch {
			return;
		}

		if ( event.type === 'turn.completed' ) {
			completed = true;
		}

		if (
			event.type === 'item.completed' &&
			event.item?.type === 'agent_message'
		) {
			messages.push( sanitize( event.item.text ) );
		}

		if (
			event.type === 'item.completed' &&
			event.item?.type === 'command_execution'
		) {
			for ( const skill of loadedSkillNames(
				event.item.command,
				event.item.aggregated_output,
				event.item.exit_code
			) ) {
				if ( ! observedSkills.includes( skill ) ) {
					observedSkills.push( skill );
					skillLoadEvents.push( {
						skill,
						command: sanitize( event.item.command ),
						exitCode: event.item.exit_code,
						outputSha256: createHash( 'sha256' )
							.update( event.item.aggregated_output )
							.digest( 'hex' ),
					} );
				}
			}

			if ( testCase.shouldTrigger && observedSkills.length > 0 ) {
				intentionallyStopped = true;
				requestStop();
			}
		}
	}

	child.stdout.setEncoding( 'utf8' );
	child.stdout.on( 'data', ( chunk ) => {
		stdoutBuffer += chunk;
		const lines = stdoutBuffer.split( '\n' );
		stdoutBuffer = lines.pop();
		for ( const line of lines ) {
			inspectLine( line );
		}
	} );

	const timeout = setTimeout( () => {
		timedOut = true;
		requestStop();
	}, timeoutMs );

	const close = await new Promise( ( resolve, reject ) => {
		child.on( 'error', reject );
		child.on( 'close', ( exitCode, signal ) => resolve( { exitCode, signal } ) );
	} );

	clearTimeout( timeout );
	clearTimeout( killTimer );
	if ( stdoutBuffer ) {
		inspectLine( stdoutBuffer );
	}

	await fs.rm( workspace, { recursive: true, force: true } );

	let status;
	if ( testCase.shouldTrigger ) {
		status = observedSkills.length === 0
			? 'blocked'
			: observedSkills[ 0 ] === testCase.skill
				? 'pass'
				: 'fail';
	} else if ( observedSkills.includes( testCase.skill ) ) {
		status = 'fail';
	} else {
		status = completed ? 'pass' : 'blocked';
	}

	return {
		ordinal,
		...testCase,
		attempt,
		observedSkills,
		status,
		completed,
		intentionallyStopped,
		timedOut,
		exitCode: close.exitCode,
		signal: close.signal,
		durationMs: Date.now() - startedAt,
		messages,
		skillLoadEvents,
	};
}

async function writeOutput( campaign ) {
	await fs.writeFile( outputPath, `${ JSON.stringify( campaign, null, 2 ) }\n` );
}

const cases = await loadCases();
const attempts = cases.flatMap( ( testCase, caseIndex ) =>
	Array.from( { length: attemptsPerCase }, ( unused, index ) => ( {
		testCase,
		attempt: index + 1,
		ordinal: caseIndex * attemptsPerCase + index,
	} ) )
);
const skillNames = [ ...new Set( cases.map( ( testCase ) => testCase.skill ) ) ];
const provenance = await collectProvenance( skillNames );
const campaign = {
	schemaVersion: 2,
	repositoryRevision: targetRevision,
	fixtureRevision: targetRevision,
	runner: {
		path: path.relative( repositoryRoot, scriptPath ),
		sha256: createHash( 'sha256' )
			.update( await fs.readFile( scriptPath ) )
			.digest( 'hex' ),
	},
	client: {
		name: 'Codex CLI',
		version: spawnSync( 'codex', [ '--version' ], { encoding: 'utf8' } )
			.stdout.trim()
			.replace( /^codex-cli /, '' ),
		model,
		reasoningEffort,
		serviceTier,
		environment: `${ os.type() } ${ os.release() } ${ os.arch() }`,
	},
	execution: {
		attemptsPerCase,
		concurrency,
		timeoutSeconds: timeoutMs / 1000,
		workspace: 'Fresh outside-repository temporary directory for every attempt.',
		ambientCapabilities: 'User config, rules, plugins, apps, browser, computer use, image generation, multi-agent, memory, hooks, remote plugins, and tool suggestions disabled.',
		positiveStop: 'Stop after the first observed skill load.',
		negativeStop: 'Run to turn completion or timeout and record every observed skill load.',
	},
	provenance,
	results: [],
};

let nextAttempt = 0;
let completedAttempts = 0;

async function worker() {
	while ( nextAttempt < attempts.length ) {
		const current = attempts[ nextAttempt ];
		nextAttempt += 1;
		const result = await runAttempt(
			current.testCase,
			current.attempt,
			current.ordinal
		);
		campaign.results.push( result );
		campaign.results.sort( ( left, right ) => left.ordinal - right.ordinal );
		completedAttempts += 1;
		process.stderr.write(
			`${ completedAttempts }/${ attempts.length } ${ result.skill }/${ result.caseId }#${ result.attempt }: ${ result.status }\n`
		);
		await writeOutput( campaign );
	}
}

await Promise.all( Array.from( { length: concurrency }, () => worker() ) );
await writeOutput( campaign );
