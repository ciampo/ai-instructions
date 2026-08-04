#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
	promises as fs,
	realpathSync,
	rmSync,
	unlinkSync,
} from 'node:fs';
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
	'ZDOTDIR',
];
const modelShellEnvironmentKeys = childEnvironmentKeys.filter(
	( key ) => key !== 'CODEX_HOME'
);
const temporaryRoots = [
	...new Set( [ os.tmpdir(), realpathSync( os.tmpdir() ) ] ),
].sort( ( left, right ) => right.length - left.length );
const sensitiveRoots = new Set();

const scriptPath = fileURLToPath( import.meta.url );
const repositoryRoot = path.resolve( path.dirname( scriptPath ), '../../..' );
const outputFlag = process.argv.indexOf( '--output' );

if ( process.argv.includes( '--verify-classifier' ) ) {
	verifyClassifier();
	await verifyEnvironmentContract();
	process.stdout.write( 'Classifier and environment self-checks passed.\n' );
	process.exit( 0 );
}

if ( outputFlag === -1 || ! process.argv[ outputFlag + 1 ] ) {
	throw new Error( 'Usage: run-trigger-evaluations.mjs --output <path>' );
}

const outputPath = path.resolve( process.argv[ outputFlag + 1 ] );
const outputTemporaryPath = path.join(
	path.dirname( outputPath ),
	`.${ path.basename( outputPath ) }.${ process.pid }.tmp`
);
const codexExecutable = resolveExecutable( 'codex' );

for ( const [ signal, exitCode ] of [
	[ 'SIGHUP', 129 ],
	[ 'SIGINT', 130 ],
	[ 'SIGTERM', 143 ],
] ) {
	process.on( signal, () => {
		for ( const root of sensitiveRoots ) {
			rmSync( root, { recursive: true, force: true } );
		}
		rmSync( outputTemporaryPath, { force: true } );
		process.exit( exitCode );
	} );
}

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
		const installedStats = await fs.lstat( installedPath );

		if ( ! installedStats.isDirectory() || installedStats.isSymbolicLink() ) {
			throw new Error( `${ skill } is not a staged target directory.` );
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
			installedTarget: `${ targetRevision }:skills/${ skill }`,
			match: true,
		} );
	}

	return {
		method: 'The complete checkout skills tree, including ignored-file absence, matched the target revision when fixtures were loaded. Git archive materialized a read-only target-revision skill tree before workers started. Every attempt linked exactly that staged inventory into a fresh isolated home.',
		installedRoot: '[per-attempt-home]/.agents/skills',
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
	const stageRoot = path.join( root, 'stage' );
	await fs.mkdir( stageRoot );

	const archive = spawnSync(
		'git',
		[ 'archive', '--format=tar', targetRevision, 'skills' ],
		{
			cwd: repositoryRoot,
			maxBuffer: 64 * 1024 * 1024,
		}
	);

	if ( archive.error || archive.status !== 0 ) {
		throw new Error(
			archive.error?.message ||
				archive.stderr?.toString() ||
				'git archive failed.'
		);
	}

	const extraction = spawnSync( 'tar', [ '-xf', '-', '-C', stageRoot ], {
		input: archive.stdout,
	} );

	if ( extraction.error || extraction.status !== 0 ) {
		throw new Error(
			extraction.error?.message ||
				extraction.stderr?.toString() ||
				'tar extraction failed.'
		);
	}

	const installedRoot = path.join( stageRoot, 'skills' );
	const stagedSkillNames = ( await fs.readdir( installedRoot ) ).sort();

	if ( JSON.stringify( stagedSkillNames ) !== JSON.stringify( skillNames ) ) {
		throw new Error( 'The staged target skill inventory is not exact.' );
	}

	const readOnly = spawnSync( 'chmod', [ '-R', 'a-w', installedRoot ] );

	if ( readOnly.error || readOnly.status !== 0 ) {
		throw new Error(
			readOnly.error?.message ||
				readOnly.stderr?.toString() ||
				'chmod failed.'
		);
	}

	return { installedRoot, root };
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

async function createShellConfiguration( root ) {
	const shellConfiguration = path.join( root, 'zsh' );
	const resetPath = `export PATH='${ isolatedPath }'\n`;

	await fs.mkdir( shellConfiguration );
	await Promise.all(
		[ '.zshenv', '.zprofile', '.zlogin' ].map( ( fileName ) =>
			fs.writeFile( path.join( shellConfiguration, fileName ), resetPath, {
				mode: 0o444,
			} )
		)
	);

	return shellConfiguration;
}

async function createAttemptEnvironment( isolatedEnvironment, skillNames ) {
	const root = await fs.mkdtemp(
		path.join( os.tmpdir(), 'ai-instructions-evaluation-attempt-' )
	);
	const sensitiveRoot = await fs.mkdtemp(
		path.join( os.tmpdir(), 'ai-instructions-client-state-' )
	);
	sensitiveRoots.add( sensitiveRoot );

	try {
		const userHome = path.join( root, 'home' );
		const installedRoot = path.join( userHome, '.agents', 'skills' );
		const workspace = path.join( root, 'workspace' );

		await fs.mkdir( installedRoot, { recursive: true } );
		await fs.mkdir( workspace );
		for ( const skill of skillNames ) {
			await fs.symlink(
				path.join( isolatedEnvironment.installedRoot, skill ),
				path.join( installedRoot, skill ),
				'dir'
			);
		}

		const installedSkillNames = ( await fs.readdir( installedRoot ) ).sort();

		if (
			JSON.stringify( installedSkillNames ) !== JSON.stringify( skillNames )
		) {
			throw new Error( 'A per-attempt installed skill inventory is not exact.' );
		}

		const codexHome = await createIsolatedCodexHome( sensitiveRoot );
		const shellConfiguration = await createShellConfiguration( root );

		return {
			codexHome,
			root,
			sensitiveRoot,
			shellConfiguration,
			userHome,
			workspace,
		};
	} catch ( error ) {
		await Promise.all( [
			fs.rm( root, { recursive: true, force: true } ),
			fs.rm( sensitiveRoot, { recursive: true, force: true } ),
		] );
		sensitiveRoots.delete( sensitiveRoot );
		throw error;
	}
}

function createChildEnvironment(
	userHome,
	codexHome,
	temporaryDirectory,
	shellConfiguration
) {
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
		ZDOTDIR: shellConfiguration,
	};
}

function createModelShellEnvironment( childEnvironment ) {
	return Object.fromEntries(
		Object.entries( childEnvironment ).filter(
			( [ key ] ) => key !== 'CODEX_HOME'
		)
	);
}

function formatTomlInlineTable( values ) {
	return `{ ${ Object.entries( values )
		.map( ( [ key, value ] ) => `${ key } = ${ JSON.stringify( value ) }` )
		.join( ', ' ) } }`;
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

	const frontmatter = '---\nname: target\ndescription: Test\n---\n';
	const command = '/bin/zsh -lc "sed -n 1,40p /tmp/skills/target/SKILL.md"';
	const detectorChecks = [
		[ command, frontmatter, 0, [ 'target' ] ],
		[ command, frontmatter, 1, [] ],
		[ command, 'name: target\n', 0, [] ],
		[ '/bin/zsh -lc "pwd"', frontmatter, 0, [] ],
	];

	for ( const [ detectorCommand, output, exitCode, expected ] of detectorChecks ) {
		const actual = loadedSkillNames( detectorCommand, output, exitCode );
		if ( JSON.stringify( actual ) !== JSON.stringify( expected ) ) {
			throw new Error(
				`Skill detector self-check failed: expected ${ expected }, received ${ actual }.`
			);
		}
	}
}

async function verifyEnvironmentContract() {
	const root = await fs.mkdtemp(
		path.join( os.tmpdir(), 'ai-instructions-environment-check-' )
	);

	try {
		const userHome = path.join( root, 'home' );
		const shellConfiguration = await createShellConfiguration( root );
		await fs.mkdir( userHome );
		const environment = createChildEnvironment(
			userHome,
			path.join( root, 'codex-home' ),
			path.join( root, 'tmp' ),
			shellConfiguration
		);
		const actualKeys = Object.keys( environment ).sort();
		const modelShellEnvironment = createModelShellEnvironment( environment );
		const actualModelShellKeys = Object.keys( modelShellEnvironment ).sort();

		if (
			JSON.stringify( actualKeys ) !==
			JSON.stringify( childEnvironmentKeys )
		) {
			throw new Error( 'Environment self-check failed: unexpected variables.' );
		}

		if (
			JSON.stringify( actualModelShellKeys ) !==
			JSON.stringify( modelShellEnvironmentKeys ) ||
			'CODEX_HOME' in modelShellEnvironment
		) {
			throw new Error(
				'Environment self-check failed: model shell can locate client state.'
			);
		}

		if (
			environment.HOME === os.homedir() ||
			environment.CODEX_HOME === sourceCodexHome
		) {
			throw new Error( 'Environment self-check failed: host state is exposed.' );
		}

		const loginShell = spawnSync(
			'/bin/zsh',
			[ '-lc', 'printf %s "$PATH"' ],
			{ encoding: 'utf8', env: modelShellEnvironment }
		);

		if ( loginShell.status !== 0 || loginShell.stdout !== isolatedPath ) {
			throw new Error(
				'Environment self-check failed: login shell changed PATH.'
			);
		}
	} finally {
		await fs.rm( root, { recursive: true, force: true } );
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

async function executeAttempt( testCase, attempt, ordinal, attemptEnvironment ) {
	const { codexHome, shellConfiguration, userHome, workspace } =
		attemptEnvironment;
	const clientEnvironment = createChildEnvironment(
		userHome,
		codexHome,
		workspace,
		shellConfiguration
	);
	const modelShellEnvironment = createModelShellEnvironment( clientEnvironment );
	const authenticationPath = path.join( codexHome, 'auth.json' );
	const startedAt = Date.now();
	const observedSkills = [];
	const skillLoadEvents = [];
	const commandEvents = [];
	const messages = [];
	const stdoutHash = createHash( 'sha256' );
	const stderrHash = createHash( 'sha256' );
	let completed = false;
	let timedOut = false;
	let intentionallyStopped = false;
	let authenticationRemoved = false;
	let authenticationBoundaryFailed = false;
	let stdoutBytes = 0;
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
		'-c',
		'shell_environment_policy.inherit="none"',
		'-c',
		`shell_environment_policy.set=${ formatTomlInlineTable(
			modelShellEnvironment
		) }`,
		'-C',
		workspace,
		testCase.prompt,
	];

	const child = spawn( codexExecutable, args, {
		cwd: workspace,
		detached: true,
		env: clientEnvironment,
		stdio: [ 'ignore', 'pipe', 'pipe' ],
	} );

	function requestStop() {
		stopPromise ||= ( async () => {
			signalProcessGroup( child.pid, 'SIGTERM' );
			await new Promise( ( resolve ) => setTimeout( resolve, 2_000 ) );
			signalProcessGroup( child.pid, 'SIGKILL' );
		} )();
	}

	function removeAuthenticationCopy() {
		if ( authenticationRemoved ) {
			return;
		}

		try {
			unlinkSync( authenticationPath );
			authenticationRemoved = true;
		} catch ( error ) {
			if ( error.code === 'ENOENT' ) {
				authenticationRemoved = true;
				return;
			}

			authenticationBoundaryFailed = true;
			requestStop();
		}
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

		const authenticationRemovedBeforeEvent = authenticationRemoved;
		removeAuthenticationCopy();

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
			if ( ! authenticationRemovedBeforeEvent ) {
				authenticationBoundaryFailed = true;
				requestStop();
				return;
			}

			const eventLoadedSkills = loadedSkillNames(
				event.item.command,
				event.item.aggregated_output,
				event.item.exit_code
			);
			const outputSha256 = createHash( 'sha256' )
				.update( event.item.aggregated_output )
				.digest( 'hex' );

			commandEvents.push( {
				command: sanitize( event.item.command ),
				exitCode: event.item.exit_code,
				outputSha256,
				loadedSkills: eventLoadedSkills,
			} );

			for ( const skill of eventLoadedSkills ) {
				if ( ! observedSkills.includes( skill ) ) {
					observedSkills.push( skill );
					skillLoadEvents.push( {
						skill,
						command: sanitize( event.item.command ),
						exitCode: event.item.exit_code,
						outputSha256,
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
		stdoutHash.update( chunk );
		stdoutBytes += Buffer.byteLength( chunk );
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

	const status = authenticationBoundaryFailed
		? 'blocked'
		: classifyAttempt( testCase, observedSkills, completed );

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
		commandEvents,
		skillLoadEvents,
		authentication: {
			removedBeforeCommands:
				authenticationRemoved && ! authenticationBoundaryFailed,
		},
		stdout: {
			bytes: stdoutBytes,
			sha256: stdoutHash.digest( 'hex' ),
		},
		stderr: {
			bytes: stderrBytes,
			sha256: stderrHash.digest( 'hex' ),
			preview: sanitize( stderrPreview ),
			truncated: stderrCharacters > stderrPreview.length,
		},
	};
}

async function runAttempt(
	testCase,
	attempt,
	ordinal,
	isolatedEnvironment,
	skillNames
) {
	const attemptEnvironment = await createAttemptEnvironment(
		isolatedEnvironment,
		skillNames
	);

	try {
		return await executeAttempt(
			testCase,
			attempt,
			ordinal,
			attemptEnvironment
		);
	} finally {
		await Promise.all( [
			fs.rm( attemptEnvironment.root, {
				recursive: true,
				force: true,
			} ),
			fs.rm( attemptEnvironment.sensitiveRoot, {
				recursive: true,
				force: true,
			} ),
		] );
		sensitiveRoots.delete( attemptEnvironment.sensitiveRoot );
	}
}

let outputWrite = Promise.resolve();

function writeOutput( campaign ) {
	const snapshot = `${ JSON.stringify( campaign, null, 2 ) }\n`;
	outputWrite = outputWrite.then( async () => {
		await fs.writeFile( outputTemporaryPath, snapshot );
		await fs.rename( outputTemporaryPath, outputPath );
	} );
	return outputWrite;
}

verifyClassifier();
await verifyEnvironmentContract();

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
		schemaVersion: 5,
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
			ambientCapabilities: 'No host environment or home directory inherited. Every attempt used a fresh isolated HOME, exact links to the read-only target-revision skill stage, and a fresh session store. A private authentication copy initialized the client, then was removed before any retained command event; model shell policy omitted CODEX_HOME. Login-shell profiles reset PATH to the recorded system-only value. User config, rules, plugins, apps, browser, computer use, image generation, multi-agent, memory, hooks, remote plugins, and tool suggestions disabled.',
			environmentVariables: childEnvironmentKeys,
			modelShellEnvironmentVariables: modelShellEnvironmentKeys,
			path: isolatedPath,
			loginShell: 'Isolated ZDOTDIR resets PATH in .zshenv, .zprofile, and .zlogin; the preflight executes /bin/zsh -lc and requires the recorded value.',
			authentication: 'Private client state used a separate temporary root with interruption cleanup. The auth copy was removed on the first client event, before command execution, and CODEX_HOME was excluded from model shell environments.',
			commandEvidence: 'Every completed command retained its sanitized command, exit code, loaded-skill classification, and full-output SHA-256. Every attempt retained a full stdout-stream SHA-256.',
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
				isolatedEnvironment,
				skillNames
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
	spawnSync( 'chmod', [ '-R', 'u+w', isolatedEnvironment.root ] );
	await Promise.all( [
		fs.rm( isolatedEnvironment.root, { recursive: true, force: true } ),
		fs.rm( outputTemporaryPath, { force: true } ),
	] );
}
