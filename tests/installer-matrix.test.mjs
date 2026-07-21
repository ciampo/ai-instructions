import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
	mkdtemp,
	mkdir,
	lstat,
	readdir,
	readFile,
	rm,
	symlink,
	writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { validateManifest } from '../scripts/lib/manifest.mjs';
import {
	removeOwnedPath,
	writeNewFileAtomic,
	writeOwnedFileAtomic,
	writeSkillDirectoryAtomic,
} from '../scripts/lib/files.mjs';

const repoDir = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '..' );
const setupScript = path.join( repoDir, 'scripts', 'setup.mjs' );
const manifestPath = path.join( repoDir, 'platforms', 'manifest.json' );
const manifest = validateManifest( JSON.parse( await readFile( manifestPath, 'utf8' ) ) );
const managedMarker = '<!-- ai-instructions:managed -->';
const categories = [ 'instructions', 'skills', 'agents' ];
const partialCategorySelections = categories
	.flatMap( ( first, index ) => [ [ first ], ...categories.slice( index + 1 ).map( ( second ) => [ first, second ] ) ] );

function destination( home, relativePath ) {
	return path.join( home, ...relativePath.split( '/' ) );
}

function runInstaller( home, args, expectedStatus = 0 ) {
	const result = spawnSync( process.execPath, [ setupScript, ...args ], {
		cwd: repoDir,
		env: { ...process.env, HOME: home, NO_COLOR: '1' },
		encoding: 'utf8',
	} );

	assert.equal(
		result.status,
		expectedStatus,
		`installer ${ args.join( ' ' ) } exited ${ result.status }\n${ result.stdout }${ result.stderr }`
	);
	return `${ result.stdout }${ result.stderr }`;
}

async function pathExists( target ) {
	try {
		await lstat( target );
		return true;
	} catch ( error ) {
		if ( error.code === 'ENOENT' ) {
			return false;
		}
		throw error;
	}
}

function artifactPath( platform, category, home ) {
	const capability = platform.capabilities[ category ];
	if ( ! capability.supported ) {
		return null;
	}

	const base = destination( home, capability.userPath );
	if ( category === 'instructions' ) {
		return capability.strategy === 'concat'
			? base
			: path.join( base, `coding-principles${ capability.extension }` );
	}
	if ( category === 'skills' ) {
		return path.join( base, 'review-pr', 'SKILL.md' );
	}
	return path.join( base, `a11y-reviewer${ capability.extension }` );
}

async function createDetectedHome( platform ) {
	const home = await mkdtemp( path.join( os.tmpdir(), `ai-instructions-${ platform.id }-` ) );
	await mkdir( destination( home, platform.detection.userPath ), { recursive: true } );
	return home;
}

function normalizedWithTrailingNewline( content ) {
	content = content.replace( /\r\n?/g, '\n' );
	return content.endsWith( '\n' ) ? content : `${ content }\n`;
}

async function expectedConcatenatedInstructions() {
	const instructionNames = ( await readdir( path.join( repoDir, 'instructions' ) ) )
		.filter( ( name ) => name.endsWith( '.md' ) )
		.sort();
	const sections = [];
	for ( const name of instructionNames ) {
		const source = normalizedWithTrailingNewline(
			await readFile( path.join( repoDir, 'instructions', name ), 'utf8' )
		);
		sections.push( `<!-- source: ${ name } -->\n\n${ source }\n---\n` );
	}
	return `${ managedMarker }\n${ sections.join( '\n' ) }\n`;
}

test( 'manifest declares complete, current platform contracts', () => {
	assert.equal( manifest.schemaVersion, 1 );
	assert.deepEqual(
		manifest.platforms.map( ( platform ) => platform.id ),
		[ 'cursor', 'claude', 'codex', 'copilot', 'gemini' ]
	);

	for ( const platform of manifest.platforms ) {
		assert.match( platform.surface, /\S/ );
		assert.match( platform.lastVerified, /^\d{4}-\d{2}-\d{2}$/ );
		assert.ok( [ 'verified', 'preview' ].includes( platform.supportTier ) );
		for ( const category of categories ) {
			assert.equal( typeof platform.capabilities[ category ].supported, 'boolean' );
		}
	}
} );

test( 'manifest rejects unsafe legacy migration paths', () => {
	const invalidManifest = structuredClone( manifest );
	invalidManifest.platforms[ 0 ].legacyDestinations[ 0 ].sourceRoot = '../outside-repository';
	assert.throws(
		() => validateManifest( invalidManifest ),
		/legacyDestinations\[0\]\.sourceRoot must stay within/
	);
} );

test( 'manifest rejects support tiers outside the documented contract', () => {
	const invalidManifest = structuredClone( manifest );
	invalidManifest.platforms[ 0 ].supportTier = 'experimental';
	assert.throws(
		() => validateManifest( invalidManifest ),
		/cursor\.supportTier is invalid/
	);
} );

test( 'file mutations fail closed when ownership changes after inspection', async ( t ) => {
	const directory = await mkdtemp( path.join( os.tmpdir(), 'ai-instructions-ownership-' ) );
	t.after( () => rm( directory, { recursive: true, force: true } ) );
	const target = path.join( directory, 'managed.md' );

	await writeFile( target, `${ managedMarker }\nmanaged\n` );
	await writeFile( target, '# user-owned replacement\n' );
	await assert.rejects(
		writeOwnedFileAtomic( target, `${ managedMarker }\nupdated\n`, repoDir ),
		/ownership changed/
	);
	assert.equal( await readFile( target, 'utf8' ), '# user-owned replacement\n' );

	assert.equal( await removeOwnedPath( target, repoDir ), false );
	assert.equal( await readFile( target, 'utf8' ), '# user-owned replacement\n' );
	await assert.rejects(
		writeNewFileAtomic( target, `${ managedMarker }\nnew\n` ),
		( error ) => error.code === 'EEXIST'
	);
	assert.equal( await readFile( target, 'utf8' ), '# user-owned replacement\n' );
} );

test( 'directory replacement preserves its backup when the destination reappears', async ( t ) => {
	const directory = await mkdtemp( path.join( os.tmpdir(), 'ai-instructions-directory-race-' ) );
	t.after( () => rm( directory, { recursive: true, force: true } ) );
	const source = path.join( directory, 'source' );
	const destination = path.join( directory, 'installed-skill' );
	await mkdir( source );
	await mkdir( destination );
	await writeFile( path.join( source, 'SKILL.md' ), '# Updated skill\n' );
	await writeFile( path.join( destination, 'SKILL.md' ), '# Original skill\n' );

	let backup;
	await assert.rejects(
		writeSkillDirectoryAtomic(
			source,
			destination,
			'# Managed updated skill\n',
			async ( captured ) => {
				backup = captured;
				await mkdir( destination );
				await writeFile( path.join( destination, 'user-owned.md' ), '# User-owned replacement\n' );
				return true;
			}
		),
		( error ) => error.code === 'EEXIST' && error.backupPath === backup
	);
	assert.equal(
		await readFile( path.join( destination, 'user-owned.md' ), 'utf8' ),
		'# User-owned replacement\n'
	);
	assert.equal( await readFile( path.join( backup, 'SKILL.md' ), 'utf8' ), '# Original skill\n' );
} );

for ( const platform of manifest.platforms ) {
	test( `${ platform.id }: copy lifecycle and category isolation`, async ( t ) => {
		const home = await createDetectedHome( platform );
		t.after( () => rm( home, { recursive: true, force: true } ) );

		runInstaller( home, [ 'check', '--agent', platform.id, '--copy', '--yes' ], 1 );
		runInstaller( home, [ '--agent', platform.id, '--copy', '--yes' ] );
		runInstaller( home, [ 'check', '--agent', platform.id, '--copy', '--yes' ] );
		const listOutput = runInstaller( home, [ 'list', '--agent', platform.id, '--copy', '--yes' ] );
		assert.match( listOutput, /\[(?:ok|unsupported)\]/ );
		assert.match(
			runInstaller( home, [ '--agent', platform.id, '--copy', '--yes' ] ),
			/Already up to date/
		);

		for ( const category of categories ) {
			const target = artifactPath( platform, category, home );
			if ( target ) {
				assert.equal( await pathExists( target ), true, `${ category } artifact missing` );
			}
		}

		runInstaller( home, [ 'remove', '--agent', platform.id, '--copy', '--yes' ] );
		assert.equal(
			await pathExists( destination( home, platform.detection.userPath ) ),
			true,
			`${ platform.id } configuration root was removed`
		);
		for ( const category of [ 'instructions', 'skills', 'agents' ] ) {
			const target = artifactPath( platform, category, home );
			if ( target ) {
				assert.equal( await pathExists( target ), false, `${ category } artifact not removed` );
			}
		}

		for ( const selection of partialCategorySelections ) {
			const partialHome = await createDetectedHome( platform );
			t.after( () => rm( partialHome, { recursive: true, force: true } ) );
			const output = runInstaller( partialHome, [
				'--agent',
				platform.id,
				...selection.flatMap( ( category ) => [ '--only', category ] ),
				'--copy',
				'--yes',
			] );
			for ( const category of categories ) {
				const target = artifactPath( platform, category, partialHome );
				if ( target ) {
					assert.equal(
						await pathExists( target ),
						selection.includes( category ),
						`${ selection.join( '+' ) } selection produced unexpected ${ category } state`
					);
				} else if ( selection.includes( category ) ) {
					assert.match( output, /not supported/i );
				}
			}
			runInstaller( partialHome, [
				'check',
				'--agent',
				platform.id,
				...selection.flatMap( ( category ) => [ '--only', category ] ),
				'--copy',
				'--yes',
			] );
		}
	} );

	test( `${ platform.id }: user-owned conflicts are preserved`, async ( t ) => {
		const home = await createDetectedHome( platform );
		t.after( () => rm( home, { recursive: true, force: true } ) );
		const target = artifactPath( platform, 'skills', home );
		await mkdir( path.dirname( target ), { recursive: true } );
		await writeFile( target, '# user-owned\n' );

		assert.match(
			runInstaller( home, [ '--agent', platform.id, '--only', 'skills', '--copy', '--yes' ] ),
			/already exists/
		);
		assert.equal( await readFile( target, 'utf8' ), '# user-owned\n' );
		runInstaller( home, [ 'check', '--agent', platform.id, '--only', 'skills', '--copy', '--yes' ], 1 );
		runInstaller( home, [ 'remove', '--agent', platform.id, '--only', 'skills', '--copy', '--yes' ] );
		assert.equal( await readFile( target, 'utf8' ), '# user-owned\n' );
	} );

	test( `${ platform.id }: stale managed artifacts fail check and update safely`, async ( t ) => {
		const home = await createDetectedHome( platform );
		t.after( () => rm( home, { recursive: true, force: true } ) );
		const capability = platform.capabilities.agents;
		const staleExtension = capability.supported ? capability.extension : '.md';
		const staleDir = capability.supported
			? destination( home, capability.userPath )
			: destination( home, platform.capabilities.skills.userPath );
		const stalePath = path.join( staleDir, `removed-agent${ staleExtension }` );
		await mkdir( staleDir, { recursive: true } );
		await writeFile(
			stalePath,
			staleExtension === '.toml'
				? '# ai-instructions:managed\nname = "removed-agent"\n'
				: `---\nname: removed-agent\ndescription: stale\n---\n${ managedMarker }\n`
		);

		runInstaller( home, [ 'check', '--agent', platform.id, '--copy', '--yes' ], 1 );
		runInstaller( home, [ 'update', '--agent', platform.id, '--copy', '--yes' ] );
		assert.equal( await pathExists( stalePath ), false );
	} );
}

test( 'portable artifacts use symlinks on POSIX and remain checkable', {
	skip: process.platform === 'win32',
}, async ( t ) => {
	for ( const platform of manifest.platforms ) {
		const home = await createDetectedHome( platform );
		t.after( () => rm( home, { recursive: true, force: true } ) );
		runInstaller( home, [ '--agent', platform.id, '--yes' ] );
		assert.equal( ( await lstat( path.dirname( artifactPath( platform, 'skills', home ) ) ) ).isSymbolicLink(), true );
		runInstaller( home, [ 'check', '--agent', platform.id, '--yes' ] );
		assert.match( runInstaller( home, [ 'list', '--agent', platform.id, '--yes' ] ), /\[ok\]/ );
		runInstaller( home, [ 'remove', '--agent', platform.id, '--yes' ] );
	}
} );

test( 'generated formats match their exact platform contracts', async ( t ) => {
	const home = await mkdtemp( path.join( os.tmpdir(), 'ai-instructions-formats-' ) );
	t.after( () => rm( home, { recursive: true, force: true } ) );
	for ( const platform of manifest.platforms ) {
		await mkdir( destination( home, platform.detection.userPath ), { recursive: true } );
	}
	runInstaller( home, [ '--agent', '*', '--copy', '--yes' ] );

	const instructionSource = normalizedWithTrailingNewline(
		await readFile( path.join( repoDir, 'instructions', 'coding-principles.md' ), 'utf8' )
	);
	assert.equal(
		await readFile( destination( home, '.cursor/rules/coding-principles.mdc' ), 'utf8' ),
		`---\ndescription: 'Coding Principles'\nalwaysApply: true\n---\n${ managedMarker }\n${ instructionSource }`
	);
	assert.equal(
		await readFile( destination( home, '.claude/rules/coding-principles.md' ), 'utf8' ),
		`${ managedMarker }\n${ instructionSource }`
	);
	const concatenatedInstructions = await expectedConcatenatedInstructions();
	for ( const relativePath of [
		'.codex/AGENTS.md',
		'.copilot/copilot-instructions.md',
		'.gemini/GEMINI.md',
	] ) {
		assert.equal( await readFile( destination( home, relativePath ), 'utf8' ), concatenatedInstructions );
	}

	const skillSource = normalizedWithTrailingNewline(
		await readFile( path.join( repoDir, 'skills', 'review-pr', 'SKILL.md' ), 'utf8' )
	);
	for ( const platform of manifest.platforms ) {
		assert.equal(
			await readFile( artifactPath( platform, 'skills', home ), 'utf8' ),
			`${ skillSource }${ managedMarker }\n`
		);
	}

	const agentSource = normalizedWithTrailingNewline(
		await readFile( path.join( repoDir, 'agents', 'a11y-reviewer.md' ), 'utf8' )
	);
	for ( const platform of manifest.platforms.filter( ( entry ) => entry.id !== 'codex' ) ) {
		assert.equal(
			await readFile( artifactPath( platform, 'agents', home ), 'utf8' ),
			`${ agentSource }${ managedMarker }\n`
		);
	}

	const codexAgent = await readFile( destination( home, '.codex/agents/a11y-reviewer.toml' ), 'utf8' );
	assert.match( codexAgent, /^# ai-instructions:managed\nname = "a11y-reviewer"\n/ );
	assert.match( codexAgent, /description = ".+"\ndeveloper_instructions = """\n/ );
	assert.match( codexAgent, /\n"""\n$/ );
} );

test( 'Codex override precedence is explicit and non-destructive', async ( t ) => {
	const platform = manifest.platforms.find( ( entry ) => entry.id === 'codex' );
	const home = await createDetectedHome( platform );
	t.after( () => rm( home, { recursive: true, force: true } ) );
	const overridePath = destination( home, '.codex/AGENTS.override.md' );
	await writeFile( overridePath, '# user override\n' );

	const output = runInstaller( home, [ '--agent', 'codex', '--only', 'instructions', '--yes' ] );
	assert.match( output, /AGENTS\.override\.md.*takes precedence/ );
	assert.equal( await pathExists( destination( home, '.codex/AGENTS.md' ) ), false );
	assert.equal( await readFile( overridePath, 'utf8' ), '# user override\n' );
} );

test( 'Codex check counts managed instructions blocked by an override as broken', async ( t ) => {
	const platform = manifest.platforms.find( ( entry ) => entry.id === 'codex' );
	const home = await createDetectedHome( platform );
	t.after( () => rm( home, { recursive: true, force: true } ) );
	runInstaller( home, [ '--agent', 'codex', '--only', 'instructions', '--yes' ] );
	const managedPath = destination( home, '.codex/AGENTS.md' );
	await writeFile( destination( home, '.codex/AGENTS.override.md' ), '# User override\n' );

	const output = runInstaller(
		home,
		[ 'check', '--agent', 'codex', '--only', 'instructions', '--yes' ],
		1
	);
	assert.match( output, /AGENTS\.override\.md.*takes precedence/ );
	assert.match( output, /Broken: 1/ );
	assert.equal( await pathExists( managedPath ), true );
} );

test( 'explicit Copilot repository export refreshes only managed files', async ( t ) => {
	const platform = manifest.platforms.find( ( entry ) => entry.id === 'copilot' );
	const home = await createDetectedHome( platform );
	const project = await mkdtemp( path.join( os.tmpdir(), 'ai-instructions-copilot-' ) );
	t.after( () => rm( home, { recursive: true, force: true } ) );
	t.after( () => rm( project, { recursive: true, force: true } ) );
	const target = path.join( project, '.github', 'copilot-instructions.md' );
	const arguments_ = [
		'--agent',
		'copilot',
		'--only',
		'skills',
		'--copy',
		'--yes',
		'--copilot-concat',
		project,
	];

	runInstaller( home, arguments_ );
	assert.match( await readFile( target, 'utf8' ), /^<!-- Auto-generated by ai-instructions\/setup\.sh --copilot-concat -->/ );
	await writeFile( target, '<!-- Auto-generated by ai-instructions/setup.sh --copilot-concat -->\nstale\n' );
	assert.match( runInstaller( home, arguments_ ), /outdated; run update/ );
	runInstaller( home, [ 'update', ...arguments_ ] );
	assert.doesNotMatch( await readFile( target, 'utf8' ), /\nstale\n/ );

	await writeFile( target, '# user-owned\n' );
	assert.match( runInstaller( home, [ 'update', ...arguments_ ] ), /was not generated.*skipping/ );
	assert.equal( await readFile( target, 'utf8' ), '# user-owned\n' );
} );

test( 'POSIX compatibility wrapper delegates to the Node CLI', {
	skip: process.platform === 'win32',
}, () => {
	const result = spawnSync( 'sh', [ path.join( repoDir, 'setup.sh' ), '--help' ], {
		cwd: repoDir,
		encoding: 'utf8',
	} );
	assert.equal( result.status, 0, result.stderr );
	assert.match( result.stdout, /Usage: setup\.sh/ );
} );

test( 'the Node entrypoint discovers the platform home when HOME is unset', () => {
	const env = { ...process.env };
	delete env.HOME;
	const result = spawnSync( process.execPath, [ setupScript, '--help' ], {
		cwd: repoDir,
		env,
		encoding: 'utf8',
	} );
	assert.equal( result.status, 0, result.stderr );
	assert.match( result.stdout, /Usage: setup\.sh/ );
} );

test( 'broken repository-owned symlinks are repairable for every platform', {
	skip: process.platform === 'win32',
}, async ( t ) => {
	for ( const platform of manifest.platforms ) {
		const home = await createDetectedHome( platform );
		t.after( () => rm( home, { recursive: true, force: true } ) );
		const target = artifactPath( platform, 'skills', home );
		await mkdir( path.dirname( target ), { recursive: true } );
		await symlink( path.join( repoDir, 'skills', 'removed', 'SKILL.md' ), target );

		runInstaller( home, [ 'check', '--agent', platform.id, '--only', 'skills', '--yes' ], 1 );
		runInstaller( home, [ 'update', '--agent', platform.id, '--only', 'skills', '--yes' ] );
		assert.equal( await pathExists( target ), true );
	}
} );
