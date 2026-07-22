import { readFile } from 'node:fs/promises';
import path from 'node:path';

const PLATFORM_IDS = [ 'cursor', 'claude', 'codex', 'copilot', 'gemini' ];
const CATEGORIES = [ 'instructions', 'skills', 'agents' ];
const STRATEGIES_BY_CATEGORY = {
	instructions: new Set( [ 'direct', 'files', 'wrapper' ] ),
	skills: new Set( [ 'directories' ] ),
	agents: new Set( [ 'files' ] ),
};
const SUPPORT_TIERS = new Set( [ 'verified', 'preview' ] );

function assertString( value, field ) {
	if ( typeof value !== 'string' || value.trim() === '' ) {
		throw new Error( `Platform manifest: ${ field } must be a non-empty string.` );
	}
}

function validateRelativePath( value, field, boundary = 'selected home directory' ) {
	assertString( value, field );
	const segments = value.split( /[\\/]/ );
	if (
		path.posix.isAbsolute( value ) ||
		path.win32.isAbsolute( value ) ||
		segments.includes( '..' )
	) {
		throw new Error( `Platform manifest: ${ field } must stay within the ${ boundary }.` );
	}
	if ( value.includes( '\\' ) ) {
		throw new Error( `Platform manifest: ${ field } must use forward-slash separators.` );
	}
}

function validateDate( value, field ) {
	assertString( value, field );
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec( value );
	if ( match ) {
		const [ year, month, day ] = match.slice( 1 ).map( Number );
		const parsed = new Date( Date.UTC( year, month - 1, day ) );
		if (
			parsed.getUTCFullYear() === year &&
			parsed.getUTCMonth() === month - 1 &&
			parsed.getUTCDate() === day
		) {
			return;
		}
	}
	throw new Error( `Platform manifest: ${ field } must use YYYY-MM-DD with a valid calendar date.` );
}

function validatePortableFileName( value, field ) {
	assertString( value, field );
	if (
		[ '.', '..' ].includes( value ) ||
		/[<>:"/\\|?*\u0000-\u001f]/.test( value ) ||
		/[. ]$/.test( value ) ||
		/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test( value )
	) {
		throw new Error( `Platform manifest: ${ field } must be a portable file name without path syntax.` );
	}
}

function validateCapability( platform, category ) {
	const capability = platform.capabilities?.[ category ];
	if ( ! capability || typeof capability.supported !== 'boolean' ) {
		throw new Error( `Platform manifest: ${ platform.id }.${ category }.supported must be boolean.` );
	}
	if ( ! capability.supported ) {
		assertString( capability.reason, `${ platform.id }.${ category }.reason` );
		return;
	}

	if ( ! STRATEGIES_BY_CATEGORY[ category ].has( capability.strategy ) ) {
		throw new Error(
			`Platform manifest: ${ platform.id }.${ category }.strategy must be one of ${ [ ...STRATEGIES_BY_CATEGORY[ category ] ].join( ', ' ) }; received ${ capability.strategy }.`
		);
	}
	assertString( capability.format, `${ platform.id }.${ category }.format` );
	validateRelativePath( capability.userPath, `${ platform.id }.${ category }.userPath` );
	validateRelativePath( capability.projectPath, `${ platform.id }.${ category }.projectPath` );
	assertString( capability.precedence, `${ platform.id }.${ category }.precedence` );

	if ( capability.strategy === 'files' ) {
		validatePortableFileName(
			capability.extension,
			`${ platform.id }.${ category }.extension`
		);
	}
	if ( capability.strategy === 'files' && category === 'instructions' ) {
		validatePortableFileName(
			capability.fileName,
			`${ platform.id }.${ category }.fileName`
		);
	}
	if ( capability.strategy === 'wrapper' ) {
		validateRelativePath(
			capability.canonicalPath,
			`${ platform.id }.${ category }.canonicalPath`
		);
		if ( path.posix.normalize( capability.userPath ) === path.posix.normalize( capability.canonicalPath ) ) {
			throw new Error( `Platform manifest: ${ platform.id }.${ category }.wrapper and canonical paths must not be the same.` );
		}
		if ( path.posix.dirname( capability.userPath ) !== path.posix.dirname( capability.canonicalPath ) ) {
			throw new Error( `Platform manifest: ${ platform.id }.${ category }.wrapper and canonical paths must share a directory.` );
		}
	}
	if ( capability.strategy === 'directories' ) {
		validatePortableFileName(
			capability.fileName,
			`${ platform.id }.${ category }.fileName`
		);
	}
	if ( capability.blockingPath ) {
		validateRelativePath( capability.blockingPath, `${ platform.id }.${ category }.blockingPath` );
	}
}

function validateLegacyDestination( platform, legacy, index ) {
	const field = `${ platform.id }.legacyDestinations[${ index }]`;
	if ( ! CATEGORIES.includes( legacy.category ) ) {
		throw new Error( `Platform manifest: ${ field }.category is invalid.` );
	}
	validateRelativePath( legacy.userPath, `${ field }.userPath` );
	validateRelativePath( legacy.sourceRoot, `${ field }.sourceRoot`, 'repository' );
	assertString( legacy.reason, `${ field }.reason` );
	if ( ! [ 'flat', 'nested' ].includes( legacy.layout ) ) {
		throw new Error( `Platform manifest: ${ field }.layout is invalid.` );
	}
	if ( legacy.layout === 'nested' ) {
		validatePortableFileName( legacy.fileName, `${ field }.fileName` );
	}
}

export function validateManifest( manifest ) {
	if ( manifest.schemaVersion !== 2 ) {
		throw new Error( 'Platform manifest: unsupported schemaVersion.' );
	}
	validateDate( manifest.lastReviewed, 'lastReviewed' );
	if ( ! Array.isArray( manifest.platforms ) ) {
		throw new Error( 'Platform manifest: platforms must be an array.' );
	}
	const ids = manifest.platforms.map( ( platform ) => platform.id );
	if ( JSON.stringify( ids ) !== JSON.stringify( PLATFORM_IDS ) ) {
		throw new Error( `Platform manifest: expected platform order ${ PLATFORM_IDS.join( ', ' ) }.` );
	}

	for ( const platform of manifest.platforms ) {
		assertString( platform.product, `${ platform.id }.product` );
		assertString( platform.surface, `${ platform.id }.surface` );
		if ( ! SUPPORT_TIERS.has( platform.supportTier ) ) {
			throw new Error( `Platform manifest: ${ platform.id }.supportTier is invalid.` );
		}
		validateDate( platform.lastAdapterChecked, `${ platform.id }.lastAdapterChecked` );
		validateRelativePath( platform.detection?.userPath, `${ platform.id }.detection.userPath` );
		for ( const category of CATEGORIES ) {
			validateCapability( platform, category );
		}
		for ( const [ index, legacy ] of ( platform.legacyDestinations ?? [] ).entries() ) {
			validateLegacyDestination( platform, legacy, index );
		}
		if ( ! Array.isArray( platform.documentation ) || platform.documentation.length === 0 ) {
			throw new Error( `Platform manifest: ${ platform.id }.documentation must not be empty.` );
		}
		for ( const [ index, documentationUrl ] of platform.documentation.entries() ) {
			assertString( documentationUrl, `${ platform.id }.documentation[${ index }]` );
			if ( ! documentationUrl.startsWith( 'https://' ) ) {
				throw new Error( `Platform manifest: ${ platform.id }.documentation[${ index }] must use HTTPS.` );
			}
		}
	}

	return manifest;
}

export async function loadManifest( repoDir ) {
	const manifestPath = path.join( repoDir, 'platforms', 'manifest.json' );
	return validateManifest( JSON.parse( await readFile( manifestPath, 'utf8' ) ) );
}

export function resolveUserPath( home, relativePath ) {
	const resolvedHome = path.resolve( home );
	const resolved = path.resolve( resolvedHome, ...relativePath.split( '/' ) );
	if ( resolved !== resolvedHome && ! resolved.startsWith( `${ resolvedHome }${ path.sep }` ) ) {
		throw new Error( `Installer: destination escapes HOME: ${ relativePath }` );
	}
	return resolved;
}

export function resolveUserChildPath( home, relativePath, ...children ) {
	const resolvedHome = path.resolve( home );
	const resolved = path.resolve( resolveUserPath( home, relativePath ), ...children );
	if ( resolved !== resolvedHome && ! resolved.startsWith( `${ resolvedHome }${ path.sep }` ) ) {
		throw new Error( `Installer: destination escapes HOME: ${ [ relativePath, ...children ].join( '/' ) }` );
	}
	return resolved;
}

export const categories = CATEGORIES;
