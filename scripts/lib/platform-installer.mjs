import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createArtifactBuilder } from './artifact-builder.mjs';
import {
	isInside,
	isManagedSkillDirectory,
	isOwnedPath,
	lstatSafe,
	managedFileType,
	pathsHaveEqualContents,
	readlinkSafe,
	removeOwnedPath,
	SKILL_DIRECTORY_MARKER,
	writeNewFileAtomic,
	writeOwnedFileSafely,
	writeSkillDirectorySafely,
	writeSymlinkSafely,
} from './files.mjs';
import { resolveUserChildPath, resolveUserPath } from './manifest.mjs';

export function createPlatformInstaller( { repoDir, home, state } ) {
	const { buildArtifacts } = createArtifactBuilder( { repoDir } );
	const migratedSkillDestinations = new Set();

	function fail( message ) {
		throw new Error( message );
	}

	async function removeArtifactPath( target, canRemove ) {
		const removed = await removeOwnedPath( target, repoDir, canRemove );
		if ( ! removed && await lstatSafe( target ) ) {
			fail( `Refusing to remove ${ target } because its ownership changed.` );
		}
		return removed;
	}

	function logHeader( value ) {
		console.log( `\n==> ${ value }` );
	}

	function logUnsupported( platform, category, reason ) {
		const status = category === 'agents' ? 'not distributed' : 'unsupported';
		console.log( `  [${ status }] ${ platform.surface } ${ category}: ${ reason }` );
	}

	async function inspectArtifact( artifact ) {
		const stats = await lstatSafe( artifact.destination );
		if ( ! stats ) {
			return { exists: false, current: false, owned: false };
		}
		if ( stats.isSymbolicLink() ) {
			const link = await readlinkSafe( artifact.destination );
			const resolvedLink = path.resolve( path.dirname( artifact.destination ), link );
			const targetExists = Boolean( await lstatSafe( resolvedLink ) );
			return {
				exists: true,
				current: ! artifact.generated && Boolean( artifact.source ) && resolvedLink === path.resolve( artifact.source ) && targetExists,
				owned: isInside( resolvedLink, repoDir ),
				kind: 'symlink',
				broken: ! targetExists,
				link,
			};
		}
		if ( stats.isFile() ) {
			const content = await readFile( artifact.destination, 'utf8' );
			const managedType = await managedFileType( artifact.destination );
			return {
				exists: true,
				current: content === artifact.expectedContent,
				owned: Boolean( managedType ),
				kind: 'file',
				managedType,
			};
		}
		return { exists: true, current: false, owned: false, kind: 'other' };
	}

	async function skillDirectoryIsCurrent( artifact ) {
		if ( ! await isManagedSkillDirectory( artifact.destination ) ) {
			return false;
		}
		const [ sourceEntries, destinationEntries ] = await Promise.all( [
			readdir( artifact.source ),
			readdir( artifact.destination ),
		] );
		if ( sourceEntries.includes( SKILL_DIRECTORY_MARKER ) ) {
			fail( `${ artifact.source }: ${ SKILL_DIRECTORY_MARKER } is reserved for installed skill copies.` );
		}
		const expectedEntries = [ ...sourceEntries, SKILL_DIRECTORY_MARKER ].sort();
		destinationEntries.sort();
		if (
			expectedEntries.length !== destinationEntries.length ||
			expectedEntries.some( ( name, index ) => name !== destinationEntries[ index ] )
		) {
			return false;
		}
		if ( await readFile( path.join( artifact.destination, 'SKILL.md' ), 'utf8' ) !== artifact.expectedContent ) {
			return false;
		}
		for ( const name of sourceEntries ) {
			if ( name === 'SKILL.md' ) {
				continue;
			}
			if ( ! await pathsHaveEqualContents(
				path.join( artifact.source, name ),
				path.join( artifact.destination, name )
			) ) {
				return false;
			}
		}
		return true;
	}

	async function inspectSkillArtifact( artifact ) {
		const stats = await lstatSafe( artifact.destination );
		if ( ! stats ) {
			return { exists: false, current: false, owned: false };
		}
		if ( stats.isSymbolicLink() ) {
			const link = await readlinkSafe( artifact.destination );
			const resolvedLink = path.resolve( path.dirname( artifact.destination ), link );
			const targetExists = Boolean( await lstatSafe( resolvedLink ) );
			return {
				exists: true,
				current: resolvedLink === path.resolve( artifact.source ) && targetExists,
				owned: isInside( resolvedLink, path.join( repoDir, 'skills' ) ),
				kind: 'symlink',
				broken: ! targetExists,
			};
		}
		if ( ! stats.isDirectory() ) {
			return { exists: true, current: false, owned: false, kind: 'other' };
		}

		const isManagedCopy = await isManagedSkillDirectory( artifact.destination );
		const entrypoint = path.join( artifact.destination, 'SKILL.md' );
		const entrypointStats = await lstatSafe( entrypoint );
		let legacyCopy = false;
		let legacyLink = false;
		if ( ! isManagedCopy && entrypointStats?.isSymbolicLink() ) {
			const link = await readlinkSafe( entrypoint );
			const resolvedLink = path.resolve( artifact.destination, link );
			legacyLink = isInside( resolvedLink, path.join( repoDir, 'skills' ) );
		} else if ( ! isManagedCopy ) {
			legacyCopy = Boolean( await managedFileType( entrypoint ) );
		}
		const legacyOwned = legacyCopy || legacyLink;
		const unknownEntries = legacyOwned && ! isManagedCopy
			? ( await readdir( artifact.destination ) ).filter(
				( name ) => ! [ 'SKILL.md', '.DS_Store', 'Thumbs.db' ].includes( name )
			)
			: [];
		return {
			exists: true,
			current: isManagedCopy && await skillDirectoryIsCurrent( artifact ),
			owned: isManagedCopy,
			kind: 'directory',
			legacyCopy,
			legacyLink,
			legacyOwned,
			legacySafe: legacyOwned && unknownEntries.length === 0,
			unknownEntries,
		};
	}

	async function legacySkillDirectoryCanReplace( target, sourceRoot = path.join( repoDir, 'skills' ) ) {
		const stats = await lstatSafe( target );
		if ( ! stats?.isDirectory() || stats.isSymbolicLink() ) {
			return false;
		}
		const entrypoint = path.join( target, 'SKILL.md' );
		const entrypointStats = await lstatSafe( entrypoint );
		let entrypointOwned = Boolean( await managedFileType( entrypoint ) );
		if ( entrypointStats?.isSymbolicLink() ) {
			const link = await readlinkSafe( entrypoint );
			entrypointOwned = isInside(
				path.resolve( target, link ),
				sourceRoot
			);
		}
		if ( ! entrypointOwned ) {
			return false;
		}
		const unknownEntries = ( await readdir( target ) ).filter(
			( name ) => ! [ 'SKILL.md', '.DS_Store', 'Thumbs.db' ].includes( name )
		);
		return unknownEntries.length === 0;
	}

	async function skillPathCanReplace( target ) {
		return await isOwnedPath( target, repoDir ) || legacySkillDirectoryCanReplace( target );
	}

	async function installSkillArtifact( artifact, state, status, copy = state.options.copy ) {
		if ( state.options.dryRun ) {
			console.log( `  [dry-run] ${ copy ? 'copy' : 'link' } ${ artifact.source } -> ${ artifact.destination }` );
			return;
		}
		const canReplace = status.exists ? skillPathCanReplace : undefined;
		if ( copy ) {
			await writeSkillDirectorySafely(
				artifact.source,
				artifact.destination,
				artifact.expectedContent,
				canReplace
			);
			return;
		}
		try {
			await writeSymlinkSafely( artifact.source, artifact.destination, 'dir', canReplace );
		} catch ( error ) {
			if ( process.platform === 'win32' && [ 'EPERM', 'EACCES' ].includes( error.code ) ) {
				fail( `Cannot create ${ artifact.destination } as a symlink. Re-run with --copy on Windows.` );
			}
			throw error;
		}
	}

	function logSkillConflict( artifact, state, message ) {
		console.warn(
			`  [warning] ${ message ?? `${ path.basename( artifact.destination ) }/ already exists at ${ artifact.destination } but was not installed by this script -- skipping` }`
		);
		state.skipped++;
	}

	async function processSkillArtifact( artifact, state ) {
		if ( migratedSkillDestinations.delete( artifact.destination ) ) {
			return;
		}
		const status = await inspectSkillArtifact( artifact );
		const { command } = state.options;

		if ( ! status.exists ) {
			if ( [ 'install', 'update' ].includes( command ) ) {
				await installSkillArtifact( artifact, state, status );
				console.log( `  [+] ${ artifact.label }` );
				state.new++;
			} else if ( command === 'check' ) {
				console.warn( `  [BROKEN] ${ artifact.label } (missing)` );
				state.checkFailures++;
				state.broken++;
			} else if ( command === 'list' ) {
				console.warn( `  [missing] ${ artifact.label }` );
			}
			return;
		}

		if ( status.current ) {
			if ( [ 'install', 'update' ].includes( command ) ) {
				console.log( `  [=] ${ artifact.label }` );
				state.upToDate++;
			} else if ( command === 'check' ) {
				console.log( `  [ok] ${ artifact.label }` );
				state.upToDate++;
			} else if ( command === 'list' ) {
				console.log( `  [ok] ${ artifact.label }` );
			} else if ( command === 'remove' ) {
				if ( ! state.options.dryRun ) {
					await removeArtifactPath( artifact.destination );
				}
				console.log( `  [-] ${ artifact.label }` );
				state.removed++;
			}
			return;
		}

		if ( command === 'install' ) {
			if ( status.legacyOwned && status.unknownEntries.length > 0 ) {
				logSkillConflict( artifact, state, `${ artifact.label } contains files not installed by this script; preserving the legacy directory` );
			} else if ( status.legacyCopy ) {
				logSkillConflict( artifact, state, `${ artifact.label } is a legacy managed copy; run update --copy to migrate it without changing install mode` );
			} else {
				logSkillConflict( artifact, state );
			}
			return;
		}

		if ( command === 'update' ) {
			if ( status.legacyOwned && status.unknownEntries.length > 0 ) {
				logSkillConflict( artifact, state, `${ artifact.label } contains files not installed by this script; preserving the legacy directory` );
				return;
			}
			if ( status.legacyCopy && ! state.options.copy ) {
				await installSkillArtifact( artifact, state, status, true );
				console.log( `  [+] ${ artifact.label } (migrated legacy managed copy)` );
				state.new++;
				return;
			}
			if ( status.kind === 'directory' && status.owned && ! state.options.copy ) {
				logSkillConflict( artifact, state, `${ artifact.label } is a managed copy; run update --copy to refresh it` );
				return;
			}
			if ( status.owned || status.legacySafe || ( status.kind === 'symlink' && status.owned ) ) {
				await installSkillArtifact( artifact, state, status );
				console.log( `  [+] ${ artifact.label } (updated)` );
				state.new++;
			} else {
				logSkillConflict( artifact, state );
			}
			return;
		}

		if ( command === 'check' ) {
			console.warn( `  [BROKEN] ${ artifact.label } (${ status.broken ? 'target missing' : 'out of date or conflicting' })` );
			state.checkFailures++;
			state.broken++;
			return;
		}

		if ( command === 'list' ) {
			if ( status.owned || status.legacyOwned || ( status.kind === 'symlink' && status.owned ) ) {
				console.warn( `  [stale] ${ artifact.label }` );
			}
			return;
		}

		if ( status.owned || ( status.kind === 'symlink' && status.owned ) ) {
			if ( ! state.options.dryRun ) {
				await removeArtifactPath( artifact.destination );
			}
			console.log( `  [-] ${ artifact.label }` );
			state.removed++;
		} else if ( status.legacySafe ) {
			if ( ! state.options.dryRun ) {
				await removeArtifactPath( artifact.destination, skillPathCanReplace );
			}
			console.log( `  [-] ${ artifact.label }` );
			state.removed++;
		} else if ( status.legacyOwned ) {
			if ( ! state.options.dryRun ) {
				await removeArtifactPath( path.join( artifact.destination, 'SKILL.md' ) );
			}
			console.log( `  [-] ${ path.join( artifact.destination, 'SKILL.md' ) } (legacy managed entrypoint)` );
			console.warn( `  [warning] ${ artifact.label } contains files not installed by this script; preserving them` );
			state.removed++;
		} else {
			logSkillConflict( artifact, state );
		}
	}

	async function installArtifact( artifact, state, status ) {
		if ( state.options.dryRun ) {
			console.log( `  [dry-run] ${ artifact.generated || state.options.copy ? 'write' : 'link' } ${ artifact.destination }` );
			return;
		}
		if ( artifact.generated || state.options.copy ) {
			if ( status.exists ) {
				await writeOwnedFileSafely( artifact.destination, artifact.expectedContent, repoDir );
			} else {
				await writeNewFileAtomic( artifact.destination, artifact.expectedContent );
			}
			return;
		}
		try {
			await writeSymlinkSafely(
				artifact.source,
				artifact.destination,
				'file',
				status.exists ? ( target ) => isOwnedPath( target, repoDir ) : undefined
			);
		} catch ( error ) {
			if ( process.platform === 'win32' && [ 'EPERM', 'EACCES' ].includes( error.code ) ) {
				fail( `Cannot create ${ artifact.destination } as a symlink. Re-run with --copy on Windows.` );
			}
			throw error;
		}
	}

	function logConflict( artifact, state ) {
		if ( artifact.format === 'agents-md' ) {
			console.warn( `  [warning] AGENTS.md at ${ artifact.destination } was not generated by this script -- skipping` );
		} else {
			console.warn( `  [warning] ${ path.basename( artifact.destination ) } already exists at ${ artifact.destination } -- skipping` );
		}
		state.skipped++;
	}

	async function processArtifact( artifact, state ) {
		if ( artifact.kind === 'skill-directory' ) {
			await processSkillArtifact( artifact, state );
			return;
		}
		const status = await inspectArtifact( artifact );
		const { command } = state.options;

		if ( ! status.exists ) {
			if ( [ 'install', 'update' ].includes( command ) ) {
				await installArtifact( artifact, state, status );
				console.log( `  [+] ${ artifact.label }` );
				state.new++;
			} else if ( command === 'check' ) {
				console.warn( `  [BROKEN] ${ artifact.label } (missing)` );
				state.checkFailures++;
				state.broken++;
			} else if ( command === 'list' ) {
				console.warn( `  [missing] ${ artifact.label }` );
			}
			return;
		}

		if ( status.current ) {
			if ( [ 'install', 'update' ].includes( command ) ) {
				console.log( `  [=] ${ artifact.label }` );
				state.upToDate++;
			} else if ( command === 'check' ) {
				console.log( `  [ok] ${ artifact.label }` );
				state.upToDate++;
			} else if ( command === 'list' ) {
				console.log( `  [ok] ${ artifact.label }` );
			} else if ( command === 'remove' ) {
				if ( ! state.options.dryRun ) {
					await removeArtifactPath( artifact.destination );
				}
				console.log( `  [-] ${ artifact.label }` );
				state.removed++;
			}
			return;
		}

		if ( command === 'install' ) {
			if ( artifact.generated && status.kind === 'symlink' && status.owned ) {
				await installArtifact( artifact, state, status );
				console.log( `  [+] ${ artifact.label } (migrated)` );
				state.new++;
				return;
			}
			if ( artifact.format === 'cursor-rule' && status.managedType === 'markdown' ) {
				console.warn( `  [warning] ${ path.basename( artifact.destination ) } is a legacy managed copy without Cursor frontmatter; run update to regenerate` );
				state.skipped++;
				return;
			}
			if ( artifact.generated && status.owned ) {
				console.warn( `  [warning] ${ path.basename( artifact.destination ) } is out of date; run update to refresh` );
				state.skipped++;
				return;
			}
			logConflict( artifact, state );
			return;
		}

		if ( command === 'update' ) {
			if ( status.owned ) {
				await installArtifact( artifact, state, status );
				console.log( `  [+] ${ artifact.label } (updated)` );
				state.new++;
			} else {
				logConflict( artifact, state );
			}
			return;
		}

		if ( command === 'check' ) {
			if ( artifact.format === 'agents-md' && ! status.owned ) {
				console.warn( `  [BROKEN] AGENTS.md at ${ artifact.destination } was not generated by this script` );
				state.checkFailures++;
				state.broken++;
				return;
			}
			if ( artifact.format === 'cursor-rule' && status.managedType === 'markdown' ) {
				console.warn( `  [BROKEN] ${ path.basename( artifact.destination ) } is a legacy managed copy without Cursor frontmatter; run update to regenerate` );
				state.checkFailures++;
				state.broken++;
				return;
			}
			const detail = status.broken ? 'target missing' : status.owned ? 'out of date' : 'conflict';
			console.warn( `  [BROKEN] ${ artifact.label } (${ detail })` );
			state.checkFailures++;
			state.broken++;
			return;
		}

		if ( command === 'list' ) {
			console.warn( `  [${ status.owned ? 'stale' : 'conflict' }] ${ artifact.label }` );
			return;
		}

		if ( status.owned ) {
			if ( ! state.options.dryRun ) {
				await removeArtifactPath( artifact.destination );
			}
			console.log( `  [-] ${ artifact.label }` );
			state.removed++;
		} else {
			logConflict( artifact, state );
		}
	}

	function groupArtifacts( artifacts ) {
		const groups = new Map();
		for ( const artifact of artifacts ) {
			const key = artifact.group ?? `artifact:${ artifact.destination }`;
			const group = groups.get( key ) ?? [];
			group.push( artifact );
			groups.set( key, group );
		}
		return groups;
	}

	function installWouldSkipArtifact( artifact, status ) {
		return status.exists &&
			! status.current &&
			! ( artifact.generated && status.kind === 'symlink' && status.owned );
	}

	async function groupBlockers( artifacts, command ) {
		const statuses = await Promise.all( artifacts.map( inspectArtifact ) );
		return artifacts.flatMap( ( artifact, index ) => {
			const status = statuses[ index ];
			const blocksGroup = command === 'install'
				? installWouldSkipArtifact( artifact, status )
				: status.exists && ! status.owned;
			return blocksGroup ? [ { artifact, status } ] : [];
		} );
	}

	function logGroupBlocker( { artifact, status }, state ) {
		if ( state.options.command === 'install' && status.owned ) {
			console.warn( `  [warning] ${ path.basename( artifact.destination ) } is out of date; run update to refresh` );
			state.skipped++;
			return;
		}
		logConflict( artifact, state );
	}

	async function blockedGroupCategories( groups, state ) {
		const blocked = new Set();
		for ( const group of groups.values() ) {
			if ( group.length < 2 || ( await groupBlockers( group, state.options.command ) ).length === 0 ) {
				continue;
			}
			for ( const artifact of group ) {
				blocked.add( artifact.category );
			}
		}
		return blocked;
	}

	async function processArtifactGroup( artifacts, state ) {
		const { command } = state.options;
		if ( ! [ 'install', 'update', 'remove' ].includes( command ) ) {
			for ( const artifact of artifacts ) {
				await processArtifact( artifact, state );
			}
			return;
		}

		const blockers = await groupBlockers( artifacts, command );
		if ( blockers.length > 0 ) {
			for ( const blocker of blockers ) {
				logGroupBlocker( blocker, state );
			}
			return;
		}

		for ( const artifact of artifacts ) {
			await processArtifact( artifact, state );
		}
	}

	async function directoryEntries( directory ) {
		try {
			return await readdir( directory, { withFileTypes: true } );
		} catch ( error ) {
			if ( error.code === 'ENOENT' ) {
				return [];
			}
			throw error;
		}
	}

	async function staleCandidates( platform, selectedCategories, home ) {
		const candidates = [];
		for ( const category of selectedCategories ) {
			const capability = platform.capabilities[ category ];
			if (
				! capability.supported ||
				[ 'direct', 'wrapper' ].includes( capability.strategy )
			) {
				continue;
			}
			const root = resolveUserPath( home, capability.userPath );
			if ( capability.strategy === 'directories' ) {
				for ( const entry of await directoryEntries( root ) ) {
					if ( entry.isDirectory() || entry.isSymbolicLink() ) {
						candidates.push( path.join( root, entry.name ) );
					}
				}
			} else {
				for ( const entry of await directoryEntries( root ) ) {
					if ( entry.isFile() || entry.isSymbolicLink() ) {
						candidates.push( path.join( root, entry.name ) );
					}
				}
			}
		}
		return candidates;
	}

	async function isOwnedCandidate( candidate, sourceRoot = repoDir ) {
		const stats = await lstatSafe( candidate );
		if ( ! stats ) {
			return false;
		}
		if ( stats.isSymbolicLink() ) {
			const link = await readlinkSafe( candidate );
			return isInside( path.resolve( path.dirname( candidate ), link ), sourceRoot );
		}
		if ( stats.isDirectory() ) {
			if ( await isManagedSkillDirectory( candidate ) ) {
				return true;
			}
			const entrypoint = path.join( candidate, 'SKILL.md' );
			return isOwnedCandidate( entrypoint, sourceRoot );
		}
		return Boolean( await managedFileType( candidate ) );
	}

	async function removeStaleCandidate( candidate, sourceRoot ) {
		const stats = await lstatSafe( candidate );
		if ( ! stats?.isDirectory() || stats.isSymbolicLink() || await isManagedSkillDirectory( candidate ) ) {
			await removeArtifactPath(
				candidate,
				( target ) => isOwnedCandidate( target, sourceRoot )
			);
			return;
		}

		if ( await legacySkillDirectoryCanReplace( candidate, sourceRoot ) ) {
			await removeArtifactPath(
				candidate,
				( target ) => legacySkillDirectoryCanReplace( target, sourceRoot )
			);
			return;
		}

		const entrypoint = path.join( candidate, 'SKILL.md' );
		await removeArtifactPath(
			entrypoint,
			( target ) => isOwnedCandidate( target, sourceRoot )
		);
	}

	async function handleStalePath( candidate, state, detail = 'stale managed artifact', sourceRoot = repoDir ) {
		if ( ! await isOwnedCandidate( candidate, sourceRoot ) ) {
			return;
		}
		const isLegacyInstall = state.options.command === 'install' && detail !== 'stale managed artifact';
		if ( [ 'update', 'remove' ].includes( state.options.command ) || isLegacyInstall ) {
			if ( ! state.options.dryRun ) {
				await removeStaleCandidate( candidate, sourceRoot );
			}
			console.log( `  [stale] ${ candidate } (${ detail })` );
			state.stale++;
		} else if ( state.options.command === 'check' ) {
			console.warn( `  [BROKEN] ${ candidate } (${ detail })` );
			state.broken++;
			state.checkFailures++;
		} else if ( state.options.command === 'list' ) {
			console.warn( `  [stale] ${ candidate } (${ detail })` );
		}
	}

	async function processStaleArtifacts( platform, artifacts, selectedCategories, home, state ) {
		const expected = new Set( artifacts.map( ( artifact ) => path.resolve( artifact.destination ) ) );
		for ( const candidate of await staleCandidates( platform, selectedCategories, home ) ) {
			if ( ! expected.has( path.resolve( candidate ) ) ) {
				await handleStalePath( candidate, state );
			}
		}

		for ( const legacy of platform.legacyDestinations ?? [] ) {
			if ( legacy.category && ! selectedCategories.includes( legacy.category ) ) {
				continue;
			}
			const legacyDetail = platform.id === 'cursor' && legacy.category === 'skills'
				? 'legacy Cursor path'
				: legacy.reason;
			const root = resolveUserPath( home, legacy.userPath );
			if ( legacy.layout === 'nested' ) {
				for ( const entry of await directoryEntries( root ) ) {
					if ( entry.isDirectory() ) {
						const candidate = resolveUserChildPath(
							home,
							legacy.userPath,
							entry.name,
							legacy.fileName
						);
						if (
							legacy.category === 'skills' &&
							[ 'install', 'update' ].includes( state.options.command ) &&
							await managedFileType( candidate )
						) {
							const artifact = artifacts.find(
								( current ) => current.kind === 'skill-directory' && path.basename( current.destination ) === entry.name
							);
							if ( artifact ) {
								const destinationStatus = await inspectSkillArtifact( artifact );
								if ( ! destinationStatus.exists ) {
									await installSkillArtifact( artifact, state, destinationStatus, true );
									console.log( `  [+] ${ artifact.label } (migrated legacy managed copy)` );
									state.new++;
									migratedSkillDestinations.add( artifact.destination );
								} else if ( ! destinationStatus.current ) {
									console.warn( `  [warning] ${ artifact.label } cannot migrate from the legacy path because the destination already exists; preserving the legacy copy` );
									state.skipped++;
									continue;
								}
								if ( ! state.options.dryRun ) {
									await removeArtifactPath( candidate );
								}
								console.log( `  [stale] ${ candidate } (${ legacyDetail })` );
								state.stale++;
								continue;
							}
						}
						await handleStalePath(
							candidate,
							state,
							legacyDetail,
							path.join( repoDir, legacy.sourceRoot )
						);
					}
				}
			} else {
				for ( const entry of await directoryEntries( root ) ) {
					if ( entry.isFile() || entry.isSymbolicLink() ) {
						await handleStalePath(
							path.join( root, entry.name ),
							state,
							legacyDetail,
							path.join( repoDir, legacy.sourceRoot )
						);
					}
				}
			}
		}
	}

	async function blockingCategory( platform, selectedCategories, home, state ) {
		const blocked = new Set();
		for ( const category of selectedCategories ) {
			const capability = platform.capabilities[ category ];
			if ( ! capability.supported || ! capability.blockingPath ) {
				continue;
			}
			const blocker = resolveUserPath( home, capability.blockingPath );
			if ( ! await lstatSafe( blocker ) || state.options.command === 'remove' ) {
				continue;
			}
			const destination = resolveUserPath( home, capability.userPath );
			if ( state.options.command === 'update' && await isOwnedPath( destination, repoDir ) ) {
				if ( ! state.options.dryRun ) {
					await removeArtifactPath( destination );
				}
				state.stale++;
			}
			if ( state.options.command === 'check' && await isOwnedPath( destination, repoDir ) ) {
				state.checkFailures++;
				state.broken++;
			}
			console.log( `  [unsupported] ${ path.basename( blocker ) } takes precedence over ${ path.basename( destination ) }; managed ${ category } skipped` );
			blocked.add( category );
		}
		return blocked;
	}

	async function processPlatform( platform, selectedCategories ) {
		logHeader( `${ platform.product } (${ platform.surface })` );
		for ( const category of selectedCategories ) {
			const capability = platform.capabilities[ category ];
			if ( ! capability.supported ) {
				logUnsupported( platform, category, capability.reason );
			}
		}
		const blocked = await blockingCategory( platform, selectedCategories, home, state );
		const activeCategories = selectedCategories.filter( ( category ) => ! blocked.has( category ) );
		const artifacts = await buildArtifacts( platform, activeCategories, home );
		const groups = groupArtifacts( artifacts );
		if ( [ 'install', 'update' ].includes( state.options.command ) ) {
			const cleanupBlockedCategories = await blockedGroupCategories( groups, state );
			const cleanupCategories = activeCategories.filter(
				( category ) => ! cleanupBlockedCategories.has( category )
			);
			await processStaleArtifacts( platform, artifacts, cleanupCategories, home, state );
		}
		for ( const group of groups.values() ) {
			if ( group.length === 1 ) {
				await processArtifact( group[ 0 ], state );
			} else {
				await processArtifactGroup( group, state );
			}
		}
		if ( [ 'check', 'list', 'remove' ].includes( state.options.command ) ) {
			await processStaleArtifacts( platform, artifacts, activeCategories, home, state );
		}
	}

	return { processPlatform };
}
