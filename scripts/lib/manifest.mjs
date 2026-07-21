import { readFile } from 'node:fs/promises';
import path from 'node:path';

const PLATFORM_IDS = [ 'cursor', 'claude', 'codex', 'copilot', 'gemini' ];
const CATEGORIES = [ 'instructions', 'skills', 'agents' ];
const STRATEGIES = new Set( [ 'concat', 'directories', 'files' ] );
const SUPPORT_TIERS = new Set( [ 'verified', 'preview' ] );

function assertString( value, field ) {
	if ( typeof value !== 'string' || value.trim() === '' ) {
		throw new Error( `Platform manifest: ${ field } must be a non-empty string.` );
	}
}

function validateRelativePath( value, field ) {
	assertString( value, field );
	const segments = value.split( /[\\/]/ );
	if (
		path.posix.isAbsolute( value ) ||
		path.win32.isAbsolute( value ) ||
		segments.includes( '..' )
	) {
		throw new Error( `Platform manifest: ${ field } must stay within the selected home directory.` );
	}
	if ( value.includes( '\\' ) ) {
		throw new Error( `Platform manifest: ${ field } must use forward-slash separators.` );
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

	if ( ! STRATEGIES.has( capability.strategy ) ) {
		throw new Error( `Platform manifest: unsupported strategy for ${ platform.id }.${ category }.` );
	}
	assertString( capability.format, `${ platform.id }.${ category }.format` );
	validateRelativePath( capability.userPath, `${ platform.id }.${ category }.userPath` );
	validateRelativePath( capability.projectPath, `${ platform.id }.${ category }.projectPath` );
	assertString( capability.precedence, `${ platform.id }.${ category }.precedence` );

	if ( capability.strategy === 'files' && ! capability.extension ) {
		throw new Error( `Platform manifest: ${ platform.id }.${ category }.extension is required.` );
	}
	if ( capability.strategy === 'directories' && ! capability.fileName ) {
		throw new Error( `Platform manifest: ${ platform.id }.${ category }.fileName is required.` );
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
	validateRelativePath( legacy.sourceRoot, `${ field }.sourceRoot` );
	assertString( legacy.reason, `${ field }.reason` );
	if ( ! [ 'flat', 'nested' ].includes( legacy.layout ) ) {
		throw new Error( `Platform manifest: ${ field }.layout is invalid.` );
	}
	if ( legacy.layout === 'nested' ) {
		assertString( legacy.fileName, `${ field }.fileName` );
	}
}

export function validateManifest( manifest ) {
	if ( manifest.schemaVersion !== 1 ) {
		throw new Error( 'Platform manifest: unsupported schemaVersion.' );
	}
	assertString( manifest.lastReviewed, 'lastReviewed' );
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
		assertString( platform.lastVerified, `${ platform.id }.lastVerified` );
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

export const categories = CATEGORIES;
