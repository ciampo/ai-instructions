import {
	cp,
	link,
	lstat,
	mkdir,
	open,
	readdir,
	readFile,
	readlink,
	rename,
	rm,
	symlink,
	writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { MANAGED_MARKER, TOML_MANAGED_MARKER, COPILOT_EXPORT_MARKER } from './formats.mjs';

export const SKILL_DIRECTORY_MARKER = '.ai-instructions-managed';
const SKILL_DIRECTORY_MARKER_CONTENT = 'ai-instructions:managed\n';

export async function lstatSafe( target ) {
	try {
		return await lstat( target );
	} catch ( error ) {
		if ( error.code === 'ENOENT' ) {
			return null;
		}
		throw error;
	}
}

export async function readlinkSafe( target ) {
	try {
		return await readlink( target );
	} catch ( error ) {
		if ( error.code === 'EINVAL' || error.code === 'ENOENT' ) {
			return null;
		}
		throw error;
	}
}

function temporaryPath( destination ) {
	return path.join( path.dirname( destination ), `.${ path.basename( destination ) }.${ process.pid }.${ randomUUID() }.tmp` );
}

async function createTemporaryFile( destination, content ) {
	await mkdir( path.dirname( destination ), { recursive: true } );
	const temporary = temporaryPath( destination );
	const handle = await open( temporary, 'wx', 0o644 );
	try {
		await handle.writeFile( content, 'utf8' );
		await handle.sync();
	} finally {
		await handle.close();
	}
	return temporary;
}

async function publishFileNoClobber( temporary, destination ) {
	await link( temporary, destination );
	await rm( temporary, { force: true } );
}

async function capturePath( target ) {
	const captured = temporaryPath( `${ target }.captured` );
	try {
		await rename( target, captured );
		return captured;
	} catch ( error ) {
		if ( error.code === 'ENOENT' ) {
			return null;
		}
		throw error;
	}
}

async function restoreCapturedPath( captured, target ) {
	const stats = await lstat( captured );
	if ( stats.isFile() ) {
		await link( captured, target );
		await rm( captured, { force: true } );
		return;
	}
	if ( stats.isSymbolicLink() ) {
		const linkTarget = await readlink( captured );
		const targetStats = await lstatSafe( path.resolve( path.dirname( captured ), linkTarget ) );
		await symlink(
			linkTarget,
			target,
			process.platform === 'win32'
				? ( targetStats?.isDirectory() ? 'dir' : 'file' )
				: undefined
		);
		await rm( captured, { force: true } );
		return;
	}
	if ( await lstatSafe( target ) ) {
		throw new Error( `Cannot restore ${ target } because another path appeared. The original remains at ${ captured }.` );
	}
	await rename( captured, target );
}

function destinationExistsError( destination ) {
	const error = new Error( `Refusing to replace ${ destination } because another path exists.` );
	error.code = 'EEXIST';
	return error;
}

async function replaceTemporaryPath( temporary, destination, canReplace ) {
	const destinationStats = await lstatSafe( destination );
	if ( ! destinationStats ) {
		await rename( temporary, destination );
		return;
	}
	if ( ! canReplace ) {
		throw destinationExistsError( destination );
	}

	const backup = temporaryPath( `${ destination }.backup` );
	await rename( destination, backup );
	if ( ! await canReplace( backup ) ) {
		await restoreCapturedPath( backup, destination );
		throw new Error( `Refusing to replace ${ destination } because its ownership changed.` );
	}
	try {
		if ( await lstatSafe( destination ) ) {
			await rm( backup, { recursive: true, force: true } );
			throw destinationExistsError( destination );
		}
		await rename( temporary, destination );
	} catch ( error ) {
		if ( await lstatSafe( backup ) ) {
			if ( await lstatSafe( destination ) ) {
				await rm( backup, { recursive: true, force: true } );
			} else {
				await restoreCapturedPath( backup, destination );
			}
		}
		throw error;
	}
	await rm( backup, { recursive: true, force: true } );
}

export async function writeAtomic( destination, content ) {
	const temporary = await createTemporaryFile( destination, content );
	try {
		await rename( temporary, destination );
	} finally {
		await rm( temporary, { force: true } );
	}
}

export async function writeNewFileAtomic( destination, content ) {
	const temporary = await createTemporaryFile( destination, content );
	try {
		await publishFileNoClobber( temporary, destination );
	} finally {
		await rm( temporary, { force: true } );
	}
}

export async function writeOwnedFileAtomic( destination, content, repoDir ) {
	const temporary = await createTemporaryFile( destination, content );
	let captured;
	try {
		captured = await capturePath( destination );
		if ( captured && ! await isOwnedPath( captured, repoDir ) ) {
			await restoreCapturedPath( captured, destination );
			captured = null;
			throw new Error( `Refusing to overwrite ${ destination } because its ownership changed.` );
		}
		await publishFileNoClobber( temporary, destination );
		if ( captured ) {
			await rm( captured, { recursive: true, force: true } );
			captured = null;
		}
	} catch ( error ) {
		if ( captured ) {
			if ( await lstatSafe( destination ) ) {
				await rm( captured, { recursive: true, force: true } );
			} else {
				await restoreCapturedPath( captured, destination );
			}
		}
		throw error;
	} finally {
		await rm( temporary, { force: true } );
	}
}

export async function symlinkAtomic( source, destination, type = 'file', canReplace ) {
	await mkdir( path.dirname( destination ), { recursive: true } );
	let captured;
	try {
		if ( await lstatSafe( destination ) ) {
			if ( ! canReplace ) {
				throw destinationExistsError( destination );
			}
			captured = await capturePath( destination );
			if ( ! await canReplace( captured ) ) {
				await restoreCapturedPath( captured, destination );
				captured = null;
				throw new Error( `Refusing to replace ${ destination } because its ownership changed.` );
			}
		}
		await symlink( source, destination, process.platform === 'win32' ? type : undefined );
		if ( captured ) {
			await rm( captured, { recursive: true, force: true } );
			captured = null;
		}
	} catch ( error ) {
		if ( captured ) {
			if ( await lstatSafe( destination ) ) {
				await rm( captured, { recursive: true, force: true } );
			} else {
				await restoreCapturedPath( captured, destination );
			}
		}
		throw error;
	}
}

export async function writeSkillDirectoryAtomic( source, destination, entrypointContent, canReplace ) {
	await mkdir( path.dirname( destination ), { recursive: true } );
	const temporary = temporaryPath( destination );
	try {
		await cp( source, temporary, {
			recursive: true,
			preserveTimestamps: true,
			verbatimSymlinks: true,
		} );
		await writeFile( path.join( temporary, 'SKILL.md' ), entrypointContent, { mode: 0o644 } );
		await writeFile(
			path.join( temporary, SKILL_DIRECTORY_MARKER ),
			SKILL_DIRECTORY_MARKER_CONTENT,
			{ mode: 0o644 }
		);

		await replaceTemporaryPath( temporary, destination, canReplace );
	} finally {
		await rm( temporary, { recursive: true, force: true } );
	}
}

export async function managedFileType( target ) {
	const stats = await lstatSafe( target );
	if ( ! stats?.isFile() ) {
		return null;
	}
	const content = await readFile( target, 'utf8' );
	const firstLine = content.split( '\n', 1 )[ 0 ];
	const lastLine = content.trimEnd().split( '\n' ).at( -1 );
	if ( firstLine === TOML_MANAGED_MARKER ) {
		return 'toml';
	}
	if ( firstLine === COPILOT_EXPORT_MARKER ) {
		return 'copilot-export';
	}
	if ( firstLine === MANAGED_MARKER ) {
		return 'markdown';
	}
	if ( firstLine === '---' && lastLine === MANAGED_MARKER ) {
		return 'portable-markdown';
	}
	if ( firstLine === '---' ) {
		const closing = content.indexOf( '\n---\n' );
		if ( closing >= 0 && content.slice( closing + 5 ).startsWith( `${ MANAGED_MARKER }\n` ) ) {
			return 'cursor-rule';
		}
	}
	return null;
}

export async function isManagedSkillDirectory( target ) {
	const stats = await lstatSafe( target );
	if ( ! stats?.isDirectory() || stats.isSymbolicLink() ) {
		return false;
	}
	const marker = path.join( target, SKILL_DIRECTORY_MARKER );
	const markerStats = await lstatSafe( marker );
	return Boolean(
		markerStats?.isFile() &&
		! markerStats.isSymbolicLink() &&
		await readFile( marker, 'utf8' ) === SKILL_DIRECTORY_MARKER_CONTENT
	);
}

export async function pathsHaveEqualContents( left, right ) {
	const [ leftStats, rightStats ] = await Promise.all( [ lstatSafe( left ), lstatSafe( right ) ] );
	if ( ! leftStats || ! rightStats ) {
		return leftStats === rightStats;
	}
	if ( leftStats.isSymbolicLink() || rightStats.isSymbolicLink() ) {
		return leftStats.isSymbolicLink() &&
			rightStats.isSymbolicLink() &&
			await readlink( left ) === await readlink( right );
	}
	if ( leftStats.isFile() || rightStats.isFile() ) {
		return leftStats.isFile() &&
			rightStats.isFile() &&
			( await readFile( left ) ).equals( await readFile( right ) );
	}
	if ( ! leftStats.isDirectory() || ! rightStats.isDirectory() ) {
		return false;
	}
	const [ leftEntries, rightEntries ] = await Promise.all( [ readdir( left ), readdir( right ) ] );
	leftEntries.sort();
	rightEntries.sort();
	if ( leftEntries.length !== rightEntries.length || leftEntries.some( ( name, index ) => name !== rightEntries[ index ] ) ) {
		return false;
	}
	for ( const name of leftEntries ) {
		if ( ! await pathsHaveEqualContents( path.join( left, name ), path.join( right, name ) ) ) {
			return false;
		}
	}
	return true;
}

export function isInside( target, parent ) {
	const relative = path.relative( path.resolve( parent ), path.resolve( target ) );
	return relative === '' || ( ! relative.startsWith( '..' ) && ! path.isAbsolute( relative ) );
}

export async function isOwnedPath( target, repoDir ) {
	const stats = await lstatSafe( target );
	if ( ! stats ) {
		return false;
	}
	if ( stats.isSymbolicLink() ) {
		const link = await readlinkSafe( target );
		const resolved = path.resolve( path.dirname( target ), link );
		return isInside( resolved, repoDir );
	}
	return stats.isDirectory()
		? isManagedSkillDirectory( target )
		: Boolean( await managedFileType( target ) );
}

export async function removeOwnedPath( target, repoDir, canRemove ) {
	const captured = await capturePath( target );
	if ( ! captured ) {
		return false;
	}
	if ( ! await ( canRemove ? canRemove( captured ) : isOwnedPath( captured, repoDir ) ) ) {
		await restoreCapturedPath( captured, target );
		return false;
	}
	const stats = await lstat( captured );
	await rm( captured, { recursive: stats.isDirectory() && ! stats.isSymbolicLink(), force: true } );
	return true;
}
