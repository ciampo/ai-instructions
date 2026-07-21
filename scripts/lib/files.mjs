import {
	lstat,
	mkdir,
	open,
	readFile,
	readlink,
	rename,
	rm,
	rmdir,
	symlink,
} from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { MANAGED_MARKER, TOML_MANAGED_MARKER, COPILOT_EXPORT_MARKER } from './formats.mjs';

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

export async function writeAtomic( destination, content ) {
	await mkdir( path.dirname( destination ), { recursive: true } );
	const temporary = temporaryPath( destination );
	try {
		const handle = await open( temporary, 'wx', 0o644 );
		try {
			await handle.writeFile( content, 'utf8' );
			await handle.sync();
		} finally {
			await handle.close();
		}
		await rename( temporary, destination );
	} finally {
		await rm( temporary, { force: true } );
	}
}

export async function symlinkAtomic( source, destination ) {
	await mkdir( path.dirname( destination ), { recursive: true } );
	const temporary = temporaryPath( destination );
	try {
		await symlink( source, temporary, process.platform === 'win32' ? 'file' : undefined );
		await rename( temporary, destination );
	} finally {
		await rm( temporary, { force: true } );
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
	return Boolean( await managedFileType( target ) );
}

export async function removeOwnedPath( target, repoDir ) {
	if ( ! await isOwnedPath( target, repoDir ) ) {
		return false;
	}
	await rm( target, { force: true } );
	try {
		await rmdir( path.dirname( target ) );
	} catch ( error ) {
		if ( ! [ 'ENOTEMPTY', 'ENOENT', 'EEXIST' ].includes( error.code ) ) {
			throw error;
		}
	}
	return true;
}
