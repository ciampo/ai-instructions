import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
	mkdtemp,
	mkdir,
	lstat,
	readdir,
	readFile,
	readlink,
	rm,
	symlink,
	writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { assertRecentDate, validateContent } from '../scripts/validate-content.mjs';
import { createArtifactBuilder } from '../scripts/lib/artifact-builder.mjs';
import { resolveUserChildPath, validateManifest } from '../scripts/lib/manifest.mjs';
import {
	removeOwnedPath,
	SKILL_DIRECTORY_MARKER,
	writeNewFileAtomic,
	writeOwnedFileSafely,
	writeSkillDirectorySafely,
	writeSymlinkSafely,
} from '../scripts/lib/files.mjs';

const repoDir = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '..' );
const setupScript = path.join( repoDir, 'scripts', 'setup.mjs' );
const manifestPath = path.join( repoDir, 'platforms', 'manifest.json' );
const manifest = validateManifest( JSON.parse( await readFile( manifestPath, 'utf8' ) ) );
const legacyFixturePath = path.join( repoDir, 'tests', 'fixtures', 'pre-modernization-install.json' );
const legacyFixture = JSON.parse( await readFile( legacyFixturePath, 'utf8' ) );
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

async function filesInDirectory( root, current = '' ) {
	const files = [];
	for ( const entry of await readdir( path.join( root, current ), { withFileTypes: true } ) ) {
		const relative = path.join( current, entry.name );
		if ( entry.isDirectory() ) {
			files.push( ...await filesInDirectory( root, relative ) );
		} else if ( entry.isFile() || entry.isSymbolicLink() ) {
			files.push( relative );
		}
	}
	return files.sort();
}

async function sourceSkillNames() {
	return ( await readdir( path.join( repoDir, 'skills' ), { withFileTypes: true } ) )
		.filter( ( entry ) => entry.isDirectory() )
		.map( ( entry ) => entry.name )
		.sort();
}

function artifactPath( platform, category, home ) {
	const capability = platform.capabilities[ category ];
	if ( ! capability.supported ) {
		return null;
	}

	const base = destination( home, capability.userPath );
	if ( category === 'instructions' ) {
		if ( capability.strategy === 'files' ) {
			return path.join( base, `${ capability.fileName }${ capability.extension }` );
		}
		return base;
	}
	if ( category === 'skills' ) {
		return path.join( base, 'review-pr', 'SKILL.md' );
	}
	return path.join( base, `a11y-reviewer${ capability.extension }` );
}

function retiredAgentExtension( platform ) {
	return platform.id === 'codex'
		? '.toml'
		: platform.id === 'copilot' ? '.agent.md' : '.md';
}

function skillPath( platform, home, skillName, relative = 'SKILL.md' ) {
	return path.join(
		destination( home, platform.capabilities.skills.userPath ),
		skillName,
		relative
	);
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

async function createContentFixture( t, {
	agentContent = '---\nname: example-agent\ndescription: Example agent.\n---\n',
	referenceContent,
} = {} ) {
	const fixture = await mkdtemp( path.join( os.tmpdir(), 'ai-instructions-content-' ) );
	t.after( () => rm( fixture, { recursive: true, force: true } ) );
	for ( const directory of [
		'agents',
		'docs',
		'platforms',
		'skills/example-skill/references',
	] ) {
		await mkdir( path.join( fixture, directory ), { recursive: true } );
	}

	const today = new Date().toISOString().slice( 0, 10 );
	const fixtureManifest = structuredClone( manifest );
	fixtureManifest.lastReviewed = today;
	for ( const platform of fixtureManifest.platforms ) {
		platform.lastAdapterChecked = today;
	}
	await writeFile(
		path.join( fixture, 'platforms', 'manifest.json' ),
		`${ JSON.stringify( fixtureManifest, null, 2 ) }\n`
	);
	await writeFile(
		path.join( fixture, 'skills', 'example-skill', 'SKILL.md' ),
		`---\nname: example-skill\ndescription: Example skill.\n---\n${ referenceContent === undefined ? '' : '\nRead [the reference](references/example.md).\n' }`
	);
	if ( referenceContent !== undefined ) {
		await writeFile(
			path.join( fixture, 'skills', 'example-skill', 'references', 'example.md' ),
			referenceContent
		);
	}
	await writeFile( path.join( fixture, 'AGENTS.md' ), '# Core\n' );
	await writeFile(
		path.join( fixture, 'docs', 'standards-index.md' ),
		`| Source | Affected guidance | Last reviewed |\n| --- | --- | --- |\n| [Example](https://example.com) | Example | ${ today } |\n`
	);
	await writeFile( path.join( fixture, 'agents', 'example-agent.md' ), agentContent );
	return { fixture, today };
}

function legacyManagedContent( format, label ) {
	if ( format === 'cursor-rule' ) {
		return `---\ndescription: 'Legacy ${ label }'\nalwaysApply: true\n---\n${ legacyFixture.managedMarker }\n# Legacy ${ label }\n`;
	}
	return `${ legacyFixture.managedMarker }\n# Legacy ${ label }\n`;
}

async function seedLegacyInstallation( home, copy ) {
	for ( const platform of manifest.platforms ) {
		await mkdir( destination( home, platform.detection.userPath ), { recursive: true } );
		const legacyPlatform = legacyFixture.platforms[ platform.id ];
		const legacyInstructions = legacyPlatform.instructions;
		if ( legacyInstructions?.kind === 'single' ) {
			const target = destination( home, legacyInstructions.userPath );
			await mkdir( path.dirname( target ), { recursive: true } );
			await writeFile( target, legacyManagedContent( 'markdown', `${ platform.id } instructions` ) );
		} else if ( legacyInstructions ) {
			for ( const name of legacyFixture.instructions ) {
				const target = path.join(
					destination( home, legacyInstructions.userPath ),
					`${ path.basename( name, '.md' ) }${ legacyInstructions.extension }`
				);
				await mkdir( path.dirname( target ), { recursive: true } );
				if (
					copy ||
					legacyInstructions.format === 'cursor-rule' ||
					name === 'workflow-routing.md'
				) {
					await writeFile( target, legacyManagedContent( legacyInstructions.format, name ) );
				} else {
					await symlink( path.join( repoDir, 'instructions', name ), target );
				}
			}
		}

		if ( legacyPlatform.skillsPath ) {
			for ( const name of legacyFixture.skills ) {
				const target = path.join(
					destination( home, legacyPlatform.skillsPath ),
					name,
					'SKILL.md'
				);
				await mkdir( path.dirname( target ), { recursive: true } );
				await writeFile( target, legacyManagedContent( 'markdown', `${ name } skill` ) );
			}
		}

		if ( legacyPlatform.personasPath ) {
			for ( const name of legacyFixture.personas ) {
				const target = path.join( destination( home, legacyPlatform.personasPath ), name );
				await mkdir( path.dirname( target ), { recursive: true } );
				await writeFile( target, legacyManagedContent( 'markdown', `${ name } persona` ) );
			}
		}
	}
}

test( 'manifest declares complete, current platform contracts', () => {
	assert.equal( manifest.schemaVersion, 2 );
	assert.deepEqual(
		manifest.platforms.map( ( platform ) => platform.id ),
		[ 'cursor', 'claude', 'codex', 'copilot', 'gemini' ]
	);

	for ( const platform of manifest.platforms ) {
		assert.match( platform.surface, /\S/ );
		assert.match( platform.lastAdapterChecked, /^\d{4}-\d{2}-\d{2}$/ );
		assert.ok( [ 'verified', 'preview' ].includes( platform.supportTier ) );
		for ( const category of categories ) {
			assert.equal( typeof platform.capabilities[ category ].supported, 'boolean' );
		}
	}
} );

test( 'legacy upgrade fixture is frozen at the pre-modernization revision', () => {
	assert.equal( legacyFixture.sourceRevision, '66fcb79ade8c32bfd9a2f8848438ccb9a716f4e1' );
	assert.equal( legacyFixture.instructions.length, 14 );
	assert.equal( legacyFixture.skills.length, 10 );
	assert.equal( legacyFixture.personas.length, 3 );
} );

test( 'manifest rejects unsafe legacy migration paths', () => {
	const invalidManifest = structuredClone( manifest );
	invalidManifest.platforms[ 0 ].legacyDestinations[ 0 ].sourceRoot = '../outside-repository';
	assert.throws(
		() => validateManifest( invalidManifest ),
		/legacyDestinations\[0\]\.sourceRoot must stay within the repository/
	);
} );

test( 'manifest rejects Windows-style path traversal', () => {
	const invalidManifest = structuredClone( manifest );
	invalidManifest.platforms[ 0 ].legacyDestinations[ 0 ].sourceRoot = '..\\outside-repository';
	assert.throws(
		() => validateManifest( invalidManifest ),
		/legacyDestinations\[0\]\.sourceRoot must stay within/
	);
} );

test( 'manifest rejects platform-dependent path separators', () => {
	const invalidManifest = structuredClone( manifest );
	invalidManifest.platforms[ 0 ].capabilities.instructions.userPath = '.cursor\\rules';
	assert.throws(
		() => validateManifest( invalidManifest ),
		/cursor\.instructions\.userPath must use forward-slash separators/
	);
} );

test( 'manifest rejects wrapper paths that collide with their canonical file', () => {
	const invalidManifest = structuredClone( manifest );
	const instructions = invalidManifest.platforms.find( ( platform ) => platform.id === 'claude' )
		.capabilities.instructions;
	instructions.canonicalPath = instructions.userPath;

	assert.throws(
		() => validateManifest( invalidManifest ),
		/wrapper and canonical paths must not be the same/
	);
} );

test( 'manifest rejects strategies without a matching artifact builder', () => {
	const invalidStrategies = [
		[ 'skills', 'direct' ],
		[ 'instructions', 'directories' ],
		[ 'agents', 'direct' ],
	];

	for ( const [ category, strategy ] of invalidStrategies ) {
		const invalidManifest = structuredClone( manifest );
		const capability = invalidManifest.platforms[ 0 ].capabilities[ category ];
		if ( category === 'agents' ) {
			Object.assign( capability, {
				supported: true,
				format: 'markdown',
				userPath: '.cursor/agents',
				projectPath: '.cursor/agents',
				precedence: 'Project agents take precedence.',
			} );
		}
		capability.strategy = strategy;

		assert.throws(
			() => validateManifest( invalidManifest ),
			new RegExp( `cursor\\.${ category }\\.strategy.*${ strategy }` )
		);
	}
} );

test( 'manifest rejects path syntax in generated file names', () => {
	const invalidExtension = structuredClone( manifest );
	invalidExtension.platforms[ 0 ].capabilities.instructions.extension = '/../../outside.md';
	assert.throws(
		() => validateManifest( invalidExtension ),
		/cursor\.instructions\.extension must be a portable file name/
	);

	const invalidLegacyFileName = structuredClone( manifest );
	invalidLegacyFileName.platforms[ 0 ].legacyDestinations[ 0 ].fileName = '../../outside.md';
	assert.throws(
		() => validateManifest( invalidLegacyFileName ),
		/cursor\.legacyDestinations\[0\]\.fileName must be a portable file name/
	);

	assert.throws(
		() => resolveUserChildPath( '/tmp/example-home', '.cursor/rules', '/tmp/outside.md' ),
		/destination escapes HOME/
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

test( 'manifest rejects invalid review and adapter-check dates', () => {
	const invalidReviewDate = structuredClone( manifest );
	invalidReviewDate.lastReviewed = '2026-02-29';
	assert.throws(
		() => validateManifest( invalidReviewDate ),
		/lastReviewed must use YYYY-MM-DD/
	);

	const invalidAdapterCheckDate = structuredClone( manifest );
	invalidAdapterCheckDate.platforms[ 0 ].lastAdapterChecked = 'July 21, 2026';
	assert.throws(
		() => validateManifest( invalidAdapterCheckDate ),
		/cursor\.lastAdapterChecked must use YYYY-MM-DD/
	);
} );

test( 'file mutations fail closed when ownership changes after inspection', async ( t ) => {
	const directory = await mkdtemp( path.join( os.tmpdir(), 'ai-instructions-ownership-' ) );
	t.after( () => rm( directory, { recursive: true, force: true } ) );
	const target = path.join( directory, 'managed.md' );

	await writeFile( target, `${ managedMarker }\nmanaged\n` );
	await writeFile( target, '# user-owned replacement\n' );
	await assert.rejects(
		writeOwnedFileSafely( target, `${ managedMarker }\nupdated\n`, repoDir ),
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

test( 'failed ownership restoration preserves the captured user file', async ( t ) => {
	const directory = await mkdtemp( path.join( os.tmpdir(), 'ai-instructions-restore-race-' ) );
	t.after( () => rm( directory, { recursive: true, force: true } ) );
	const source = path.join( directory, 'source.md' );
	const target = path.join( directory, 'managed.md' );
	await writeFile( source, '# source\n' );
	await writeFile( target, '# user-owned replacement\n' );

	let captured;
	await assert.rejects(
		writeSymlinkSafely(
			source,
			target,
			'file',
			async ( candidate ) => {
				captured = candidate;
				await writeFile( target, '# competing file\n' );
				return false;
			}
		),
		( error ) => error.code === 'EEXIST' && error.backupPath === captured
	);
	assert.equal( await readFile( target, 'utf8' ), '# competing file\n' );
	assert.equal( await readFile( captured, 'utf8' ), '# user-owned replacement\n' );
} );

test( 'skill copies reject source control-file symlinks', async ( t ) => {
	const directory = await mkdtemp( path.join( os.tmpdir(), 'ai-instructions-skill-source-' ) );
	t.after( () => rm( directory, { recursive: true, force: true } ) );
	const source = path.join( directory, 'source' );
	const destination = path.join( directory, 'installed-skill' );
	const external = path.join( directory, 'external.md' );
	await mkdir( source );
	await writeFile( external, '# User file\n' );
	await symlink( '../external.md', path.join( source, 'SKILL.md' ) );

	await assert.rejects(
		writeSkillDirectorySafely( source, destination, '# Managed skill\n' ),
		/source SKILL\.md must be a regular file/
	);
	assert.equal( await readFile( external, 'utf8' ), '# User file\n' );
	assert.equal( await pathExists( destination ), false );
} );

test( 'skill copies reject a source ownership marker', async ( t ) => {
	const directory = await mkdtemp( path.join( os.tmpdir(), 'ai-instructions-skill-marker-' ) );
	t.after( () => rm( directory, { recursive: true, force: true } ) );
	const source = path.join( directory, 'source' );
	const destination = path.join( directory, 'installed-skill' );
	await mkdir( source );
	await writeFile( path.join( source, 'SKILL.md' ), '# Skill\n' );
	await writeFile( path.join( source, '.ai-instructions-managed' ), 'user content\n' );

	await assert.rejects(
		writeSkillDirectorySafely( source, destination, '# Managed skill\n' ),
		/\.ai-instructions-managed is reserved/
	);
	assert.equal( await pathExists( destination ), false );
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
		writeSkillDirectorySafely(
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

test( 'ownership-check errors restore captured paths', async ( t ) => {
	const directory = await mkdtemp( path.join( os.tmpdir(), 'ai-instructions-ownership-error-' ) );
	t.after( () => rm( directory, { recursive: true, force: true } ) );
	const source = path.join( directory, 'source' );
	const destination = path.join( directory, 'installed-skill' );
	const removable = path.join( directory, 'removable.md' );
	await mkdir( source );
	await mkdir( destination );
	await writeFile( path.join( source, 'SKILL.md' ), '# Updated skill\n' );
	await writeFile( path.join( destination, 'SKILL.md' ), '# Original skill\n' );
	await writeFile( removable, '# Original file\n' );

	await assert.rejects(
		writeSkillDirectorySafely(
			source,
			destination,
			'# Managed updated skill\n',
			async () => {
				throw new Error( 'ownership inspection failed' );
			}
		),
		/ownership inspection failed/
	);
	assert.equal( await readFile( path.join( destination, 'SKILL.md' ), 'utf8' ), '# Original skill\n' );

	await assert.rejects(
		removeOwnedPath( removable, repoDir, async () => {
			throw new Error( 'removal inspection failed' );
		} ),
		/removal inspection failed/
	);
	assert.equal( await readFile( removable, 'utf8' ), '# Original file\n' );
} );

test( 'content contracts enforce the universal instruction budget', async () => {
	const result = await validateContent( repoDir );
	assert.ok( result.universal.lines <= 150 );
	assert.ok( result.universal.bytes <= 8 * 1024 );
} );

test( 'content contracts reject invalid review dates', () => {
	assert.throws(
		() => assertRecentDate( '2026-02-29', 'standards index' ),
		/valid calendar date/
	);
	assert.throws(
		() => assertRecentDate( 'not-a-date', 'standards index' ),
		/valid calendar date/
	);
} );

test( 'content contracts reject unsupported agent keys with CRLF frontmatter', async ( t ) => {
	const { fixture } = await createContentFixture( t, {
		agentContent: '---\r\n  name: example-agent\r\n  description: Example agent.\r\n  tools: Read\r\n---\r\n',
	} );

	await assert.rejects(
		validateContent( fixture ),
		/shared agents support only name and description frontmatter/
	);
} );

test( 'content contracts allow a skill-only repository without an agents directory', async ( t ) => {
	const { fixture } = await createContentFixture( t );
	await rm( path.join( fixture, 'agents' ), { recursive: true } );

	const result = await validateContent( fixture );
	assert.equal( result.agentCount, 0 );
} );

test( 'content contracts validate links in bundled skill references', async ( t ) => {
	const { fixture } = await createContentFixture( t, {
		referenceContent: 'Read [the missing detail](missing.md).\n',
	} );

	await assert.rejects(
		validateContent( fixture ),
		/bundled reference does not exist: missing\.md/
	);
} );

test( 'content contracts ignore link-shaped examples in inline code', async ( t ) => {
	const { fixture } = await createContentFixture( t, {
		referenceContent: 'Use `([#123](URL))` as the changelog link format.\n',
	} );

	await assert.doesNotReject( validateContent( fixture ) );
} );

test( 'content contracts reject every invalid standards review date', async ( t ) => {
	const { fixture, today } = await createContentFixture( t );
	await writeFile(
		path.join( fixture, 'docs', 'standards-index.md' ),
		`| Source | Affected guidance | Last reviewed |\n| --- | --- | --- |\n| [Valid](https://example.com/valid) | Example | ${ today } |\n| [Invalid](https://example.com/invalid) | Example | not-a-date |\n`
	);

	await assert.rejects(
		validateContent( fixture ),
		/expected an ISO date with a valid calendar date/
	);
} );

test( 'copied skill artifacts preserve source line endings', async ( t ) => {
	const fixture = await mkdtemp( path.join( os.tmpdir(), 'ai-instructions-skill-lines-' ) );
	t.after( () => rm( fixture, { recursive: true, force: true } ) );
	const skillDirectory = path.join( fixture, 'skills', 'example-skill' );
	await mkdir( skillDirectory, { recursive: true } );
	const source = '---\r\nname: example-skill\r\ndescription: Example skill.\r\n---\r\n\r\n# Example\r\n';
	await writeFile( path.join( skillDirectory, 'SKILL.md' ), source );

	const [ artifact ] = await createArtifactBuilder( { repoDir: fixture } ).buildArtifacts(
		manifest.platforms[ 0 ],
		[ 'skills' ],
		fixture
	);
	assert.equal( artifact.expectedContent, source );
} );

test( 'artifact building fails when required instructions are missing', async ( t ) => {
	const { fixture } = await createContentFixture( t );
	await rm( path.join( fixture, 'AGENTS.md' ) );

	await assert.rejects(
		createArtifactBuilder( { repoDir: fixture } ).buildArtifacts(
			manifest.platforms[ 0 ],
			[ 'instructions' ],
			fixture
		),
		{ code: 'ENOENT' }
	);
} );

async function assertSkillInstallMode( platform, home, skillName, expectedMode ) {
	const skillDirectory = path.dirname( skillPath( platform, home, skillName ) );
	const stats = await lstat( skillDirectory );
	assert.equal(
		stats.isSymbolicLink(),
		expectedMode === 'symlink',
		`${ platform.id } ${ skillName } should use ${ expectedMode } mode`
	);
	assert.equal(
		await pathExists( path.join( skillDirectory, SKILL_DIRECTORY_MARKER ) ),
		expectedMode === 'copy',
		`${ platform.id } ${ skillName } should ${ expectedMode === 'copy' ? 'include' : 'not include' } the managed-copy marker`
	);
}

async function verifyLegacyUpgrade( t, copy ) {
	const home = await mkdtemp( path.join( os.tmpdir(), `ai-instructions-legacy-${ copy ? 'copy' : 'default' }-` ) );
	t.after( () => rm( home, { recursive: true, force: true } ) );
	await seedLegacyInstallation( home, copy );
	const userFile = destination( home, '.claude/rules/user-owned.md' );
	await writeFile( userFile, '# User-owned rule\n' );

	const modeArguments = copy ? [ '--copy' ] : [];
	const updateOutput = runInstaller( home, [ 'update', '--agent', '*', ...modeArguments, '--yes' ] );
	assert.match( updateOutput, /migrated legacy managed copy/ );
	runInstaller( home, [ 'check', '--agent', '*', ...modeArguments, '--yes' ] );

	assert.equal( await readFile( userFile, 'utf8' ), '# User-owned rule\n' );
	assert.equal(
		await pathExists( destination( home, '.cursor/skills-cursor/review-pr/SKILL.md' ) ),
		false
	);
	const currentSkillNames = ( await readdir( path.join( repoDir, 'skills' ), { withFileTypes: true } ) )
		.filter( ( entry ) => entry.isDirectory() )
		.map( ( entry ) => entry.name );
	const newSkillNames = currentSkillNames.filter( ( name ) => ! legacyFixture.skills.includes( name ) );
	for ( const platform of manifest.platforms ) {
		const legacySkillMode = copy || legacyFixture.platforms[ platform.id ].skillsPath
			? 'copy'
			: 'symlink';
		for ( const skillName of legacyFixture.skills ) {
			await assertSkillInstallMode( platform, home, skillName, legacySkillMode );
		}
		for ( const skillName of newSkillNames ) {
			await assertSkillInstallMode( platform, home, skillName, copy ? 'copy' : 'symlink' );
		}
	}
}

test( 'pre-modernization default installations upgrade in place', {
	skip: process.platform === 'win32',
}, async ( t ) => {
	await verifyLegacyUpgrade( t, false );
} );

test( 'pre-modernization copy installations upgrade in place', async ( t ) => {
	await verifyLegacyUpgrade( t, true );
} );

for ( const platform of manifest.platforms ) {
	test( `${ platform.id }: copy lifecycle and category isolation`, async ( t ) => {
		const home = await createDetectedHome( platform );
		t.after( () => rm( home, { recursive: true, force: true } ) );

		runInstaller( home, [ 'check', '--agent', platform.id, '--copy', '--yes' ], 1 );
		runInstaller( home, [ '--agent', platform.id, '--copy', '--yes' ] );
		runInstaller( home, [ 'check', '--agent', platform.id, '--copy', '--yes' ] );
		const listOutput = runInstaller( home, [ 'list', '--agent', platform.id, '--copy', '--yes' ] );
		assert.match( listOutput, /\[(?:ok|not distributed)\]/ );
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
					assert.match( output, /not distributed/i );
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
		const retiredAgents = platform.legacyDestinations.find( ( legacy ) => legacy.category === 'agents' );
		assert.ok( retiredAgents, `${ platform.id} must declare a retired agent destination` );
		const staleExtension = retiredAgentExtension( platform );
		const staleDir = destination( home, retiredAgents.userPath );
		const stalePath = path.join( staleDir, `removed-agent${ staleExtension }` );
		const userAgentPath = path.join( staleDir, `user-agent${ staleExtension }` );
		await mkdir( staleDir, { recursive: true } );
		await writeFile(
			stalePath,
			staleExtension === '.toml'
				? '# ai-instructions:managed\nname = "removed-agent"\n'
				: `---\nname: removed-agent\ndescription: stale\n---\n${ managedMarker }\n`
		);
		await writeFile( userAgentPath, '# User-authored agent\n' );
		const staleSkill = skillPath( platform, home, 'removed-skill', 'SKILL.md' );
		await mkdir( path.dirname( staleSkill ), { recursive: true } );
		await writeFile( staleSkill, '---\nname: removed-skill\ndescription: stale\n---\n' );
		await writeFile(
			path.join( path.dirname( staleSkill ), '.ai-instructions-managed' ),
			'ai-instructions:managed\n'
		);

		runInstaller( home, [ 'check', '--agent', platform.id, '--copy', '--yes' ], 1 );
		assert.equal( await readFile( userAgentPath, 'utf8' ), '# User-authored agent\n' );
		runInstaller( home, [ 'update', '--agent', platform.id, '--copy', '--yes' ] );
		assert.equal( await pathExists( stalePath ), false );
		assert.equal( await readFile( userAgentPath, 'utf8' ), '# User-authored agent\n' );
		assert.equal( await pathExists( path.dirname( staleSkill ) ), false );
	} );
}

test( 'retired custom-agent symlinks are cleaned without touching user artifacts', {
	skip: process.platform === 'win32',
}, async ( t ) => {
	for ( const platform of manifest.platforms ) {
		const legacyAgents = platform.legacyDestinations.find( ( legacy ) => legacy.category === 'agents' );
		assert.ok( legacyAgents, `${ platform.id} must declare a retired agent destination` );
		const home = await createDetectedHome( platform );
		t.after( () => rm( home, { recursive: true, force: true } ) );
		const legacyDir = destination( home, legacyAgents.userPath );
		const extension = retiredAgentExtension( platform );
		const retiredAgent = path.join( legacyDir, `retired-agent${ extension }` );
		const userAgent = path.join( legacyDir, `user-agent${ extension }` );
		const userSource = path.join( home, `user-agent-source${ extension }` );
		await mkdir( legacyDir, { recursive: true } );
		await writeFile( userSource, '# User-authored agent\n' );
		await symlink( path.join( repoDir, 'agents', `retired-agent${ extension }` ), retiredAgent );
		await symlink( userSource, userAgent );

		runInstaller( home, [ 'check', '--agent', platform.id, '--only', 'agents', '--yes' ], 1 );
		assert.equal( await pathExists( retiredAgent ), true );
		assert.equal( await readFile( userAgent, 'utf8' ), '# User-authored agent\n' );
		runInstaller( home, [ 'update', '--agent', platform.id, '--only', 'agents', '--yes' ] );
		assert.equal( await pathExists( retiredAgent ), false );
		assert.equal( await readFile( userAgent, 'utf8' ), '# User-authored agent\n' );

		await symlink( path.join( repoDir, 'agents', `retired-agent${ extension }` ), retiredAgent );
		runInstaller( home, [ 'remove', '--agent', platform.id, '--only', 'agents', '--yes' ] );
		assert.equal( await pathExists( retiredAgent ), false );
		assert.equal( await readFile( userAgent, 'utf8' ), '# User-authored agent\n' );
	}
} );

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
		await readFile( path.join( repoDir, 'AGENTS.md' ), 'utf8' )
	);
	assert.equal(
		await readFile( destination( home, '.cursor/rules/core.mdc' ), 'utf8' ),
		`---\ndescription: 'Core Instructions'\nalwaysApply: true\n---\n${ managedMarker }\n${ instructionSource }`
	);
	assert.equal( await readFile( destination( home, '.codex/AGENTS.md' ), 'utf8' ), `${ managedMarker }\n${ instructionSource }` );
	for ( const [ directory, wrapper ] of [
		[ '.claude', 'CLAUDE.md' ],
		[ '.copilot', 'copilot-instructions.md' ],
		[ '.gemini', 'GEMINI.md' ],
	] ) {
		assert.equal( await readFile( destination( home, `${ directory }/AGENTS.md` ), 'utf8' ), `${ managedMarker }\n${ instructionSource }` );
		assert.equal( await readFile( destination( home, `${ directory }/${ wrapper }` ), 'utf8' ), `${ managedMarker }\n@AGENTS.md\n` );
	}

	const skillSource = await readFile(
		path.join( repoDir, 'skills', 'review-pr', 'SKILL.md' ),
		'utf8'
	);
	for ( const platform of manifest.platforms ) {
		assert.equal(
			await readFile( artifactPath( platform, 'skills', home ), 'utf8' ),
			skillSource
		);
		assert.equal(
			await readFile( path.join( path.dirname( artifactPath( platform, 'skills', home ) ), '.ai-instructions-managed' ), 'utf8' ),
			'ai-instructions:managed\n'
		);
	}
	const accessibilityReference = await readFile(
		path.join( repoDir, 'skills', 'engineering-standards', 'references', 'accessibility.md' ),
		'utf8'
	);
	for ( const platform of manifest.platforms ) {
		assert.equal(
			await readFile(
				skillPath( platform, home, 'engineering-standards', 'references/accessibility.md' ),
				'utf8'
			),
			accessibilityReference
		);
	}

} );

test( 'all platforms distribute complete skills and no current custom agents', async ( t ) => {
	const home = await mkdtemp( path.join( os.tmpdir(), 'ai-instructions-skills-first-' ) );
	t.after( () => rm( home, { recursive: true, force: true } ) );
	for ( const platform of manifest.platforms ) {
		await mkdir( destination( home, platform.detection.userPath ), { recursive: true } );
	}

	const skillNames = await sourceSkillNames();
	assert.ok( skillNames.length > 0 );
	assert.equal( await pathExists( path.join( repoDir, 'agents' ) ), false );
	runInstaller( home, [ '--agent', '*', '--copy', '--yes' ] );

	for ( const platform of manifest.platforms ) {
		assert.equal( platform.capabilities.agents.supported, false );
		assert.equal( artifactPath( platform, 'agents', home ), null );
		assert.match(
			runInstaller( home, [ 'list', '--agent', platform.id, '--only', 'agents', '--yes' ] ),
			/not distributed/i
		);
		runInstaller( home, [ 'check', '--agent', platform.id, '--only', 'agents', '--yes' ] );

		const retiredAgents = platform.legacyDestinations.find( ( legacy ) => legacy.category === 'agents' );
		assert.ok( retiredAgents, `${ platform.id } must retain a retired-agent cleanup destination` );
		assert.equal( await pathExists( destination( home, retiredAgents.userPath ) ), false );

		for ( const skillName of skillNames ) {
			const source = path.join( repoDir, 'skills', skillName );
			const installed = path.dirname( skillPath( platform, home, skillName ) );
			const sourceFiles = await filesInDirectory( source );
			assert.deepEqual(
				await filesInDirectory( installed ),
				[ ...sourceFiles, SKILL_DIRECTORY_MARKER ].sort(),
				`${ platform.id } ${ skillName } must include every bundled skill resource`
			);
			for ( const relative of sourceFiles ) {
				const sourcePath = path.join( source, relative );
				const installedPath = path.join( installed, relative );
				const [ sourceStatus, installedStatus ] = await Promise.all( [
					lstat( sourcePath ),
					lstat( installedPath ),
				] );
				assert.equal(
					installedStatus.isSymbolicLink(),
					sourceStatus.isSymbolicLink(),
					`${ platform.id } ${ skillName } ${ relative } must preserve its path type`
				);
				if ( sourceStatus.isSymbolicLink() ) {
					assert.equal(
						await readlink( installedPath ),
						await readlink( sourcePath ),
						`${ platform.id } ${ skillName } ${ relative } must preserve its symlink target`
					);
				} else {
					assert.ok( sourceStatus.isFile() );
					assert.ok( installedStatus.isFile() );
					assert.deepEqual(
						await readFile( installedPath ),
						await readFile( sourcePath ),
						`${ platform.id } ${ skillName } ${ relative } must match the source`
					);
				}
			}
		}
	}
} );

test( 'instruction adapters derive native wrappers from the canonical AGENTS.md', async ( t ) => {
	const home = await mkdtemp( path.join( os.tmpdir(), 'ai-instructions-agents-artifacts-' ) );
	t.after( () => rm( home, { recursive: true, force: true } ) );
	for ( const platform of manifest.platforms ) {
		await mkdir( destination( home, platform.detection.userPath ), { recursive: true } );
	}

	runInstaller( home, [ '--agent', '*', '--copy', '--yes' ] );

	const source = normalizedWithTrailingNewline(
		await readFile( path.join( repoDir, 'AGENTS.md' ), 'utf8' )
	);
	const canonical = `${ managedMarker }\n${ source }`;
	assert.equal( await readFile( destination( home, '.codex/AGENTS.md' ), 'utf8' ), canonical );
	for ( const [ directory, wrapper ] of [
		[ '.claude', 'CLAUDE.md' ],
		[ '.copilot', 'copilot-instructions.md' ],
		[ '.gemini', 'GEMINI.md' ],
	] ) {
		assert.equal( await readFile( destination( home, `${ directory }/AGENTS.md` ), 'utf8' ), canonical );
		assert.equal(
			await readFile( destination( home, `${ directory }/${ wrapper }` ), 'utf8' ),
			`${ managedMarker }\n@AGENTS.md\n`
		);
	}
} );

test( 'wrapper adapters do not create a sidecar when the native file is user-owned', async ( t ) => {
	const platform = manifest.platforms.find( ( entry ) => entry.id === 'claude' );
	const home = await createDetectedHome( platform );
	t.after( () => rm( home, { recursive: true, force: true } ) );
	const wrapperPath = destination( home, '.claude/CLAUDE.md' );
	await writeFile( wrapperPath, '# User Claude instructions\n' );

	const output = runInstaller( home, [ '--agent', 'claude', '--only', 'instructions', '--yes' ] );
	assert.match( output, /CLAUDE\.md already exists/ );
	assert.equal( await pathExists( destination( home, '.claude/AGENTS.md' ) ), false );
	assert.equal( await readFile( wrapperPath, 'utf8' ), '# User Claude instructions\n' );
} );

test( 'wrapper adapters do not create a native file when the canonical sidecar is user-owned', async ( t ) => {
	const platform = manifest.platforms.find( ( entry ) => entry.id === 'claude' );
	const home = await createDetectedHome( platform );
	t.after( () => rm( home, { recursive: true, force: true } ) );
	const canonicalPath = destination( home, '.claude/AGENTS.md' );
	const wrapperPath = destination( home, '.claude/CLAUDE.md' );
	await writeFile( canonicalPath, '# User shared instructions\n' );

	const output = runInstaller( home, [ '--agent', 'claude', '--only', 'instructions', '--yes' ] );
	assert.match( output, /AGENTS\.md.*was not generated by this script/ );
	assert.equal( await pathExists( wrapperPath ), false );
	assert.equal( await readFile( canonicalPath, 'utf8' ), '# User shared instructions\n' );
} );

test( 'wrapper adapters leave both files untouched when install finds a stale managed wrapper', async ( t ) => {
	const platform = manifest.platforms.find( ( entry ) => entry.id === 'copilot' );
	const home = await createDetectedHome( platform );
	t.after( () => rm( home, { recursive: true, force: true } ) );
	const wrapperPath = destination( home, '.copilot/copilot-instructions.md' );
	const canonicalPath = destination( home, '.copilot/AGENTS.md' );
	const staleWrapper = `${ managedMarker }\n# Previous instructions\n`;
	await writeFile( wrapperPath, staleWrapper );

	const output = runInstaller( home, [ '--agent', 'copilot', '--only', 'instructions', '--yes' ] );
	assert.match( output, /copilot-instructions\.md is out of date; run update to refresh/ );
	assert.equal( await pathExists( canonicalPath ), false );
	assert.equal( await readFile( wrapperPath, 'utf8' ), staleWrapper );
} );

test( 'wrapper conflicts preserve legacy instructions during an update', async ( t ) => {
	const platform = manifest.platforms.find( ( entry ) => entry.id === 'claude' );
	const home = await createDetectedHome( platform );
	t.after( () => rm( home, { recursive: true, force: true } ) );
	const wrapperPath = destination( home, '.claude/CLAUDE.md' );
	const legacyPath = destination( home, '.claude/rules/core.md' );
	await mkdir( path.dirname( legacyPath ), { recursive: true } );
	await writeFile( wrapperPath, '# User Claude instructions\n' );
	await writeFile( legacyPath, `${ managedMarker }\n# Legacy core\n` );

	const output = runInstaller( home, [ 'update', '--agent', 'claude', '--only', 'instructions', '--yes' ] );
	assert.match( output, /CLAUDE\.md already exists/ );
	assert.equal( await readFile( legacyPath, 'utf8' ), `${ managedMarker }\n# Legacy core\n` );
	assert.equal( await pathExists( destination( home, '.claude/AGENTS.md' ) ), false );
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
	const dryRunProject = await mkdtemp( path.join( os.tmpdir(), 'ai-instructions-copilot-dry-run-' ) );
	const userOwnedProject = await mkdtemp( path.join( os.tmpdir(), 'ai-instructions-copilot-user-owned-' ) );
	t.after( () => rm( home, { recursive: true, force: true } ) );
	t.after( () => rm( project, { recursive: true, force: true } ) );
	t.after( () => rm( dryRunProject, { recursive: true, force: true } ) );
	t.after( () => rm( userOwnedProject, { recursive: true, force: true } ) );
	const target = path.join( project, '.github', 'copilot-instructions.md' );
	const canonicalTarget = path.join( project, 'AGENTS.md' );
	const dryRunTarget = path.join( dryRunProject, '.github', 'copilot-instructions.md' );
	const dryRunCanonicalTarget = path.join( dryRunProject, 'AGENTS.md' );
	const userOwnedTarget = path.join( userOwnedProject, '.github', 'copilot-instructions.md' );
	const userOwnedCanonicalTarget = path.join( userOwnedProject, 'AGENTS.md' );
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

	const dryRunOutput = runInstaller( home, [
		...arguments_.slice( 0, -1 ),
		dryRunProject,
		'--dry-run',
	] );
	assert.match( dryRunOutput, /\[dry-run\] write .*copilot-instructions\.md/ );
	assert.equal( await pathExists( dryRunTarget ), false );
	assert.equal( await pathExists( dryRunCanonicalTarget ), false );

	await writeFile( userOwnedCanonicalTarget, '# user-owned\n' );
	assert.match(
		runInstaller( home, [ ...arguments_.slice( 0, -1 ), userOwnedProject ] ),
		/AGENTS\.md already exists/
	);
	assert.equal( await pathExists( userOwnedTarget ), false );
	assert.equal( await readFile( userOwnedCanonicalTarget, 'utf8' ), '# user-owned\n' );

	runInstaller( home, arguments_ );
	assert.match( await readFile( target, 'utf8' ), /^<!-- Auto-generated by ai-instructions\/setup\.sh --copilot-concat -->/ );
	assert.equal( await readFile( target, 'utf8' ), '<!-- Auto-generated by ai-instructions/setup.sh --copilot-concat -->\n<!-- Do not edit manually. Re-run setup.sh to update. -->\n\n@../AGENTS.md\n' );
	assert.match( await readFile( canonicalTarget, 'utf8' ), /^<!-- ai-instructions:managed -->\n# Core Instructions/m );
	await rm( target );
	runInstaller( home, arguments_ );
	assert.equal( await readFile( target, 'utf8' ), '<!-- Auto-generated by ai-instructions/setup.sh --copilot-concat -->\n<!-- Do not edit manually. Re-run setup.sh to update. -->\n\n@../AGENTS.md\n' );
	await writeFile( target, '<!-- Auto-generated by ai-instructions/setup.sh --copilot-concat -->\nstale\n' );
	assert.match( runInstaller( home, arguments_ ), /repository export is outdated; run update/ );
	runInstaller( home, [ 'update', ...arguments_ ] );
	assert.doesNotMatch( await readFile( target, 'utf8' ), /\nstale\n/ );

	await writeFile( target, '# user-owned\n' );
	assert.match( runInstaller( home, [ 'update', ...arguments_ ] ), /was not generated.*skipping/ );
	assert.equal( await readFile( target, 'utf8' ), '# user-owned\n' );
} );

test( 'POSIX compatibility wrapper delegates to the Node CLI', {
	skip: process.platform === 'win32',
}, async ( t ) => {
	const wrapper = await readFile( path.join( repoDir, 'setup.sh' ), 'utf8' );
	assert.doesNotMatch( wrapper, /\b(?:cd|dirname)[ \t]+--(?:[ \t]|$)/m );

	const utilityDir = await mkdtemp( path.join( os.tmpdir(), 'ai-instructions-posix-' ) );
	t.after( () => rm( utilityDir, { recursive: true, force: true } ) );
	await writeFile(
		path.join( utilityDir, 'dirname' ),
		`#!/bin/sh
if [ "\${1-}" = "--" ]; then
	exit 64
fi
case \${1-} in
	*/*) directory=\${1%/*}; [ -n "$directory" ] || directory=/ ;;
	*) directory=. ;;
esac
printf '%s\\n' "$directory"
`,
		{ mode: 0o755 }
	);
	const result = spawnSync( '/bin/sh', [ path.join( repoDir, 'setup.sh' ), '--help' ], {
		cwd: repoDir,
		env: {
			...process.env,
			PATH: `${ utilityDir }${ path.delimiter }${ path.dirname( process.execPath ) }`,
		},
		encoding: 'utf8',
	} );
	assert.equal( result.status, 0, result.stderr );
	assert.match( result.stdout, /Usage: ai-instructions/ );
} );

test( 'POSIX compatibility wrapper resolves a bare command name through PATH', {
	skip: process.platform === 'win32',
}, async ( t ) => {
	const workingDirectory = await mkdtemp( path.join( os.tmpdir(), 'ai-instructions-path-' ) );
	t.after( () => rm( workingDirectory, { recursive: true, force: true } ) );
	const wrapper = await readFile( path.join( repoDir, 'setup.sh' ), 'utf8' );
	const result = spawnSync( '/bin/sh', [ '-c', wrapper, 'setup.sh', '--help' ], {
		cwd: workingDirectory,
		env: {
			...process.env,
			PATH: [ repoDir, path.dirname( process.execPath ), '/usr/bin', '/bin' ].join( path.delimiter ),
		},
		encoding: 'utf8',
	} );
	assert.equal( result.status, 0, result.stderr );
	assert.match( result.stdout, /Usage: ai-instructions/ );
} );

test( 'POSIX compatibility wrapper explains the missing Node requirement', {
	skip: process.platform === 'win32',
}, () => {
	const result = spawnSync( '/bin/sh', [ path.join( repoDir, 'setup.sh' ), '--help' ], {
		cwd: repoDir,
		env: { ...process.env, PATH: '' },
		encoding: 'utf8',
	} );
	assert.equal( result.status, 1 );
	assert.match(
		result.stderr,
		/ai-instructions requires Node\.js 22 or newer, but 'node' was not found on PATH\./
	);
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
	assert.match( result.stdout, /Usage: ai-instructions/ );
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
