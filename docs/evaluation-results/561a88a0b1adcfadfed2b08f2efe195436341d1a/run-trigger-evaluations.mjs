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
const stderrPreviewLimit = 8_192;
const sourceCodexHome = process.env.CODEX_HOME ?? path.join( os.homedir(), '.codex' );
const sourceAuthPath = path.join( sourceCodexHome, 'auth.json' );
const isolatedPath = [ '/usr/bin', '/bin', '/usr/sbin', '/sbin' ].join(
	path.delimiter
);
const childEnvironmentKeys = [
	'CODEX_HOME',
	'HOME',
	'LANG',
	'LC_ALL',
	'NO_COLOR',
	'PATH',
	'SHELL',
	'TERM',
	'TMPDIR',
];
const temporaryRoots = [
	...new Set( [ os.tmpdir(), realpathSync( os.tmpdir() ) ] ),
];

const scriptPath = fileURLToPath( import.meta.url );
const repositoryRoot = path.resolve( path.dirname( scriptPath ), '../../..' );
const codexExecutable = resolveExecutable( 'codex' );
const outputFlag = process.argv.indexOf( '--output' );

if ( process.argv.includes( '--verify-classifier' ) ) {
	verifyClassifier();
	verifyEnvironmentContract();
	process.stdout.write( 'Classifier and environment self-checks passed.\n' );
	process.exit( 0 );
}

if ( outputFlag === -1 || ! process.argv[ outputFlag + 1 ] ) {
	throw new Error( 'Usage: run-trigger-evaluations.mjs --output <path>' );
}

const outputPath = path.resolve( process.argv[ outputFlag + 1 ] );

function resolveExecutable( name ) {
	const result = spawnSync( 'which', [ name ], { encoding: 'utf8' } );

	if ( result.status !== 0 || ! result.stdout.trim() ) {
		throw new Error( `Evaluation runner: ${ name } is not available.` );
	}

	return realpathSync( result.stdout.trim() );
}

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

function targetSkillNames() {
	return runGit( [
		'ls-tree',
		'--name-only',
		`${ targetRevision }:skills`,
	] )
		.split( '\n' )
		.filter( Boolean )
		.sort();
}

async function loadCases( skillNames ) {
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

async function collectProvenance( skillNames, installedRoot ) {
	const skillStatus = spawnSync(
		'git',
		[
			'status',
			'--porcelain=v1',
			'--untracked-files=all',
			'--ignored=matching',
			'--',
			'skills',
		],
		{ cwd: repositoryRoot, encoding: 'utf8' }
	);

	if ( skillStatus.status !== 0 || skillStatus.stdout.trim() ) {
		throw new Error(
			'The checkout skill tree has tracked, untracked, or ignored changes.'
		);
	}

	const targetTree = runGit( [ 'rev-parse', `${ targetRevision }:skills` ] );
	const checkoutTree = runGit( [ 'rev-parse', 'HEAD:skills' ] );

	if ( targetTree !== checkoutTree ) {
		throw new Error( 'The checkout skill tree does not match the target revision.' );
	}

	const installedSkillNames = ( await fs.readdir( installedRoot ) ).sort();

	if ( JSON.stringify( installedSkillNames ) !== JSON.stringify( skillNames ) ) {
		throw new Error( 'The isolated installed skill inventory is not exact.' );
	}

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
		method: 'The complete checkout skills tree, including ignored-file absence, matched the target revision. The isolated installed inventory contained exactly the target skills, and every entry resolved to this checkout.',
		installedRoot: '[isolated-home]/.agents/skills',
		installedSkillNames,
		targetTree,
		checkoutTree,
		skills,
	};
}

async function createIsolatedEnvironment( skillNames ) {
	const root = await fs.mkdtemp(
		path.join( os.tmpdir(), 'ai-instructions-evaluation-' )
	);
	const userHome = path.join( root, 'home' );
	const installedRoot = path.join( userHome, '.agents', 'skills' );

	await fs.mkdir( installedRoot, { recursive: true } );
	for ( const skill of skillNames ) {
		await fs.symlink(
			path.join( repositoryRoot, 'skills', skill ),
			path.join( installedRoot, skill ),
			'dir'
		);
	}

	return { installedRoot, root, userHome };
}

async function createIsolatedCodexHome( root ) {
	const isolatedCodexHome = await fs.mkdtemp(
		path.join( root, 'codex-home-' )
	);
	const isolatedAuthPath = path.join( isolatedCodexHome, 'auth.json' );

	await fs.copyFile( sourceAuthPath, isolatedAuthPath );
	await fs.chmod( isolatedAuthPath, 0o600 );

	return isolatedCodexHome;
}

function createChildEnvironment( userHome, codexHome, temporaryDirectory ) {
	return {
		CODEX_HOME: codexHome,
		HOME: userHome,
		LANG: 'C.UTF-8',
		LC_ALL: 'C.UTF-8',
		NO_COLOR: '1',
		PATH: isolatedPath,
		SHELL: '/bin/zsh',
		TERM: 'dumb',
		TMPDIR: temporaryDirectory,
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

function classifyAttempt( testCase, observedSkills, completed ) {
	const targetLoaded = observedSkills.includes( testCase.skill );

	if ( testCase.shouldTrigger ) {
		return targetLoaded ? 'pass' : completed ? 'fail' : 'blocked';
	}

	return targetLoaded ? 'fail' : completed ? 'pass' : 'blocked';
}

function verifyClassifier() {
	const target = { skill: 'target', shouldTrigger: true };
	const nearMiss = { skill: 'target', shouldTrigger: false };
	const checks = [
		[ target, [ 'target' ], false, 'pass' ],
		[ target, [ 'other', 'target' ], false, 'pass' ],
		[ target, [ 'other' ], true, 'fail' ],
		[ target, [], true, 'fail' ],
		[ target, [], false, 'blocked' ],
		[ nearMiss, [ 'other' ], true, 'pass' ],
		[ nearMiss, [ 'target' ], true, 'fail' ],
		[ nearMiss, [], false, 'blocked' ],
	];

	for ( const [ testCase, observedSkills, completed, expected ] of checks ) {
		const actual = classifyAttempt( testCase, observedSkills, completed );
		if ( actual !== expected ) {
			throw new Error(
				`Classifier self-check failed: expected ${ expected }, received ${ actual }.`
			);
		}
	}
}

function verifyEnvironmentContract() {
	const environment = createChildEnvironment(
		'/isolated/home',
		'/isolated/codex-home',
		'/isolated/tmp'
	);
	const actualKeys = Object.keys( environment ).sort();

	if ( JSON.stringify( actualKeys ) !== JSON.stringify( childEnvironmentKeys ) ) {
		throw new Error( 'Environment self-check failed: unexpected variables.' );
	}

	if (
		environment.HOME === os.homedir() ||
		environment.CODEX_HOME === sourceCodexHome
	) {
		throw new Error( 'Environment self-check failed: host state is exposed.' );
	}
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

function signalProcessGroup( processGroupId, signal ) {
	try {
		process.kill( -processGroupId, signal );
	} catch ( error ) {
		if ( error.code !== 'ESRCH' ) {
			throw error;
		}
	}
}

async function runAttempt( testCase, attempt, ordinal, isolatedEnvironment ) {
	const workspace = await fs.mkdtemp(
		path.join( isolatedEnvironment.root, 'workspace-' )
	);
	const isolatedCodexHome = await createIsolatedCodexHome(
		isolatedEnvironment.root
	);
	const startedAt = Date.now();
	const observedSkills = [];
	const skillLoadEvents = [];
	const messages = [];
	const stderrHash = createHash( 'sha256' );
	let completed = false;
	let timedOut = false;
	let intentionallyStopped = false;
	let stderrBytes = 0;
	let stderrCharacters = 0;
	let stderrPreview = '';
	let stdoutBuffer = '';
	let stopPromise;

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

	const child = spawn( codexExecutable, args, {
		cwd: workspace,
		detached: true,
		env: createChildEnvironment(
			isolatedEnvironment.userHome,
			isolatedCodexHome,
			workspace
		),
		stdio: [ 'ignore', 'pipe', 'pipe' ],
	} );

	function requestStop() {
		stopPromise ||= ( async () => {
			signalProcessGroup( child.pid, 'SIGTERM' );
			await new Promise( ( resolve ) => setTimeout( resolve, 2_000 ) );
			signalProcessGroup( child.pid, 'SIGKILL' );
		} )();
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

			if (
				testCase.shouldTrigger &&
				observedSkills.includes( testCase.skill )
			) {
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
	child.stderr.setEncoding( 'utf8' );
	child.stderr.on( 'data', ( chunk ) => {
		stderrHash.update( chunk );
		stderrBytes += Buffer.byteLength( chunk );
		stderrCharacters += chunk.length;
		const remainingCharacters = stderrPreviewLimit - stderrPreview.length;

		if ( remainingCharacters > 0 ) {
			stderrPreview += chunk.slice( 0, remainingCharacters );
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
	await stopPromise;
	if ( stdoutBuffer ) {
		inspectLine( stdoutBuffer );
	}

	await fs.rm( workspace, { recursive: true, force: true } );
	await fs.rm( isolatedCodexHome, { recursive: true, force: true } );

	const status = classifyAttempt( testCase, observedSkills, completed );

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
		stderr: {
			bytes: stderrBytes,
			sha256: stderrHash.digest( 'hex' ),
			preview: sanitize( stderrPreview ),
			truncated: stderrCharacters > stderrPreview.length,
		},
	};
}

let outputWrite = Promise.resolve();

function writeOutput( campaign ) {
	const snapshot = `${ JSON.stringify( campaign, null, 2 ) }\n`;
	outputWrite = outputWrite.then( () => fs.writeFile( outputPath, snapshot ) );
	return outputWrite;
}

verifyClassifier();
verifyEnvironmentContract();

const skillNames = targetSkillNames();
const cases = await loadCases( skillNames );
const attempts = cases.flatMap( ( testCase, caseIndex ) =>
	Array.from( { length: attemptsPerCase }, ( unused, index ) => ( {
		testCase,
		attempt: index + 1,
		ordinal: caseIndex * attemptsPerCase + index,
	} ) )
);
const isolatedEnvironment = await createIsolatedEnvironment( skillNames );

try {
	const provenance = await collectProvenance(
		skillNames,
		isolatedEnvironment.installedRoot
	);
	const campaign = {
		schemaVersion: 3,
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
			version: spawnSync( codexExecutable, [ '--version' ], {
				encoding: 'utf8',
			} )
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
			ambientCapabilities: 'No host environment or home directory inherited. One isolated HOME exposed exactly the pinned skill inventory. Each attempt used a fresh session store with a private authentication copy. User config, rules, plugins, apps, browser, computer use, image generation, multi-agent, memory, hooks, remote plugins, and tool suggestions disabled.',
			environmentVariables: childEnvironmentKeys,
			executablePath: isolatedPath,
			stderr: `Drained completely; retained a sanitized ${ stderrPreviewLimit }-character preview and full-stream SHA-256.`,
			positiveStop: 'Stop after the target skill loads.',
			negativeStop: 'Run to turn completion or timeout and record every observed skill load.',
			classification: 'Positive cases pass when the target loads and fail when a completed turn omits it. Negative cases fail when the target loads and pass only on completion without it. Incomplete attempts are blocked.',
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
				current.ordinal,
				isolatedEnvironment
			);
			campaign.results.push( result );
			campaign.results.sort(
				( left, right ) => left.ordinal - right.ordinal
			);
			completedAttempts += 1;
			process.stderr.write(
				`${ completedAttempts }/${ attempts.length } ${ result.skill }/${ result.caseId }#${ result.attempt }: ${ result.status }\n`
			);
			await writeOutput( campaign );
		}
	}

	await Promise.all( Array.from( { length: concurrency }, () => worker() ) );
	await writeOutput( campaign );
} finally {
	await fs.rm( isolatedEnvironment.root, { recursive: true, force: true } );
}
