#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
	promises as fs,
	realpathSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const targetRevision = 'f68829838cc13236adc0531bbd60f033ba6044f6';
const attemptsPerCase = 3;
const concurrency = 3;
const timeoutMs = 90_000;
const model = 'gpt-5.6-sol';
const reasoningEffort = 'xhigh';
const serviceTier = 'priority';
const stderrPreviewLimit = 8_192;
const permissionProfileName = 'evaluation';
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
const restrictedTemporaryRoots = [
	...new Set( [ os.tmpdir(), realpathSync( os.tmpdir() ) ] ),
].sort( ( left, right ) => right.length - left.length );
const conventionalTemporaryRoots = [ '/private/tmp', '/tmp' ].sort(
	( left, right ) => right.length - left.length
);
const hostIdentityReplacements = [
	[ os.userInfo().username, '[user]' ],
	[ os.hostname(), '[host]' ],
]
	.filter( ( [ value ] ) => value )
	.sort( ( [ left ], [ right ] ) => right.length - left.length );
const activeChildren = new Set();
const activeAttempts = new Set();
const ephemeralRoots = new Set();
const sensitiveRoots = new Set();
const clientHomeRoots = new Set();
let shuttingDown = false;
let shutdownPromise;

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
		shutdownPromise ||= shutdown( exitCode );
	} );
}

async function shutdown( exitCode ) {
	shuttingDown = true;
	for ( const child of activeChildren ) {
		signalProcessGroup( child.pid, 'SIGTERM' );
	}

	await Promise.race( [
		Promise.allSettled( [ ...activeAttempts ] ),
		new Promise( ( resolve ) => setTimeout( resolve, 2_000 ) ),
	] );

	for ( const child of activeChildren ) {
		signalProcessGroup( child.pid, 'SIGKILL' );
	}
	await Promise.allSettled( [ ...activeAttempts ] );

	for ( const root of ephemeralRoots ) {
		spawnSync( 'chmod', [ '-R', 'u+w', root ] );
	}
	const cleanup = await Promise.allSettled(
		[ ...sensitiveRoots, ...ephemeralRoots ].map( ( root ) =>
			fs.rm( root, {
				recursive: true,
				force: true,
				maxRetries: 3,
				retryDelay: 100,
			} )
		)
	);
	await fs.rm( outputTemporaryPath, { force: true } );

	for ( const result of cleanup ) {
		if ( result.status === 'rejected' ) {
			process.stderr.write( `Cleanup failed: ${ result.reason }\n` );
		}
	}
	process.exit( exitCode );
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
	ephemeralRoots.add( root );

	try {
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
	} catch ( error ) {
		await fs.rm( root, { recursive: true, force: true } );
		ephemeralRoots.delete( root );
		throw error;
	}
}

async function createIsolatedCodexHome( root ) {
	const isolatedCodexHome = await fs.mkdtemp(
		path.join( root, 'codex-home-' )
	);
	const isolatedAuthPath = path.join( isolatedCodexHome, 'auth.json' );

	await fs.copyFile( sourceAuthPath, isolatedAuthPath );
	await fs.chmod( isolatedAuthPath, 0o600 );
	clientHomeRoots.add( isolatedCodexHome );

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
	ephemeralRoots.add( root );
	let sensitiveRoot;
	let codexHome;

	try {
		sensitiveRoot = await fs.mkdtemp(
			path.join( os.tmpdir(), 'ai-instructions-client-state-' )
		);
		sensitiveRoots.add( sensitiveRoot );
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

		codexHome = await createIsolatedCodexHome( sensitiveRoot );
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
			sensitiveRoot
				? fs.rm( sensitiveRoot, { recursive: true, force: true } )
				: Promise.resolve(),
		] );
		ephemeralRoots.delete( root );
		sensitiveRoots.delete( sensitiveRoot );
		clientHomeRoots.delete( codexHome );
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

function createCodexExecArguments(
	workspace,
	prompt,
	modelShellEnvironment,
	profile
) {
	return [
		'exec',
		'--ephemeral',
		'--skip-git-repo-check',
		'--json',
		'--strict-config',
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
		'-c',
		`default_permissions="${ permissionProfileName }"`,
		'-c',
		`permissions.${ permissionProfileName }=${ profile }`,
		'-C',
		workspace,
		prompt,
	];
}

function formatTomlInlineTable( values ) {
	return `{ ${ Object.entries( values )
		.map(
			( [ key, value ] ) =>
				`${ JSON.stringify( key ) } = ${ JSON.stringify( value ) }`
		)
		.join( ', ' ) } }`;
}

function permissionProfile( readableRoots, deniedRoots = [] ) {
	const filesystem = new Map( [ [ '/', 'read' ], [ os.homedir(), 'deny' ] ] );

	for ( const temporaryRoot of restrictedTemporaryRoots ) {
		filesystem.set( temporaryRoot, 'deny' );
	}
	for ( const deniedRoot of deniedRoots ) {
		filesystem.set( deniedRoot, 'deny' );
		filesystem.set( realpathSync( deniedRoot ), 'deny' );
	}
	for ( const readableRoot of readableRoots ) {
		filesystem.set( readableRoot, 'read' );
		filesystem.set( realpathSync( readableRoot ), 'read' );
	}

	return `{ filesystem = ${ formatTomlInlineTable(
		Object.fromEntries( filesystem )
	) } }`;
}

async function verifySandboxReadBoundary() {
	const allowedRoot = await fs.mkdtemp(
		path.join( os.tmpdir(), 'ai-instructions-readable-boundary-' )
	);
	const deniedRoot = await fs.mkdtemp(
		path.join( os.tmpdir(), 'ai-instructions-denied-boundary-' )
	);
	ephemeralRoots.add( allowedRoot );
	ephemeralRoots.add( deniedRoot );

	try {
		const allowedProbe = path.join( allowedRoot, 'probe' );
		const deniedProbe = path.join( deniedRoot, 'probe' );
		await Promise.all( [
			fs.writeFile( allowedProbe, 'public' ),
			fs.writeFile( deniedProbe, 'private' ),
		] );
		const profile = permissionProfile( [ allowedRoot ] );
		const result = spawnSync(
			codexExecutable,
			[
				'sandbox',
				'-P',
				permissionProfileName,
				'-c',
				`permissions.${ permissionProfileName }=${ profile }`,
				'-C',
				allowedRoot,
				'--',
				'/bin/sh',
				'-c',
				'test -r "$1" && ! test -r "$2" && ! test -r "$3"',
				'boundary-check',
				allowedProbe,
				deniedProbe,
				sourceAuthPath,
			],
			{ encoding: 'utf8' }
		);

		if ( result.status !== 0 ) {
			throw new Error(
				result.stderr || 'Model-shell credential read boundary failed.'
			);
		}
	} finally {
		await Promise.all( [
			fs.rm( allowedRoot, { recursive: true, force: true } ),
			fs.rm( deniedRoot, { recursive: true, force: true } ),
		] );
		ephemeralRoots.delete( allowedRoot );
		ephemeralRoots.delete( deniedRoot );
	}
}

function sanitize( value ) {
	let sanitized = value.replaceAll(
		sourceAuthPath,
		'[source-client-home]/auth.json'
	);
	if ( sourceCodexHome !== path.parse( sourceCodexHome ).root ) {
		sanitized = sanitized
			.replaceAll(
				`${ sourceCodexHome }${ path.sep }`,
				'[source-client-home]/'
			)
			.replaceAll( sourceCodexHome, '[source-client-home]' );
	}
	sanitized = sanitized
		.replaceAll( repositoryRoot, '[repository]' )
		.replaceAll( os.homedir(), '[home]' )
		.replace( /\bCODEX_THREAD_ID=[^\s]+/g, 'CODEX_THREAD_ID=[thread]' )
		.replace(
			/(\b(?:no thread with id|thread id|thread_id)["']?\s*[:=]\s*["']?)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(["']?)/gi,
			'$1[thread]$2'
		);

	for ( const clientHomeRoot of [ ...clientHomeRoots ].sort(
		( left, right ) => right.length - left.length
	) ) {
		sanitized = sanitized
			.replaceAll( `${ clientHomeRoot }${ path.sep }`, '[client-home]/' )
			.replaceAll( clientHomeRoot, '[client-home]' );
	}
	for ( const sensitiveRoot of [ ...sensitiveRoots ].sort(
		( left, right ) => right.length - left.length
	) ) {
		sanitized = sanitized
			.replaceAll( `${ sensitiveRoot }${ path.sep }`, '[client-state]/' )
			.replaceAll( sensitiveRoot, '[client-state]' );
	}
	for ( const temporaryRoot of restrictedTemporaryRoots ) {
		sanitized = sanitized.replaceAll(
			`${ temporaryRoot }${ path.sep }`,
			'[temporary]/'
		);
		sanitized = sanitized.replaceAll( temporaryRoot, '[temporary]' );
	}
	for ( const temporaryRoot of conventionalTemporaryRoots ) {
		sanitized = sanitized.replace(
			new RegExp(
				`(^|[\\s'"=(])${ escapeRegExp( temporaryRoot ) }(?=\\/|$|[\\s'")])`,
				'g'
			),
			'$1[temporary]'
		);
	}
	for ( const [ value, replacement ] of hostIdentityReplacements ) {
		sanitized = sanitized.replaceAll( value, replacement );
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
	const numberedFrontmatter =
		'     1\t---\n' +
		'     2\tname: target\n' +
		'     3\tdescription: Test\n' +
		'     4\t---\n';
	const command = '/bin/zsh -lc "sed -n 1,40p /tmp/skills/target/SKILL.md"';
	const detectorChecks = [
		[ command, frontmatter, 0, [ 'target' ] ],
		[ '/bin/zsh -lc "cat SKILL.md"', frontmatter, 0, [ 'target' ] ],
		[ '/bin/zsh -lc "cat ./SKILL.md"', frontmatter, 0, [ 'target' ] ],
		[ 'cat /tmp/skills/target/SKILL.md; true', frontmatter, 0, [ 'target' ] ],
		[ 'cat /tmp/skills/target/SKILL.md&& true', frontmatter, 0, [ 'target' ] ],
		[ '(cat /tmp/skills/target/SKILL.md)', frontmatter, 0, [ 'target' ] ],
		[
			'/bin/zsh -lc "nl -ba /tmp/skills/target/SKILL.md"',
			numberedFrontmatter,
			0,
			[ 'target' ],
		],
		[
			'/bin/zsh -lc \\"cat /tmp/skills/target/SKILL.md\\"',
			frontmatter,
			0,
			[ 'target' ],
		],
		[ command, frontmatter, 1, [ 'target' ] ],
		[ command, 'name: target\n', 0, [] ],
		[ '/bin/zsh -lc "pwd"', frontmatter, 0, [] ],
		[ '/bin/zsh -lc "cat SKILL.md.bak"', frontmatter, 0, [] ],
		[ '/bin/zsh -lc "cat NOTSKILL.md"', frontmatter, 0, [] ],
	];

	for ( const [ detectorCommand, output, , expected ] of detectorChecks ) {
		const actual = loadedSkillNames( detectorCommand, output );
		if ( JSON.stringify( actual ) !== JSON.stringify( expected ) ) {
			throw new Error(
				`Skill detector self-check failed: expected ${ expected }, received ${ actual }.`
			);
		}
	}

	for ( const temporaryRoot of [
		...restrictedTemporaryRoots,
		...conventionalTemporaryRoots,
	] ) {
		if (
			sanitize( temporaryRoot ) !== '[temporary]' ||
			sanitize( path.join( temporaryRoot, 'child' ) ) !== '[temporary]/child'
		) {
			throw new Error( 'Temporary-root sanitizer self-check failed.' );
		}
	}
	for ( const [ value, replacement ] of hostIdentityReplacements ) {
		if ( sanitize( value ) !== replacement ) {
			throw new Error( 'Host-identity sanitizer self-check failed.' );
		}
	}
	if ( sanitize( sourceAuthPath ) !== '[source-client-home]/auth.json' ) {
		throw new Error( 'Source-client-root sanitizer self-check failed.' );
	}
	if (
		sanitize( 'CODEX_THREAD_ID=019fcafb-b99e-7372-a399-89ca150c557e' ) !==
			'CODEX_THREAD_ID=[thread]' ||
		sanitize(
			'no thread with id: 019fcafb-b99e-7372-a399-89ca150c557e'
		) !== 'no thread with id: [thread]' ||
		sanitize(
			'"thread_id":"019fcafb-b99e-7372-a399-89ca150c557e"'
		) !== '"thread_id":"[thread]"'
	) {
		throw new Error( 'Runtime-identifier sanitizer self-check failed.' );
	}

	const boundaryCommand = '/bin/sh ./boundary-probe.sh';
	for ( const accepted of [
		boundaryCommand,
		`/bin/zsh -lc ${ JSON.stringify( boundaryCommand ) }`,
		`/bin/zsh -c ${ JSON.stringify( boundaryCommand ) }`,
		`/bin/zsh -lc ${ shellSingleQuote( boundaryCommand ) }`,
	] ) {
		if ( ! matchesBoundaryCommand( accepted, boundaryCommand ) ) {
			throw new Error( 'Boundary-command matcher rejected an exact wrapper.' );
		}
	}
	for ( const rejected of [
		'/bin/sh ./boundary-probe.sh; true',
		'/bin/zsh -lc "test ! -r \'$1\'"',
		'/bin/zsh -lc "test ! -r \\"$1\\""',
	] ) {
		if ( matchesBoundaryCommand( rejected, boundaryCommand ) ) {
			throw new Error( 'Boundary-command matcher accepted a different command.' );
		}
	}
	if (
		matchesBoundaryCommand(
			'/bin/zsh -lc "test ! -r \'$1\'"',
			'test ! -r "$1"'
		)
	) {
		throw new Error(
			'Boundary-command matcher erased a meaningful quote difference.'
		);
	}
}

function verifyEnvironmentContract() {
	const environment = createChildEnvironment(
		'[home]',
		'[client-home]',
		'[temporary]',
		'[zsh]'
	);
	const actualKeys = Object.keys( environment ).sort();
	const modelShellEnvironment = createModelShellEnvironment( environment );
	const actualModelShellKeys = Object.keys( modelShellEnvironment ).sort();

	if (
		JSON.stringify( actualKeys ) !== JSON.stringify( childEnvironmentKeys )
	) {
		throw new Error( 'Environment self-check failed: unexpected variables.' );
	}

	if (
		JSON.stringify( actualModelShellKeys ) !==
			JSON.stringify( modelShellEnvironmentKeys ) ||
		'CODEX_HOME' in modelShellEnvironment
	) {
		throw new Error(
			'Environment self-check failed: configured model shell can locate client state.'
		);
	}

	return {
		clientEnvironmentVariables: actualKeys,
		configuredModelShellEnvironmentVariables: actualModelShellKeys,
	};
}

function loadedSkillNames( command, aggregatedOutput ) {
	const normalizedCommand = command.replace( /\\+(?=['"])/g, '' );
	const readsSkillFile =
		/(?:^|[\s'";&|()<>{}])(?:[^\s'";&|()<>{}]*\/)?SKILL\.md(?=$|[\s'";&|()<>{}])/.test(
			normalizedCommand
		);

	if ( ! readsSkillFile ) {
		return [];
	}

	return [
		...new Set(
			[ ...aggregatedOutput.matchAll(
				/(?:^|\n)(?:[ \t]*\d+[ \t]+)?---\r?\n(?:[ \t]*\d+[ \t]+)?name:[ \t]*([a-z0-9-]+)\r?\n/g
			) ].map( ( match ) => match[ 1 ] )
		),
	];
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

function shellSingleQuote( value ) {
	return `'${ value.replaceAll( "'", `'\\''` ) }'`;
}

function matchesBoundaryCommand( actual, expected ) {
	return new Set( [
		expected,
		`/bin/zsh -lc ${ JSON.stringify( expected ) }`,
		`/bin/zsh -c ${ JSON.stringify( expected ) }`,
		`/bin/zsh -lc ${ shellSingleQuote( expected ) }`,
		`/bin/zsh -c ${ shellSingleQuote( expected ) }`,
	] ).has( actual.trim() );
}

async function verifyExecBoundary( isolatedEnvironment ) {
	const attemptEnvironment = await createAttemptEnvironment(
		isolatedEnvironment,
		[]
	);

	try {
		const clientCanary = path.join(
			attemptEnvironment.codexHome,
			'boundary-canary'
		);
		const sensitiveCanary = path.join(
			attemptEnvironment.sensitiveRoot,
			'boundary-canary'
		);
		const allowedCanary = path.join(
			attemptEnvironment.workspace,
			'boundary-canary'
		);
		const probeScriptPath = path.join(
			attemptEnvironment.workspace,
			'boundary-probe.sh'
		);
		const probeScript = [
			'#!/bin/sh',
			'set -eu',
			`test ! -r ${ shellSingleQuote( clientCanary ) }`,
			`test ! -r ${ shellSingleQuote( sensitiveCanary ) }`,
			`test ! -r ${ shellSingleQuote( sourceAuthPath ) }`,
			`test -r ${ shellSingleQuote( allowedCanary ) }`,
			'test -z "${CODEX_HOME+x}"',
			`test "$HOME" = ${ shellSingleQuote( attemptEnvironment.userHome ) }`,
			`test "$TMPDIR" = ${ shellSingleQuote( attemptEnvironment.workspace ) }`,
			`test "$PATH" = ${ shellSingleQuote( isolatedPath ) }`,
			`test "$ZDOTDIR" = ${ shellSingleQuote(
				attemptEnvironment.shellConfiguration
			) }`,
			'printf "%s\\n" BOUNDARY_OK',
			'',
		].join( '\n' );
		await Promise.all( [
			fs.writeFile( clientCanary, 'private' ),
			fs.writeFile( sensitiveCanary, 'private' ),
			fs.writeFile( allowedCanary, 'public' ),
			fs.writeFile( probeScriptPath, probeScript, { mode: 0o444 } ),
		] );

		const clientEnvironment = createChildEnvironment(
			attemptEnvironment.userHome,
			attemptEnvironment.codexHome,
			attemptEnvironment.workspace,
			attemptEnvironment.shellConfiguration
		);
		const modelShellEnvironment = createModelShellEnvironment(
			clientEnvironment
		);
		const profile = permissionProfile(
			[ attemptEnvironment.root ],
			[
				attemptEnvironment.sensitiveRoot,
				attemptEnvironment.codexHome,
				sourceCodexHome,
			]
		);
		const probeCommand = '/bin/sh ./boundary-probe.sh';
		const prompt =
			'Run exactly one shell command: the command between the markers below. ' +
			'It only checks file readability and must not print file contents. ' +
			'Do not run any other command. After it completes, reply briefly.\n' +
			`<command>\n${ probeCommand }\n</command>`;
		const args = createCodexExecArguments(
			attemptEnvironment.workspace,
			prompt,
			modelShellEnvironment,
			profile
		);
		const child = spawn( codexExecutable, args, {
			cwd: attemptEnvironment.workspace,
			detached: true,
			env: clientEnvironment,
			stdio: [ 'ignore', 'pipe', 'pipe' ],
		} );
		activeChildren.add( child );
		let stdout = '';
		let stderr = '';
		let timedOut = false;
		let forceKill;
		child.stdout.setEncoding( 'utf8' );
		child.stderr.setEncoding( 'utf8' );
		child.stdout.on( 'data', ( chunk ) => {
			stdout += chunk;
		} );
		child.stderr.on( 'data', ( chunk ) => {
			stderr += chunk;
		} );
		const timeout = setTimeout( () => {
			timedOut = true;
			signalProcessGroup( child.pid, 'SIGTERM' );
			forceKill = setTimeout(
				() => signalProcessGroup( child.pid, 'SIGKILL' ),
				2_000
			);
		}, timeoutMs );
		let close;
		try {
			close = await new Promise( ( resolve, reject ) => {
				child.on( 'error', reject );
				child.on( 'close', ( exitCode, signal ) =>
					resolve( { exitCode, signal } )
				);
			} );
		} finally {
			clearTimeout( timeout );
			clearTimeout( forceKill );
			activeChildren.delete( child );
		}

		let completed = false;
		const commandEvents = [];
		for ( const line of stdout.split( '\n' ) ) {
			if ( ! line.trim().startsWith( '{' ) ) {
				continue;
			}
			let event;
			try {
				event = JSON.parse( line );
			} catch {
				continue;
			}
			if ( event.type === 'turn.completed' ) {
				completed = true;
			}
			if (
				event.type === 'item.completed' &&
				event.item?.type === 'command_execution'
			) {
				commandEvents.push( event.item );
			}
		}

		const proof = commandEvents[ 0 ];
		if (
			timedOut ||
			close.exitCode !== 0 ||
			! completed ||
			commandEvents.length !== 1 ||
			proof.exit_code !== 0 ||
			proof.aggregated_output.trim() !== 'BOUNDARY_OK' ||
			! matchesBoundaryCommand( proof.command, probeCommand )
		) {
			throw new Error(
				`Exact Codex exec boundary check failed (${ close.exitCode }, ${ close.signal }, command ${ JSON.stringify( sanitize( proof?.command ?? '' ) ) }, stderr ${ createHash( 'sha256' ).update( stderr ).digest( 'hex' ) }).`
			);
		}

		return {
			method: 'A dedicated Codex exec turn used the campaign configuration to run one exact retained command that invokes a fixed hashed no-content probe script. Client-root, parent-root, and source-authentication canaries were unreadable; the workspace canary was readable; CODEX_HOME was absent; and HOME, TMPDIR, PATH, and ZDOTDIR had their configured isolated values. Codex-added runtime variables were allowed.',
			status: 'pass',
			command: sanitize( proof.command ),
			output: sanitize( proof.aggregated_output ),
			probeScript: sanitize( probeScript ),
			probeScriptSha256: createHash( 'sha256' )
				.update( probeScript )
				.digest( 'hex' ),
			retainedProbeScriptSha256: createHash( 'sha256' )
				.update( sanitize( probeScript ) )
				.digest( 'hex' ),
			commandSha256: createHash( 'sha256' )
				.update( proof.command )
				.digest( 'hex' ),
			outputSha256: createHash( 'sha256' )
				.update( proof.aggregated_output )
				.digest( 'hex' ),
			stdoutSha256: createHash( 'sha256' )
				.update( stdout )
				.digest( 'hex' ),
			stderrSha256: createHash( 'sha256' )
				.update( stderr )
				.digest( 'hex' ),
		};
	} finally {
		await Promise.all( [
			fs.rm( attemptEnvironment.root, { recursive: true, force: true } ),
			fs.rm( attemptEnvironment.sensitiveRoot, {
				recursive: true,
				force: true,
			} ),
		] );
		ephemeralRoots.delete( attemptEnvironment.root );
		sensitiveRoots.delete( attemptEnvironment.sensitiveRoot );
		clientHomeRoots.delete( attemptEnvironment.codexHome );
	}
}

async function executeAttempt( testCase, attempt, ordinal, attemptEnvironment ) {
	if ( shuttingDown ) {
		throw new Error( 'Evaluation runner interrupted.' );
	}

	const { codexHome, shellConfiguration, userHome, workspace } =
		attemptEnvironment;
	const clientEnvironment = createChildEnvironment(
		userHome,
		codexHome,
		workspace,
		shellConfiguration
	);
	const modelShellEnvironment = createModelShellEnvironment( clientEnvironment );
	const profile = permissionProfile(
		[ attemptEnvironment.root, attemptEnvironment.isolatedRoot ],
		[
			attemptEnvironment.sensitiveRoot,
			codexHome,
			sourceCodexHome,
		]
	);
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
	let stdoutBytes = 0;
	let stderrBytes = 0;
	let stderrCharacters = 0;
	let stderrPreview = '';
	let stdoutBuffer = '';
	let stopPromise;

	const args = createCodexExecArguments(
		workspace,
		testCase.prompt,
		modelShellEnvironment,
		profile
	);

	const child = spawn( codexExecutable, args, {
		cwd: workspace,
		detached: true,
		env: clientEnvironment,
		stdio: [ 'ignore', 'pipe', 'pipe' ],
	} );
	activeChildren.add( child );

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
			const eventLoadedSkills = loadedSkillNames(
				event.item.command,
				event.item.aggregated_output
			);
			const outputSha256 = createHash( 'sha256' )
				.update( event.item.aggregated_output )
				.digest( 'hex' );
			const retainedOutput = sanitize( event.item.aggregated_output );

			commandEvents.push( {
				command: sanitize( event.item.command ),
				exitCode: event.item.exit_code,
				output: retainedOutput,
				outputSha256,
				retainedOutputSha256: createHash( 'sha256' )
					.update( retainedOutput )
					.digest( 'hex' ),
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

	let close;
	try {
		close = await new Promise( ( resolve, reject ) => {
			child.on( 'error', reject );
			child.on( 'close', ( exitCode, signal ) =>
				resolve( { exitCode, signal } )
			);
		} );
	} finally {
		activeChildren.delete( child );
	}

	clearTimeout( timeout );
	await stopPromise;
	if ( stdoutBuffer ) {
		inspectLine( stdoutBuffer );
	}

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
		commandEvents,
		skillLoadEvents,
		authentication: {
			clientCredentialBoundaryVerified: true,
			clientCommandScratchReadable: true,
			hostHomeDeniedToModel: true,
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
			{
				...attemptEnvironment,
				isolatedRoot: isolatedEnvironment.root,
			}
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
		ephemeralRoots.delete( attemptEnvironment.root );
		sensitiveRoots.delete( attemptEnvironment.sensitiveRoot );
		clientHomeRoots.delete( attemptEnvironment.codexHome );
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
const environmentContract = verifyEnvironmentContract();
await verifySandboxReadBoundary();

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
	const execBoundary = await verifyExecBoundary( isolatedEnvironment );
	const provenance = await collectProvenance(
		skillNames,
		isolatedEnvironment.installedRoot
	);
	const campaign = {
		schemaVersion: 9,
		repositoryRevision: targetRevision,
		fixtureRevision: targetRevision,
		runner: {
			path: path.relative( repositoryRoot, scriptPath ),
			invocation: process.argv.map( sanitize ),
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
			ambientCapabilities: 'No host environment or home directory inherited. Every attempt used a fresh isolated HOME, exact links to the read-only target-revision skill stage, and a fresh session store. A split filesystem permission profile denied model-shell reads of the host home, the runner logical and resolved temporary roots, and credential-bearing client state while allowing the isolated attempt and staged target roots. Codex exposes its per-command argument scratch directory so the command can execute. The exact-exec preflight verified credential and key effective-environment invariants while allowing Codex-added runtime variables. User config, rules, plugins, apps, browser, computer use, image generation, multi-agent, memory, hooks, remote plugins, and tool suggestions disabled.',
			clientEnvironmentVariables:
				environmentContract.clientEnvironmentVariables,
			configuredModelShellEnvironmentVariables:
				environmentContract.configuredModelShellEnvironmentVariables,
			runtimeBoundary: execBoundary,
			path: isolatedPath,
			loginShell: 'Isolated ZDOTDIR resets PATH in .zshenv, .zprofile, and .zlogin. The exact Codex exec preflight requires the effective command PATH and other key isolated environment values.',
			authentication: 'Credential-bearing client state used a separate temporary root with interruption cleanup. Static and exact Codex exec checks proved that client-root, parent-root, and source-auth canaries were unreadable. Codex per-command argument scratch remained readable by design, and the exact preflight proved CODEX_HOME was absent from the effective model command.',
			commandEvidence: 'Every completed command retained its sanitized command, output, exit code, loaded-skill classification, original full-output SHA-256, and retained-output SHA-256. Every attempt retained a full stdout-stream SHA-256.',
			interruption: 'SIGHUP, SIGINT, and SIGTERM stop active detached process groups, await active attempts, remove private and non-private temporary roots, and preserve the last atomically written evidence snapshot.',
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
	let workerFailure;

	async function worker() {
		try {
			while (
				! shuttingDown &&
				! workerFailure &&
				nextAttempt < attempts.length
			) {
				const current = attempts[ nextAttempt ];
				nextAttempt += 1;
				const attemptPromise = runAttempt(
					current.testCase,
					current.attempt,
					current.ordinal,
					isolatedEnvironment,
					skillNames
				);
				activeAttempts.add( attemptPromise );
				let result;
				try {
					result = await attemptPromise;
				} finally {
					activeAttempts.delete( attemptPromise );
				}
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
		} catch ( error ) {
			workerFailure ??= error;
			throw error;
		}
	}

	const workerResults = await Promise.allSettled(
		Array.from( { length: concurrency }, () => worker() )
	);
	const rejectedWorker = workerResults.find(
		( result ) => result.status === 'rejected'
	);
	if ( rejectedWorker ) {
		throw rejectedWorker.reason;
	}
	await writeOutput( campaign );
} finally {
	spawnSync( 'chmod', [ '-R', 'u+w', isolatedEnvironment.root ] );
	await Promise.all( [
		fs.rm( isolatedEnvironment.root, { recursive: true, force: true } ),
		fs.rm( outputTemporaryPath, { force: true } ),
	] );
	ephemeralRoots.delete( isolatedEnvironment.root );
}
