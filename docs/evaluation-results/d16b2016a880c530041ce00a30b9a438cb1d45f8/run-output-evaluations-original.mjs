#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
	promises as fs,
	readdirSync,
	realpathSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const targetRevision = 'd16b2016a880c530041ce00a30b9a438cb1d45f8';
const defaultConcurrency = 3;
const subjectTimeoutMs = 240_000;
const extendedSubjectTimeoutMs = 720_000;
const graderTimeoutMs = 120_000;
const model = 'gpt-5.6-sol';
const reasoningEffort = 'xhigh';
const serviceTier = 'priority';
const permissionProfileName = 'evaluation';
const maximumRetainedArtifactBytes = 256 * 1024;
const stderrPreviewLimit = 8_192;
const sourceCodexHome =
	process.env.CODEX_HOME ?? path.join( os.homedir(), '.codex' );
const sourceAuthPath = path.join( sourceCodexHome, 'auth.json' );
const voltaRoot = path.join( os.homedir(), '.volta' );
const isolatedPath = [
	path.join( voltaRoot, 'bin' ),
	'/usr/bin',
	'/bin',
	'/usr/sbin',
	'/sbin',
].join( path.delimiter );
const restrictedTemporaryRoots = [
	...new Set( [ os.tmpdir(), realpathSync( os.tmpdir() ) ] ),
].sort( ( left, right ) => right.length - left.length );
const conventionalTemporaryRoots = [ '/private/tmp', '/tmp' ].sort(
	( left, right ) => right.length - left.length
);
const runtimeRootNames = new Set( [
	'System',
	'bin',
	'dev',
	'private',
	'sbin',
	'usr',
] );
const defaultDeniedRoots = [
	...readdirSync( '/' )
		.filter( ( name ) => ! runtimeRootNames.has( name ) )
		.map( ( name ) => path.join( '/', name ) ),
	...readdirSync( '/private' ).map( ( name ) =>
		path.join( '/private', name )
	),
	'/usr/local',
];
const commandLineToolsPath = spawnSync( 'xcode-select', [ '-p' ], {
	encoding: 'utf8',
} ).stdout.trim();
const runtimeReadableRoots = [
	'/private/var/select',
	voltaRoot,
	...( commandLineToolsPath ? [ commandLineToolsPath ] : [] ),
];
const hostIdentityReplacements = [
	[ os.userInfo().username, '[user]' ],
	[ os.hostname(), '[host]' ],
]
	.filter( ( [ value ] ) => value )
	.sort( ( [ left ], [ right ] ) => right.length - left.length );
const activeChildren = new Set();
const ephemeralRoots = new Set();
const sensitiveRoots = new Set();
const clientHomeRoots = new Set();
let isShuttingDown = false;
let shutdownPromise;

const scriptPath = fileURLToPath( import.meta.url );
const repositoryRoot = path.resolve( path.dirname( scriptPath ), '../../..' );
const options = parseArguments( process.argv.slice( 2 ) );

for ( const [ signal, exitCode ] of [
	[ 'SIGHUP', 129 ],
	[ 'SIGINT', 130 ],
	[ 'SIGTERM', 143 ],
] ) {
	process.on( signal, () => {
		shutdownPromise ||= shutdown( exitCode );
	} );
}

function parseArguments( args ) {
	const parsed = {
		cases: [],
		concurrency: defaultConcurrency,
		output: undefined,
		verifySelf: false,
	};

	for ( let index = 0; index < args.length; index++ ) {
		const argument = args[ index ];
		if ( argument === '--verify-self' ) {
			parsed.verifySelf = true;
			continue;
		}
		if ( argument === '--case' ) {
			const value = args[ ++index ];
			if ( ! value || value.startsWith( '--' ) ) {
				throw new Error(
					'Output evaluation runner: --case requires <skill>/<case-id>.'
				);
			}
			parsed.cases.push( value );
			continue;
		}
		if ( argument === '--concurrency' ) {
			const value = Number.parseInt( args[ ++index ], 10 );
			if ( ! Number.isInteger( value ) || value < 1 || value > 8 ) {
				throw new Error(
					'Output evaluation runner: --concurrency must be between 1 and 8.'
				);
			}
			parsed.concurrency = value;
			continue;
		}
		if ( argument === '--output' ) {
			const value = args[ ++index ];
			if ( ! value || value.startsWith( '--' ) ) {
				throw new Error(
					'Output evaluation runner: --output requires a file path.'
				);
			}
			parsed.output = path.resolve( value );
			continue;
		}
		throw new Error(
			'Output evaluation runner: unknown argument ' +
				JSON.stringify( argument ) +
				'.'
		);
	}

	if ( ! parsed.verifySelf && ! parsed.output ) {
		throw new Error(
			'Usage: run-output-evaluations.mjs --output <path> [--case <skill>/<case-id>]... [--concurrency <1-8>]'
		);
	}

	return parsed;
}

async function shutdown( exitCode ) {
	isShuttingDown = true;
	for ( const child of activeChildren ) {
		signalProcessGroup( child.pid, 'SIGTERM' );
	}
	await new Promise( ( resolve ) => setTimeout( resolve, 2_000 ) );
	for ( const child of activeChildren ) {
		signalProcessGroup( child.pid, 'SIGKILL' );
	}
	await cleanupRoots();
	process.exit( exitCode );
}

async function cleanupRoots() {
	for ( const root of ephemeralRoots ) {
		spawnSync( 'chmod', [ '-R', 'u+w', root ] );
	}
	await Promise.allSettled(
		[ ...sensitiveRoots, ...ephemeralRoots ].map( ( root ) =>
			fs.rm( root, {
				recursive: true,
				force: true,
				maxRetries: 3,
				retryDelay: 100,
			} )
		)
	);
}

function resolveExecutable( name ) {
	const result = spawnSync( 'which', [ name ], { encoding: 'utf8' } );
	if ( result.status !== 0 || ! result.stdout.trim() ) {
		throw new Error(
			'Output evaluation runner: ' + name + ' is not available.'
		);
	}
	return realpathSync( result.stdout.trim() );
}

function runGit( args, cwd = repositoryRoot ) {
	const result = spawnSync( 'git', args, {
		cwd,
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024,
	} );
	if ( result.status !== 0 ) {
		throw new Error(
			result.stderr || 'git ' + args.join( ' ' ) + ' failed.'
		);
	}
	return result.stdout.trim();
}

function targetSkillNames() {
	return runGit( [
		'ls-tree',
		'--name-only',
		targetRevision + ':skills',
	] )
		.split( '\n' )
		.filter( Boolean )
		.sort();
}

async function createIsolatedEnvironment( skillNames ) {
	const root = await fs.mkdtemp(
		path.join( os.tmpdir(), 'ai-instructions-output-evaluation-' )
	);
	ephemeralRoots.add( root );
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
				'Output evaluation runner: git archive failed.'
		);
	}
	const extraction = spawnSync( 'tar', [ '-xf', '-', '-C', stageRoot ], {
		input: archive.stdout,
	} );
	if ( extraction.error || extraction.status !== 0 ) {
		throw new Error(
			extraction.error?.message ||
				extraction.stderr?.toString() ||
				'Output evaluation runner: archive extraction failed.'
		);
	}

	const installedRoot = path.join( stageRoot, 'skills' );
	const stagedSkillNames = ( await fs.readdir( installedRoot ) ).sort();
	if ( JSON.stringify( stagedSkillNames ) !== JSON.stringify( skillNames ) ) {
		throw new Error(
			'Output evaluation runner: staged skill inventory is not exact.'
		);
	}
	const readOnly = spawnSync( 'chmod', [ '-R', 'a-w', installedRoot ] );
	if ( readOnly.error || readOnly.status !== 0 ) {
		throw new Error(
			readOnly.error?.message ||
				readOnly.stderr?.toString() ||
				'Output evaluation runner: could not make the stage read-only.'
		);
	}
	return { installedRoot, root };
}

async function loadCases( skillNames, installedRoot ) {
	const cases = [];
	for ( const skill of skillNames ) {
		const fixturePath = path.join(
			installedRoot,
			skill,
			'evals',
			'evals.json'
		);
		const fixture = JSON.parse( await fs.readFile( fixturePath, 'utf8' ) );
		for ( const outputCase of fixture.outputCases ?? [] ) {
			const contextPath = path.join(
				installedRoot,
				skill,
				outputCase.context
			);
			const context = await fs.readFile( contextPath, 'utf8' );
			const executableFixtureRelativePath = outputCase.context.slice(
				0,
				-path.extname( outputCase.context ).length
			);
			const executableFixtureSource = path.join(
				installedRoot,
				skill,
				executableFixtureRelativePath
			);
			let executableFixture;
			try {
				const executableFixtureStatus = await fs.stat(
					executableFixtureSource
				);
				if ( executableFixtureStatus.isDirectory() ) {
					executableFixture = {
						path:
							targetRevision +
							':skills/' +
							skill +
							'/' +
							executableFixtureRelativePath,
						source: executableFixtureSource,
						treeSha1: runGit( [
							'rev-parse',
							targetRevision +
								':skills/' +
								skill +
								'/' +
								executableFixtureRelativePath,
						] ),
					};
				}
			} catch ( error ) {
				if ( error.code !== 'ENOENT' ) {
					throw error;
				}
			}
			cases.push( {
				assertions: outputCase.assertions,
				caseId: outputCase.id,
				context,
				contextPath:
					targetRevision +
					':skills/' +
					skill +
					'/' +
					outputCase.context,
				contextSha256: sha256( context ),
				executableFixture,
				expectedOutcome: outputCase.expectedOutcome,
				prompt: outputCase.prompt,
				skill,
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
			'Output evaluation runner: checkout skill tree has local changes.'
		);
	}

	const targetTree = runGit( [ 'rev-parse', targetRevision + ':skills' ] );
	const checkoutTree = runGit( [ 'rev-parse', 'HEAD:skills' ] );
	if ( targetTree !== checkoutTree ) {
		throw new Error(
			'Output evaluation runner: checkout skills do not match the target revision.'
		);
	}

	const installedSkillNames = ( await fs.readdir( installedRoot ) ).sort();
	if ( JSON.stringify( installedSkillNames ) !== JSON.stringify( skillNames ) ) {
		throw new Error(
			'Output evaluation runner: installed skill inventory is not exact.'
		);
	}

	const skills = skillNames.map( ( skill ) => {
		const targetTreeObject = runGit( [
			'rev-parse',
			targetRevision + ':skills/' + skill,
		] );
		const checkoutTreeObject = runGit( [
			'rev-parse',
			'HEAD:skills/' + skill,
		] );
		if ( targetTreeObject !== checkoutTreeObject ) {
			throw new Error(
				'Output evaluation runner: ' +
					skill +
					' does not match the target tree.'
			);
		}
		return {
			checkoutTree: checkoutTreeObject,
			installedTarget: targetRevision + ':skills/' + skill,
			match: true,
			name: skill,
			targetTree: targetTreeObject,
		};
	} );

	return {
		checkoutTree,
		installedRoot: '[per-case-home]/.agents/skills',
		installedSkillNames,
		method:
			'Git archive materialized the immutable target skill tree before fixtures were loaded. Every case linked the complete staged inventory into a fresh isolated home. The checkout skill tree and every staged skill tree matched the target revision.',
		skills,
		targetTree,
	};
}

async function createCodexHome( sensitiveRoot ) {
	const codexHome = await fs.mkdtemp(
		path.join( sensitiveRoot, 'codex-home-' )
	);
	const isolatedAuthPath = path.join( codexHome, 'auth.json' );
	await fs.copyFile( sourceAuthPath, isolatedAuthPath );
	await fs.chmod( isolatedAuthPath, 0o600 );
	clientHomeRoots.add( codexHome );
	return codexHome;
}

async function createShellConfiguration( root, executableRoot ) {
	const configurationRoot = await fs.mkdtemp( path.join( root, 'zsh-' ) );
	const configuredPath = executableRoot
		? executableRoot + path.delimiter + isolatedPath
		: isolatedPath;
	const resetPath = 'export PATH=' + shellSingleQuote( configuredPath ) + '\n';
	await Promise.all(
		[ '.zshenv', '.zprofile', '.zlogin' ].map( ( fileName ) =>
			fs.writeFile( path.join( configurationRoot, fileName ), resetPath, {
				mode: 0o444,
			} )
		)
	);
	return { configuredPath, configurationRoot };
}

function caseSupportsReadTools( testCase ) {
	return (
		( testCase.skill === 'automattic-github-enterprise' &&
			testCase.caseId === 'automattic-enterprise-macos-preflight' ) ||
		testCase.caseId === 'current-checkout-identity-resolution' ||
		( testCase.skill === 'review-pr' &&
			testCase.caseId === 'read-only-synthesized-review' )
	);
}

async function createEvaluationTools( workspace, testCase ) {
	const executableRoot = path.join( workspace, '.evaluation', 'bin' );
	await fs.mkdir( executableRoot, { recursive: true } );
	const ncPath = path.join( executableRoot, 'nc' );
	const ghPath = path.join( executableRoot, 'gh' );
	const waitReviewPath = path.join(
		executableRoot,
		'evaluation-wait-review'
	);
	const threadStatePath = path.join(
		executableRoot,
		'evaluation-thread-state'
	);
	const markReviewPath = path.join(
		executableRoot,
		'evaluation-mark-independent-start'
	);
	const supportsReadTools = caseSupportsReadTools( testCase );
	const supportsEnterprise =
		testCase.skill === 'automattic-github-enterprise' &&
		testCase.caseId === 'automattic-enterprise-macos-preflight';
	const supportsImmutableReview =
		testCase.skill === 'review-pr' &&
		testCase.caseId === 'read-only-synthesized-review';
	const pullRequestMetadata = supportsImmutableReview
		? {
				baseRefOid: 'f03ab1f5f0d5dcd508402d9ef766226423d1267d',
				headRefOid: 'ba6ac3ce1174b28a3efca3391e19aee8b8bfe69a',
				isDraft: true,
				number: 45,
				title: 'Skills-first support audit',
				url: 'https://github.com/ciampo/ai-instructions/pull/45',
			}
		: {
				baseRefOid: 'f03ab1f5f0d5dcd508402d9ef766226423d1267d',
				headRefOid: '52e35d57534525d5a05421878d8c2d349c37d0c6',
				isDraft: true,
				number: 42,
				title: 'Evaluation pull request',
				url: 'https://github.com/example/widgets/pull/42',
			};
	await fs.writeFile(
		ncPath,
		[
			'#!/bin/sh',
			'if [ "' +
				( supportsEnterprise ? 'yes' : 'no' ) +
				'" = "yes" ] && [ "$1" = "-z" ] && [ "$2" = "127.0.0.1" ] && [ "$3" = "8080" ]; then',
			'  exit 0',
			'fi',
			'echo "Evaluation nc stub: unsupported read-only probe." >&2',
			'exit 2',
			'',
		].join( '\n' ),
		{ mode: 0o755 }
	);
	await fs.writeFile(
		ghPath,
		[
			'#!/bin/sh',
			'if [ "' +
				( supportsEnterprise ? 'yes' : 'no' ) +
				'" = "yes" ] && [ "$1" = "api" ] && [ "$2" = "user" ]; then',
			'  echo "{\"login\":\"evaluation-user\"}"',
			'  exit 0',
			'fi',
			'if [ "' +
				( supportsReadTools ? 'yes' : 'no' ) +
				'" = "yes" ] && [ "$1" = "auth" ] && [ "$2" = "status" ]; then',
			'  echo "github.a8c.com"',
			'  echo "  Logged in to github.a8c.com as evaluation-user"',
			'  exit 0',
			'fi',
			'if [ "' +
				( supportsReadTools ? 'yes' : 'no' ) +
				'" = "yes" ] && [ "$1" = "pr" ] && [ "$2" = "view" ]; then',
			'  echo ' + shellSingleQuote( JSON.stringify( pullRequestMetadata ) ),
			'  exit 0',
			'fi',
			'if [ "' +
				( supportsImmutableReview ? 'yes' : 'no' ) +
				'" = "yes" ] && [ "$1" = "pr" ] && [ "$2" = "diff" ]; then',
			'  exec cat .evaluation/fixture-diff.patch',
			'fi',
			'if [ "' +
				( supportsImmutableReview ? 'yes' : 'no' ) +
				'" = "yes" ] && [ "$1" = "api" ]; then',
			'  echo "[]"',
			'  exit 0',
			'fi',
			'if [ "' +
				( supportsImmutableReview ? 'yes' : 'no' ) +
				'" = "yes" ] && [ "$1" = "pr" ] && [ "$2" = "checks" ]; then',
			'  echo "[]"',
			'  exit 0',
			'fi',
			'echo "Evaluation gh stub: live or mutating GitHub operations are unavailable." >&2',
			'exit 2',
			'',
		].join( '\n' ),
		{ mode: 0o755 }
	);
	await fs.writeFile(
		threadStatePath,
		[
			'#!/bin/sh',
			'if [ "' +
				( supportsImmutableReview ? 'yes' : 'no' ) +
				'" = "yes" ]; then',
			'  echo "{\"threads\":[]}"',
			'  exit 0',
			'fi',
			'echo "Output evaluation runner: thread-aware state is unavailable for this case." >&2',
			'exit 2',
			'',
		].join( '\n' ),
		{ mode: 0o755 }
	);
	const rgExecutable = resolveExecutable( 'rg' );
	await fs.copyFile( rgExecutable, path.join( executableRoot, 'rg' ) );
	await fs.chmod( path.join( executableRoot, 'rg' ), 0o755 );
	await fs.writeFile(
		markReviewPath,
		[
			'#!/bin/sh',
			'if [ "$1" = "52e35d57534525d5a05421878d8c2d349c37d0c6" ]; then',
			'  printf "%s\\n" "$1" > .evaluation/independent-started',
			'  exit 0',
			'fi',
			'echo "Output evaluation runner: no independent-review marker exists for this head." >&2',
			'exit 2',
			'',
		].join( '\n' ),
		{ mode: 0o755 }
	);
	await fs.writeFile(
		waitReviewPath,
		[
			'#!/bin/sh',
			'if [ ! -f .evaluation/independent-started ] || [ "$(cat .evaluation/independent-started)" != "$1" ]; then',
			'  echo "Output evaluation runner: independent review was not started first." >&2',
			'  exit 3',
			'fi',
			'if [ "$1" = "52e35d57534525d5a05421878d8c2d349c37d0c6" ]; then',
			'  echo "{\"head\":\"52e35d57534525d5a05421878d8c2d349c37d0c6\",\"state\":\"completed\",\"finding\":\"The helper-only test does not exercise the changed call site.\"}"',
			'  exit 0',
			'fi',
			'echo "Output evaluation runner: no retained review transition exists for this head." >&2',
			'exit 2',
			'',
		].join( '\n' ),
		{ mode: 0o755 }
	);
	return executableRoot;
}

function localFixtureSnapshot( testCase ) {
	if ( ! testCase.context.includes( 'github.com/ciampo/ai-instructions' ) ) {
		return undefined;
	}
	const headMatch = testCase.context.match(
		/(?:Current remote head|Current head revision|Head revision):[^\n]*?([0-9a-f]{40})/
	);
	const baseMatch = testCase.context.match(
		/Base revision:[^\n]*?([0-9a-f]{40})/
	);
	if ( ! headMatch || ! baseMatch ) {
		return undefined;
	}
	for ( const revision of [ baseMatch[ 1 ], headMatch[ 1 ] ] ) {
		const exists = spawnSync(
			'git',
			[ 'cat-file', '-e', revision + '^{commit}' ],
			{ cwd: repositoryRoot }
		);
		if ( exists.status !== 0 ) {
			return undefined;
		}
	}
	return { base: baseMatch[ 1 ], head: headMatch[ 1 ] };
}

async function createLocalFixtureCheckout( workspace, snapshot ) {
	await fs.mkdir( workspace );
	const archive = spawnSync(
		'git',
		[ 'archive', '--format=tar', snapshot.head ],
		{
			cwd: repositoryRoot,
			maxBuffer: 64 * 1024 * 1024,
		}
	);
	if ( archive.status !== 0 ) {
		throw new Error(
			archive.stderr?.toString() ||
				'Output evaluation runner: local fixture archive failed.'
		);
	}
	const extraction = spawnSync( 'tar', [ '-xf', '-', '-C', workspace ], {
		input: archive.stdout,
	} );
	if ( extraction.status !== 0 ) {
		throw new Error(
			extraction.stderr?.toString() ||
				'Output evaluation runner: local fixture extraction failed.'
		);
	}
	runGit( [ 'init', '--quiet', '--initial-branch=fixture' ], workspace );
	runGit( [ 'add', '--all' ], workspace );
	runGit(
		[
			'-c',
			'user.name=Evaluation Runner',
			'-c',
			'user.email=evaluation@example.invalid',
			'commit',
			'--quiet',
			'-m',
			'Fixture head tree',
		],
		workspace
	);
	await fs.appendFile(
		path.join( workspace, '.git', 'info', 'exclude' ),
		'\n/context.md\n/.evaluation/\nxcrun_db\n'
	);
	await fs.mkdir( path.join( workspace, '.evaluation' ) );
	await fs.writeFile(
		path.join( workspace, '.evaluation', 'fixture-diff.patch' ),
		runGit(
			[ 'diff', '--find-renames', snapshot.base + '...' + snapshot.head ],
			repositoryRoot
		) + '\n',
		{ mode: 0o444 }
	);
}

async function createCurrentCheckoutFixture( workspace ) {
	runGit( [ 'init', '--quiet', '--initial-branch=main' ], workspace );
	await Promise.all( [
		fs.writeFile(
			path.join( workspace, '.gitignore' ),
			'.evaluation/\nxcrun_db\n'
		),
		fs.writeFile(
			path.join( workspace, 'README.md' ),
			'# Evaluation checkout\n'
		),
	] );
	runGit( [ 'add', '.gitignore', 'README.md', 'context.md' ], workspace );
	runGit(
		[
			'-c',
			'user.name=Evaluation Runner',
			'-c',
			'user.email=evaluation@example.invalid',
			'commit',
			'--quiet',
			'-m',
			'Fixture snapshot',
		],
		workspace
	);
	runGit(
		[ 'remote', 'add', 'origin', 'https://github.com/example/widgets.git' ],
		workspace
	);
}

async function createCaseEnvironment( isolatedEnvironment, skillNames, testCase ) {
	const root = await fs.mkdtemp(
		path.join( os.tmpdir(), 'ai-instructions-output-case-' )
	);
	ephemeralRoots.add( root );
	const sensitiveRoot = await fs.mkdtemp(
		path.join( os.tmpdir(), 'ai-instructions-output-state-' )
	);
	sensitiveRoots.add( sensitiveRoot );

	const userHome = path.join( root, 'home' );
	const installedRoot = path.join( userHome, '.agents', 'skills' );
	const workspace = path.join( root, 'workspace' );
	await fs.mkdir( installedRoot, { recursive: true } );
	const fixtureSnapshot = localFixtureSnapshot( testCase );
	if ( fixtureSnapshot ) {
		await createLocalFixtureCheckout( workspace, fixtureSnapshot );
	} else {
		await fs.mkdir( workspace );
	}
	if ( testCase.executableFixture ) {
		const executableFixtureDestination = path.join(
			workspace,
			path.basename( testCase.executableFixture.source )
		);
		await fs.cp(
			testCase.executableFixture.source,
			executableFixtureDestination,
			{ recursive: true }
		);
		const writable = spawnSync( 'chmod', [
			'-R',
			'u+w',
			executableFixtureDestination,
		] );
		if ( writable.error || writable.status !== 0 ) {
			throw new Error(
				writable.error?.message ||
					writable.stderr?.toString() ||
					'Output evaluation runner: could not make the executable fixture writable.'
			);
		}
	}
	for ( const skill of skillNames ) {
		await fs.symlink(
			path.join( isolatedEnvironment.installedRoot, skill ),
			path.join( installedRoot, skill ),
			'dir'
		);
	}
	await fs.writeFile( path.join( workspace, 'context.md' ), testCase.context, {
		mode: 0o444,
	} );
	if (
		! fixtureSnapshot &&
		testCase.caseId === 'current-checkout-identity-resolution'
	) {
		await createCurrentCheckoutFixture( workspace );
	}
	const executableRoot = await createEvaluationTools( workspace, testCase );
	const subjectCodexHome = await createCodexHome( sensitiveRoot );
	const graderCodexHome = await createCodexHome( sensitiveRoot );
	const subjectShell = await createShellConfiguration( root, executableRoot );
	const graderShell = await createShellConfiguration( root );
	const graderHome = path.join( root, 'grader-home' );
	const graderWorkspace = path.join( root, 'grader-workspace' );
	await fs.mkdir( graderHome );
	await fs.mkdir( graderWorkspace );

	return {
		executableRoot,
		graderCodexHome,
		graderHome,
		graderShell,
		graderWorkspace,
		hasLocalFixtureCheckout: Boolean( fixtureSnapshot ),
		root,
		sensitiveRoot,
		subjectCodexHome,
		subjectShell,
		userHome,
		workspace,
	};
}

function createChildEnvironment(
	userHome,
	codexHome,
	temporaryDirectory,
	shellConfiguration,
	configuredPath
) {
	return {
		CODEX_HOME: codexHome,
		HOME: userHome,
		LANG: 'C.UTF-8',
		LC_ALL: 'C.UTF-8',
		NO_COLOR: '1',
		PATH: configuredPath,
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
	return (
		'{ ' +
		Object.entries( values )
			.map(
				( [ key, value ] ) =>
					JSON.stringify( key ) + ' = ' + JSON.stringify( value )
			)
			.join( ', ' ) +
		' }'
	);
}

function permissionProfile( readableRoots, writableRoots, deniedRoots ) {
	const filesystem = new Map( [
		[ '/', 'read' ],
		[ '/System', 'read' ],
		[ '/usr', 'read' ],
		[ '/bin', 'read' ],
		[ '/sbin', 'read' ],
		[ '/dev', 'read' ],
		[ os.homedir(), 'deny' ],
	] );
	for ( const root of defaultDeniedRoots ) {
		filesystem.set( root, 'deny' );
		try {
			filesystem.set( realpathSync( root ), 'deny' );
		} catch ( error ) {
			if ( error.code !== 'ENOENT' ) {
				throw error;
			}
		}
	}
	for ( const root of runtimeReadableRoots ) {
		filesystem.set( root, 'read' );
		filesystem.set( realpathSync( root ), 'read' );
	}
	for ( const root of restrictedTemporaryRoots ) {
		filesystem.set( root, 'deny' );
	}
	for ( const root of readableRoots ) {
		filesystem.set( root, 'read' );
	}
	for ( const root of writableRoots ) {
		filesystem.set( root, 'write' );
	}
	for ( const root of deniedRoots ) {
		filesystem.set( root, 'deny' );
	}
	return (
		'{ filesystem = ' +
		formatTomlInlineTable( Object.fromEntries( filesystem ) ) +
		' }'
	);
}

function createCodexArguments( workspace, prompt, shellEnvironment, profile ) {
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
		'--enable',
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
		'model_reasoning_effort=' + JSON.stringify( reasoningEffort ),
		'-c',
		'service_tier=' + JSON.stringify( serviceTier ),
		'-c',
		'shell_environment_policy.inherit="none"',
		'-c',
		'shell_environment_policy.set=' +
			formatTomlInlineTable( shellEnvironment ),
		'-c',
		'default_permissions=' + JSON.stringify( permissionProfileName ),
		'-c',
		'permissions.' + permissionProfileName + '=' + profile,
		'-C',
		workspace,
		prompt,
	];
}

function subjectPrompt( testCase, environment ) {
	const skillPath = path.join(
		environment.userHome,
		'.agents',
		'skills',
		testCase.skill,
		'SKILL.md'
	);
	const capabilityInstruction =
		testCase.skill === 'review-pr' &&
		testCase.caseId === 'read-only-synthesized-review'
			? 'The evaluator provides deterministic read-only gh and evaluation-thread-state commands in PATH. Use evaluation-thread-state for the thread-aware discussion snapshot. Before delivery, rerun both evaluation-thread-state and gh pr view to refresh review state and both boundaries. These commands reject external writes.'
			: caseSupportsReadTools( testCase )
				? 'The evaluator provides deterministic read-only nc and gh substitutes in PATH. Shell commands use the authorized isolated evaluation route. The substitutes reject external writes.'
				: 'This case has no live or simulated remote read route. Do not run gh, remote Git, network, or browser commands. Use only the immutable context.';
	const localFixtureInstruction = environment.hasLocalFixtureCheckout
		? 'The disposable workspace contains the exact fixture-head tree and .evaluation/fixture-diff.patch contains the exact pinned base-to-head diff. The local Git commit is synthetic, so use the immutable SHAs from context.md. Edit the materialized files when the user request authorizes local fixes.'
		: 'No additional repository checkout is materialized beyond the capability facts in context.md.';
	const reviewWaitInstruction =
		testCase.skill === 'iterate-pr-review' &&
		testCase.caseId === 'current-head-convergence'
			? 'For the already-requested pending review, start the independent self-review subagent first. After the subagent start event, run evaluation-mark-independent-start 52e35d57534525d5a05421878d8c2d349c37d0c6, then run evaluation-wait-review 52e35d57534525d5a05421878d8c2d349c37d0c6. These deterministic local commands make the ordering and bounded wait auditable; they are not remote lookups.'
			: 'No deterministic review-state transition is supplied for this case.';
	return [
		'This is an isolated output evaluation of the installed ' +
			testCase.skill +
			' skill.',
		'Read ' + skillPath + ' completely, then follow that skill.',
		'Read ' + path.join( environment.workspace, 'context.md' ) + '.',
		'Treat context.md as the complete immutable scenario evidence. Do not contact live services or use facts outside the fixture.',
		capabilityInstruction,
		localFixtureInstruction,
		reviewWaitInstruction,
		'Host-provided subagents are available. When the loaded workflow requires an independent review or materially independent lanes, use the subagent route and keep its first pass isolated from conclusions produced by other review sources.',
		'Work only in the disposable workspace. Return the response that the user should receive.',
		'',
		'User request:',
		testCase.prompt,
	].join( '\n' );
}

function graderPrompt( evidencePath ) {
	return [
		'You are the strict assertion grader for a versioned skill output evaluation.',
		'Read ' + evidencePath + '.',
		'Grade each assertion only from the retained fixture, final response, complete command events, workspace delta, and generated artifacts.',
		'Use pass only when the evidence proves the assertion. Use fail when the response or actions contradict it. Use blocked when the available evidence cannot decide it.',
		'When an assertion is conditional and the retained evidence proves its condition did not occur, grade it pass as not applicable if the response took no prohibited conditional action.',
		'Do not require the final response to repeat a workflow contract unless the assertion explicitly requires that user-facing report. Retained skill-load and command evidence can prove internal workflow behavior.',
		'The runner disables apps, plugins, live GitHub tools, remote plugins, and user configuration. Its deterministic gh and nc substitutes reject external writes. A complete command stream plus an unchanged workspace can prove a no-write assertion.',
		'Return JSON only. Use this exact shape:',
		'{"assertionResults":[{"index":1,"status":"pass|fail|blocked","evidence":"concise evidence tied to retained fields"}]}',
		'Include exactly one result for each assertion, in order.',
	].join( '\n' );
}

async function executeCodex( {
	codexExecutable,
	environment,
	profile,
	prompt,
	timeoutMs,
	workspace,
} ) {
	if ( isShuttingDown ) {
		throw new Error( 'Output evaluation runner: interrupted.' );
	}
	const shellEnvironment = createModelShellEnvironment( environment );
	const args = createCodexArguments(
		workspace,
		prompt,
		shellEnvironment,
		profile
	);
	const startedAt = Date.now();
	const events = [];
	const messages = [];
	const commandEvents = [];
	const observedSkills = [];
	let completed = false;
	let timedOut = false;
	let stdout = '';
	let stderr = '';
	let stdoutBuffer = '';
	let stopPromise;
	let forceKill;
	let usage;

	const child = spawn( codexExecutable, args, {
		cwd: workspace,
		detached: true,
		env: environment,
		stdio: [ 'ignore', 'pipe', 'pipe' ],
	} );
	activeChildren.add( child );

	function requestStop() {
		stopPromise ||= new Promise( ( resolve ) => {
			signalProcessGroup( child.pid, 'SIGTERM' );
			forceKill = setTimeout( () => {
				signalProcessGroup( child.pid, 'SIGKILL' );
				resolve();
			}, 2_000 );
			child.once( 'close', () => {
				clearTimeout( forceKill );
				resolve();
			} );
		} );
		return stopPromise;
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
		const retainedEvent = sanitizeJsonValue( event );
		events.push( retainedEvent );
		if ( event.type === 'turn.completed' ) {
			completed = true;
			usage = event.usage;
		}
		if (
			event.type === 'item.completed' &&
			event.item?.type === 'agent_message'
		) {
			messages.push( sanitize( event.item.text ?? '' ) );
		}
		if (
			event.type === 'item.completed' &&
			event.item?.type === 'command_execution'
		) {
			const output = sanitize( event.item.aggregated_output ?? '' );
			const command = sanitize( event.item.command ?? '' );
			const loadedSkills = loadedSkillNames( command, output );
			for ( const skill of loadedSkills ) {
				if ( ! observedSkills.includes( skill ) ) {
					observedSkills.push( skill );
				}
			}
			commandEvents.push( {
				command,
				exitCode: event.item.exit_code,
				loadedSkills,
				output,
				outputSha256: sha256( output ),
			} );
		}
	}

	child.stdout.setEncoding( 'utf8' );
	child.stdout.on( 'data', ( chunk ) => {
		stdout += chunk;
		stdoutBuffer += chunk;
		const lines = stdoutBuffer.split( '\n' );
		stdoutBuffer = lines.pop();
		for ( const line of lines ) {
			inspectLine( line );
		}
	} );
	child.stderr.setEncoding( 'utf8' );
	child.stderr.on( 'data', ( chunk ) => {
		stderr += chunk;
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
	clearTimeout( forceKill );
	await stopPromise;
	if ( stdoutBuffer ) {
		inspectLine( stdoutBuffer );
	}

	const retainedStdout = sanitize( stdout );
	const retainedStderr = sanitize( stderr );
	return {
		commandEvents,
		completed,
		durationMs: Date.now() - startedAt,
		events,
		exitCode: close.exitCode,
		finalText: messages.at( -1 ) ?? '',
		messages,
		observedSkills,
		signal: close.signal,
		stderr: {
			preview: retainedStderr.slice( 0, stderrPreviewLimit ),
			retainedBytes: Buffer.byteLength( retainedStderr ),
			retainedSha256: sha256( retainedStderr ),
			truncated: retainedStderr.length > stderrPreviewLimit,
		},
		stdout: {
			retainedBytes: Buffer.byteLength( retainedStdout ),
			retainedSha256: sha256( retainedStdout ),
		},
		timedOut,
		usage,
	};
}

function loadedSkillNames( command, output ) {
	if ( ! command.includes( 'SKILL.md' ) ) {
		return [];
	}
	const observed = [];
	for ( const match of output.matchAll(
		/(?:^|\n)(?:\s*\d+\s+)?name:\s*["']?([a-z0-9-]+)["']?\s*(?:\n|$)/g
	) ) {
		if ( ! observed.includes( match[ 1 ] ) ) {
			observed.push( match[ 1 ] );
		}
	}
	return observed;
}

async function workspaceManifest( root ) {
	const files = new Map();
	async function visit( directory ) {
		const entries = await fs.readdir( directory, { withFileTypes: true } );
		for ( const entry of entries ) {
			if ( entry.name === '.git' && directory === root ) {
				continue;
			}
			const absolutePath = path.join( directory, entry.name );
			const relativePath = path.relative( root, absolutePath );
			if ( entry.isDirectory() ) {
				await visit( absolutePath );
				continue;
			}
			if ( entry.isSymbolicLink() ) {
				files.set( relativePath, {
					kind: 'symlink',
					target: await fs.readlink( absolutePath ),
				} );
				continue;
			}
			if ( ! entry.isFile() ) {
				continue;
			}
			const buffer = await fs.readFile( absolutePath );
			const text = buffer.toString( 'utf8' );
			const isText =
				! buffer.includes( 0 ) && Buffer.from( text, 'utf8' ).equals( buffer );
			files.set( relativePath, {
				bytes: buffer.length,
				content:
					isText && buffer.length <= maximumRetainedArtifactBytes
						? sanitize( text )
						: undefined,
				kind: 'file',
				sha256: sha256( buffer ),
			} );
		}
	}
	await visit( root );
	return files;
}

function workspaceDelta( before, after ) {
	const addedFiles = [];
	const changedFiles = [];
	const deletedFiles = [];
	const generatedArtifacts = [];
	for ( const [ filePath, details ] of after ) {
		const baseline = before.get( filePath );
		if ( ! baseline ) {
			addedFiles.push( filePath );
			generatedArtifacts.push( { path: filePath, ...details } );
			continue;
		}
		if ( JSON.stringify( baseline ) !== JSON.stringify( details ) ) {
			changedFiles.push( filePath );
			generatedArtifacts.push( { path: filePath, ...details } );
		}
	}
	for ( const filePath of before.keys() ) {
		if ( ! after.has( filePath ) ) {
			deletedFiles.push( filePath );
		}
	}
	return {
		addedFiles: addedFiles.sort(),
		changedFiles: changedFiles.sort(),
		deletedFiles: deletedFiles.sort(),
		generatedArtifacts: generatedArtifacts.sort( ( left, right ) =>
			left.path.localeCompare( right.path )
		),
	};
}

async function gradeResult(
	codexExecutable,
	testCase,
	subject,
	delta,
	environment,
	isolatedEnvironment
) {
	const evidence = {
		assertions: testCase.assertions,
		commandEvents: subject.commandEvents,
		context: testCase.context,
		execution: {
			completed: subject.completed,
			exitCode: subject.exitCode,
			observedSkills: subject.observedSkills,
			timedOut: subject.timedOut,
		},
		expectedOutcome: testCase.expectedOutcome,
		finalText: subject.finalText,
		generatedArtifacts: delta.generatedArtifacts,
		prompt: testCase.prompt,
		skill: testCase.skill,
		workspaceDelta: {
			addedFiles: delta.addedFiles,
			changedFiles: delta.changedFiles,
			deletedFiles: delta.deletedFiles,
		},
	};
	const evidencePath = path.join(
		environment.graderWorkspace,
		'evidence.json'
	);
	await fs.writeFile( evidencePath, JSON.stringify( evidence, null, 2 ) + '\n', {
		mode: 0o444,
	} );
	const graderEnvironment = createChildEnvironment(
		environment.graderHome,
		environment.graderCodexHome,
		environment.graderWorkspace,
		environment.graderShell.configurationRoot,
		environment.graderShell.configuredPath
	);
	const profile = permissionProfile(
		[
			environment.graderHome,
			environment.graderWorkspace,
			isolatedEnvironment.root,
		],
		[],
		[
			environment.sensitiveRoot,
			environment.graderCodexHome,
			sourceCodexHome,
		]
	);
	const grader = await executeCodex( {
		codexExecutable,
		environment: graderEnvironment,
		profile,
		prompt: graderPrompt( evidencePath ),
		timeoutMs: graderTimeoutMs,
		workspace: environment.graderWorkspace,
	} );
	try {
		return {
			assertionResults: parseGrades(
				grader.finalText,
				testCase.assertions
			),
			execution: grader,
		};
	} catch ( error ) {
		return {
			assertionResults: testCase.assertions.map( ( assertion, index ) => ( {
				assertion,
				evidence:
					'Grader output could not be validated: ' + error.message,
				index: index + 1,
				status: 'blocked',
			} ) ),
			execution: grader,
		};
	}
}

function parseGrades( finalText, assertions ) {
	const firstBrace = finalText.indexOf( '{' );
	const lastBrace = finalText.lastIndexOf( '}' );
	if ( firstBrace === -1 || lastBrace <= firstBrace ) {
		throw new Error( 'no JSON object was returned' );
	}
	const parsed = JSON.parse( finalText.slice( firstBrace, lastBrace + 1 ) );
	if (
		! Array.isArray( parsed.assertionResults ) ||
		parsed.assertionResults.length !== assertions.length
	) {
		throw new Error( 'assertion result count does not match the fixture' );
	}
	return parsed.assertionResults.map( ( result, index ) => {
		if (
			result.index !== index + 1 ||
			! [ 'pass', 'fail', 'blocked' ].includes( result.status ) ||
			typeof result.evidence !== 'string' ||
			! result.evidence.trim()
		) {
			throw new Error(
				'assertion result ' + ( index + 1 ) + ' is invalid'
			);
		}
		return {
			assertion: assertions[ index ],
			evidence: sanitize( result.evidence.trim() ),
			index: index + 1,
			status: result.status,
		};
	} );
}

function deriveCaseStatus( assertionResults ) {
	if ( assertionResults.every( ( result ) => result.status === 'pass' ) ) {
		return 'pass';
	}
	if ( assertionResults.every( ( result ) => result.status === 'blocked' ) ) {
		return 'blocked';
	}
	return 'partial';
}

function subjectTimeoutForCase( testCase ) {
	return [ 'review-pr', 'review-coordinator' ].includes( testCase.skill )
		? extendedSubjectTimeoutMs
		: subjectTimeoutMs;
}

async function runCase(
	codexExecutable,
	isolatedEnvironment,
	skillNames,
	testCase,
	ordinal
) {
	const environment = await createCaseEnvironment(
		isolatedEnvironment,
		skillNames,
		testCase
	);
	try {
		const before = await workspaceManifest( environment.workspace );
		const subjectEnvironment = createChildEnvironment(
			environment.userHome,
			environment.subjectCodexHome,
			environment.workspace,
			environment.subjectShell.configurationRoot,
			environment.subjectShell.configuredPath
		);
		const subjectProfile = permissionProfile(
			[ isolatedEnvironment.root ],
			[ environment.root ],
			[
				environment.sensitiveRoot,
				environment.subjectCodexHome,
				environment.graderCodexHome,
				sourceCodexHome,
			]
		);
		const subject = await executeCodex( {
			codexExecutable,
			environment: subjectEnvironment,
			profile: subjectProfile,
			prompt: subjectPrompt( testCase, environment ),
			timeoutMs: subjectTimeoutForCase( testCase ),
			workspace: environment.workspace,
		} );
		const after = await workspaceManifest( environment.workspace );
		const delta = workspaceDelta( before, after );
		const grading = await gradeResult(
			codexExecutable,
			testCase,
			subject,
			delta,
			environment,
			isolatedEnvironment
		);
		const status = deriveCaseStatus( grading.assertionResults );
		return {
			assertionResults: grading.assertionResults,
			caseId: testCase.caseId,
			contextPath: testCase.contextPath,
			contextSha256: testCase.contextSha256,
			executableFixture: testCase.executableFixture
				? {
						path: testCase.executableFixture.path,
						treeSha1: testCase.executableFixture.treeSha1,
					}
				: undefined,
			expectedOutcome: testCase.expectedOutcome,
			grader: grading.execution,
			ordinal,
			prompt: testCase.prompt,
			skill: testCase.skill,
			status,
			subject,
			workspaceDelta: {
				addedFiles: delta.addedFiles,
				changedFiles: delta.changedFiles,
				deletedFiles: delta.deletedFiles,
				generatedArtifacts: delta.generatedArtifacts,
			},
		};
	} finally {
		await Promise.all( [
			fs.rm( environment.root, { recursive: true, force: true } ),
			fs.rm( environment.sensitiveRoot, {
				recursive: true,
				force: true,
			} ),
		] );
		ephemeralRoots.delete( environment.root );
		sensitiveRoots.delete( environment.sensitiveRoot );
		clientHomeRoots.delete( environment.subjectCodexHome );
		clientHomeRoots.delete( environment.graderCodexHome );
	}
}

async function runPool( jobs, concurrency, worker ) {
	const results = new Array( jobs.length );
	let nextIndex = 0;
	async function runWorker() {
		while ( ! isShuttingDown ) {
			const index = nextIndex++;
			if ( index >= jobs.length ) {
				return;
			}
			results[ index ] = await worker( jobs[ index ], index );
		}
	}
	await Promise.all(
		Array.from(
			{ length: Math.min( concurrency, jobs.length ) },
			runWorker
		)
	);
	return results;
}

function campaignSummary( results ) {
	const assertionResults = results.flatMap(
		( result ) => result.assertionResults
	);
	const caseStatuses = countStatuses( results.map( ( result ) => result.status ) );
	const assertionStatuses = countStatuses(
		assertionResults.map( ( result ) => result.status )
	);
	const subjectUsage = sumUsage( results.map( ( result ) => result.subject.usage ) );
	const graderUsage = sumUsage( results.map( ( result ) => result.grader.usage ) );
	return {
		assertionStatuses,
		caseStatuses,
		cases: results.length,
		graderUsage,
		overall:
			caseStatuses.pass === results.length
				? 'pass'
				: caseStatuses.blocked === results.length
					? 'blocked'
					: 'partial',
		subjectUsage,
	};
}

function countStatuses( statuses ) {
	return statuses.reduce(
		( counts, status ) => {
			counts[ status ] = ( counts[ status ] ?? 0 ) + 1;
			return counts;
		},
		{ blocked: 0, fail: 0, partial: 0, pass: 0 }
	);
}

function sumUsage( usages ) {
	const totals = {};
	for ( const usage of usages.filter( Boolean ) ) {
		for ( const [ key, value ] of Object.entries( usage ) ) {
			if ( typeof value === 'number' ) {
				totals[ key ] = ( totals[ key ] ?? 0 ) + value;
			}
		}
	}
	return totals;
}

function sanitizeJsonValue( value ) {
	return JSON.parse( sanitize( JSON.stringify( value ) ) );
}

function sanitize( value ) {
	const pathReplacements = [
		[ sourceAuthPath, '[source-client-home]/auth.json' ],
		[ sourceCodexHome, '[source-client-home]' ],
		[ repositoryRoot, '[repository]' ],
		[ os.homedir(), '[home]' ],
		...[ ...clientHomeRoots ].map( ( root ) => [ root, '[client-home]' ] ),
		...[ ...sensitiveRoots ].map( ( root ) => [ root, '[client-state]' ] ),
		...restrictedTemporaryRoots.map( ( root ) => [
			root,
			'[temporary]',
		] ),
		...conventionalTemporaryRoots.map( ( root ) => [
			root,
			'[temporary]',
		] ),
	]
		.flatMap( ( [ root, replacement ] ) =>
			pathVariants( root ).map( ( variant ) => [ variant, replacement ] )
		)
		.filter( ( [ root ] ) => root && root !== path.parse( root ).root )
		.sort( ( [ left ], [ right ] ) => right.length - left.length );
	let sanitized = String( value );
	for ( const [ root, replacement ] of pathReplacements ) {
		sanitized = replacePathRoot( sanitized, root, replacement );
	}
	sanitized = sanitized
		.replace( /\bCODEX_THREAD_ID=[^\s]+/g, 'CODEX_THREAD_ID=[thread]' )
		.replace(
			/(\b(?:no thread with id|sender_thread_id|thread id|thread_id)["']?\s*[:=]\s*["']?)[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(["']?)/gi,
			'$1[thread]$2'
		)
		.replace( /\bgh[opsu]_[A-Za-z0-9_]+\b/g, '[secret]' )
		.replace( /\bsk-[A-Za-z0-9_-]+\b/g, '[secret]' )
		.replace(
			/(authorization["']?\s*[:=]\s*["']?bearer\s+)[^\s"']+/gi,
			'$1[secret]'
		);
	for ( const [ identity, replacement ] of hostIdentityReplacements ) {
		sanitized = sanitized.replaceAll( identity, replacement );
	}
	return sanitized;
}

function pathVariants( root ) {
	const variants = new Set( [ root ] );
	try {
		variants.add( realpathSync( root ) );
	} catch ( error ) {
		if ( error.code !== 'ENOENT' ) {
			throw error;
		}
	}
	return [ ...variants ];
}

function replacePathRoot( value, root, replacement ) {
	return value.replace(
		new RegExp(
			escapeRegExp( root ) +
				'(?=\\/|$|[\\s\\x22\\x27\\x60(){}\\[\\],:;|&<>#?=!])',
			'g'
		),
		replacement
	);
}

function escapeRegExp( value ) {
	return value.replace( /[.*+?^\\x24{}()|[\\]\\\\]/g, '\\$&' );
}

function shellSingleQuote( value ) {
	const escapedQuote = "'" + '"' + "'" + '"' + "'";
	return "'" + value.replaceAll( "'", escapedQuote ) + "'";
}

function signalProcessGroup( processGroupId, signal ) {
	try {
		process.kill( -processGroupId, signal );
	} catch ( error ) {
		if ( ! [ 'EPERM', 'ESRCH' ].includes( error.code ) ) {
			throw error;
		}
		try {
			process.kill( processGroupId, signal );
		} catch ( fallbackError ) {
			if ( fallbackError.code !== 'ESRCH' ) {
				throw fallbackError;
			}
		}
	}
}

function sha256( value ) {
	return createHash( 'sha256' ).update( value ).digest( 'hex' );
}

function verifySelf() {
	const parsed = parseGrades(
		'{"assertionResults":[{"index":1,"status":"pass","evidence":"ok"}]}',
		[ 'one' ]
	);
	if (
		parsed[ 0 ].assertion !== 'one' ||
		deriveCaseStatus( parsed ) !== 'pass'
	) {
		throw new Error( 'Output evaluation runner: grading self-check failed.' );
	}
	if (
		deriveCaseStatus( [
			{ status: 'pass' },
			{ status: 'blocked' },
		] ) !== 'partial'
	) {
		throw new Error( 'Output evaluation runner: status self-check failed.' );
	}
	if (
		JSON.stringify(
			loadedSkillNames(
				'sed -n 1,200p /tmp/.agents/skills/review-pr/SKILL.md',
				'---\nname: review-pr\ndescription: Review\n---\n'
			)
		) !== JSON.stringify( [ 'review-pr' ] )
	) {
		throw new Error(
			'Output evaluation runner: skill-load self-check failed.'
		);
	}
	const secret = 'gho_' + 'exampletoken';
	if ( sanitize( secret ) !== '[secret]' ) {
		throw new Error(
			'Output evaluation runner: secret sanitizer self-check failed.'
		);
	}
	const runtimeThreadId = '019fcafb-b99e-7372-a399-89ca150c557e';
	for ( const [ value, expected ] of [
		[ `CODEX_THREAD_ID=${ runtimeThreadId }`, 'CODEX_THREAD_ID=[thread]' ],
		[
			`{"thread_id":"${ runtimeThreadId }"}`,
			'{"thread_id":"[thread]"}',
		],
		[
			`{"sender_thread_id":"${ runtimeThreadId }"}`,
			'{"sender_thread_id":"[thread]"}',
		],
		[
			`no thread with id: ${ runtimeThreadId }`,
			'no thread with id: [thread]',
		],
	] ) {
		if ( sanitize( value ) !== expected ) {
			throw new Error(
				'Output evaluation runner: runtime-identifier sanitizer self-check failed.'
			);
		}
	}
}

verifySelf();
if ( options.verifySelf ) {
	process.stdout.write( 'Output evaluation runner self-checks passed.\n' );
	process.exit( 0 );
}

const codexExecutable = resolveExecutable( 'codex' );
const clientVersion = spawnSync( codexExecutable, [ '--version' ], {
	encoding: 'utf8',
} ).stdout.trim();
const skillNames = targetSkillNames();
const isolatedEnvironment = await createIsolatedEnvironment( skillNames );

try {
	const allCases = await loadCases(
		skillNames,
		isolatedEnvironment.installedRoot
	);
	const availableCases = new Set(
		allCases.map( ( testCase ) => testCase.skill + '/' + testCase.caseId )
	);
	const missingCases = options.cases.filter(
		( requestedCase ) => ! availableCases.has( requestedCase )
	);
	if ( missingCases.length ) {
		throw new Error(
			'Output evaluation runner: unknown case filter(s): ' +
				missingCases.join( ', ' ) +
				'.'
		);
	}
	const requestedCaseSet = new Set( options.cases );
	const cases = requestedCaseSet.size
		? allCases.filter( ( testCase ) =>
				requestedCaseSet.has( testCase.skill + '/' + testCase.caseId )
			)
		: allCases;
	const provenance = await collectProvenance(
		skillNames,
		isolatedEnvironment.installedRoot
	);
	const campaign = {
		client: {
			authentication:
				'A source Codex credential was copied into a private per-process client home. The narrowed model permission profile excluded the source and copied credential. Unlike the trigger runner, this output runner did not retain an independent exact-exec boundary preflight.',
			environment: process.platform + ' ' + os.release() + ' ' + os.arch(),
			model,
			name: 'Codex CLI',
			reasoningEffort,
			serviceTier,
			version: clientVersion,
		},
		fixtureRevision: targetRevision,
		grading: {
			method:
				'A fresh isolated grader compared every fixture assertion with the retained fixture, subject response, complete command events, workspace delta, and generated artifacts.',
			scale: [ 'pass', 'fail', 'blocked' ],
		},
		provenance,
		repositoryRevision: targetRevision,
		results: [],
		runner: {
			caseFilter: options.cases,
			concurrency: options.concurrency,
			featureEnables: [ 'multi_agent' ],
			featureDisables: [
				'plugins',
				'apps',
				'browser_use',
				'browser_use_external',
				'in_app_browser',
				'computer_use',
				'image_generation',
				'memories',
				'hooks',
				'remote_plugin',
				'tool_suggest',
			],
			graderTimeoutSeconds: graderTimeoutMs / 1000,
			invocation:
				'run-output-evaluations.mjs --output <path> [--case <skill>/<case-id>]... [--concurrency <1-8>]',
			name: 'versioned Codex output evaluation runner',
			runnerSha256: sha256( await fs.readFile( scriptPath ) ),
			subjectTimeoutSeconds: subjectTimeoutMs / 1000,
			subjectTimeoutOverrides: {
				'review-coordinator': extendedSubjectTimeoutMs / 1000,
				'review-pr': extendedSubjectTimeoutMs / 1000,
			},
		},
		schemaVersion: 2,
		summary: undefined,
	};
	await fs.mkdir( path.dirname( options.output ), { recursive: true } );
	const outputTemporaryPath = path.join(
		path.dirname( options.output ),
		'.' + path.basename( options.output ) + '.' + process.pid + '.tmp'
	);
	const writeCampaign = async () => {
		campaign.summary = campaignSummary( campaign.results );
		await fs.writeFile(
			outputTemporaryPath,
			JSON.stringify( campaign, null, 2 ) + '\n'
		);
		await fs.rename( outputTemporaryPath, options.output );
	};

	campaign.results = await runPool(
		cases,
		options.concurrency,
		async ( testCase, index ) => {
			const result = await runCase(
				codexExecutable,
				isolatedEnvironment,
				skillNames,
				testCase,
				index
			);
			process.stdout.write(
				'[' +
					( index + 1 ) +
					'/' +
					cases.length +
					'] ' +
					testCase.skill +
					'/' +
					testCase.caseId +
					': ' +
					result.status +
					'\n'
			);
			return result;
		}
	);
	campaign.results.sort( ( left, right ) => left.ordinal - right.ordinal );
	await writeCampaign();
	process.stdout.write( JSON.stringify( campaign.summary ) + '\n' );
} finally {
	await cleanupRoots();
}
