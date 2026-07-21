#!/usr/bin/env node

import { lstat, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
	concatInstructions,
	concatenatedInstructions,
	normalizeMarkdown,
	parseFrontmatter,
} from './lib/formats.mjs';
import { isInside } from './lib/files.mjs';
import { loadManifest } from './lib/manifest.mjs';

const MAX_UNIVERSAL_BYTES = 8 * 1024;
const MAX_UNIVERSAL_LINES = 150;
const MAX_REVIEW_AGE_DAYS = 120;
const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function entries( directory ) {
	return ( await readdir( directory, { withFileTypes: true } ) )
		.sort( ( first, second ) => first.name.localeCompare( second.name ) );
}

async function collectFiles( root, current = '' ) {
	const files = [];
	for ( const entry of await entries( path.join( root, current ) ) ) {
		const relative = path.join( current, entry.name );
		if ( entry.isSymbolicLink() ) {
			throw new Error( `${ path.join( root, relative ) }: bundled skill resources must not be symlinks.` );
		}
		if ( entry.isDirectory() ) {
			files.push( ...await collectFiles( root, relative ) );
		} else if ( entry.isFile() ) {
			files.push( relative );
		}
	}
	return files;
}

function frontmatterKeys( content ) {
	content = normalizeMarkdown( content );
	const closing = content.indexOf( '\n---\n', 4 );
	if ( ! content.startsWith( '---\n' ) || closing < 0 ) {
		return [];
	}
	return content
		.slice( 4, closing )
		.split( '\n' )
		.map( ( line ) => line.match( /^\s*([a-zA-Z][a-zA-Z0-9-]*)\s*:/ )?.[ 1 ] )
		.filter( Boolean );
}

function validateNameAndDescription( content, source, expectedName ) {
	const metadata = parseFrontmatter( content, source );
	if ( metadata.name !== expectedName ) {
		throw new Error( `${ source }: frontmatter name must match '${ expectedName }'.` );
	}
	if ( ! SKILL_NAME_PATTERN.test( metadata.name ) || metadata.name.length > 64 ) {
		throw new Error( `${ source }: name must be 1-64 lowercase letters, numbers, or hyphen-separated words.` );
	}
	if ( metadata.description.length > 1024 ) {
		throw new Error( `${ source }: description must not exceed 1024 characters.` );
	}
	return metadata;
}

function markdownProse( content ) {
	let fence;
	return normalizeMarkdown( content )
		.split( '\n' )
		.map( ( line ) => {
			const marker = line.match( /^\s*(`{3,}|~{3,})/ )?.[ 1 ];
			if ( fence ) {
				if ( marker?.[ 0 ] === fence[ 0 ] && marker.length >= fence.length ) {
					fence = undefined;
				}
				return '';
			}
			if ( marker ) {
				fence = marker;
				return '';
			}
			return line.replace( /`+[^`]*`+/g, '' );
		} )
		.join( '\n' );
}

async function validateSkillLinks( content, skillDirectory, source ) {
	for ( const match of markdownProse( content ).matchAll( /\[[^\]]+\]\(([^)]+)\)/g ) ) {
		const link = match[ 1 ].trim().replace( /^<|>$/g, '' );
		if ( /^(?:https?:|mailto:|#)/.test( link ) ) {
			continue;
		}
		const linkPath = link.split( '#', 1 )[ 0 ];
		const target = path.resolve( path.dirname( source ), linkPath );
		if ( ! isInside( target, skillDirectory ) ) {
			throw new Error( `${ source }: bundled reference escapes its skill directory: ${ link }.` );
		}
		try {
			await lstat( target );
		} catch ( error ) {
			if ( error.code === 'ENOENT' ) {
				throw new Error( `${ source }: bundled reference does not exist: ${ link }.` );
			}
			throw error;
		}
	}
}

async function validateSkills( repoDir ) {
	const skillsDirectory = path.join( repoDir, 'skills' );
	let count = 0;
	for ( const entry of await entries( skillsDirectory ) ) {
		if ( ! entry.isDirectory() ) {
			throw new Error( `${ path.join( skillsDirectory, entry.name ) }: skills must be directories.` );
		}
		const skillDirectory = path.join( skillsDirectory, entry.name );
		const skillFile = path.join( skillDirectory, 'SKILL.md' );
		const bundledFiles = await collectFiles( skillDirectory );
		if ( bundledFiles.includes( '.ai-instructions-managed' ) ) {
			throw new Error( `${ skillDirectory }: .ai-instructions-managed is reserved for installed copies.` );
		}
		const content = await readFile( skillFile, 'utf8' );
		validateNameAndDescription( content, skillFile, entry.name );
		for ( const relative of bundledFiles.filter( ( file ) => file.endsWith( '.md' ) ) ) {
			const source = path.join( skillDirectory, relative );
			await validateSkillLinks(
				relative === 'SKILL.md' ? content : await readFile( source, 'utf8' ),
				skillDirectory,
				source
			);
		}
		count++;
	}
	return count;
}

async function validateAgents( repoDir ) {
	const agentsDirectory = path.join( repoDir, 'agents' );
	let count = 0;
	for ( const entry of await entries( agentsDirectory ) ) {
		if ( ! entry.isFile() || ! entry.name.endsWith( '.md' ) ) {
			throw new Error( `${ path.join( agentsDirectory, entry.name ) }: agents must be Markdown files.` );
		}
		const source = path.join( agentsDirectory, entry.name );
		const content = await readFile( source, 'utf8' );
		const expectedName = path.basename( entry.name, '.md' );
		const metadata = validateNameAndDescription( content, source, expectedName );
		const keys = frontmatterKeys( content );
		if ( keys.some( ( key ) => ! [ 'name', 'description' ].includes( key ) ) ) {
			throw new Error( `${ source }: shared agents support only name and description frontmatter.` );
		}
		if ( metadata.body.includes( '"""' ) ) {
			throw new Error( `${ source }: agent body cannot be represented safely as Codex TOML.` );
		}
		count++;
	}
	return count;
}

async function validateUniversalInstructions( repoDir ) {
	const instructionsDirectory = path.join( repoDir, 'instructions' );
	for ( const entry of await entries( instructionsDirectory ) ) {
		if ( ! entry.isFile() || ! entry.name.endsWith( '.md' ) ) {
			throw new Error( `${ path.join( instructionsDirectory, entry.name ) }: universal instructions must be Markdown files.` );
		}
	}
	const generated = concatenatedInstructions( await concatInstructions( instructionsDirectory ) );
	const bytes = Buffer.byteLength( generated );
	const lines = generated.endsWith( '\n' )
		? generated.split( '\n' ).length - 1
		: generated.split( '\n' ).length;
	if ( bytes > MAX_UNIVERSAL_BYTES || lines > MAX_UNIVERSAL_LINES ) {
		throw new Error( `Universal instructions exceed the ${ MAX_UNIVERSAL_LINES } line / ${ MAX_UNIVERSAL_BYTES } byte budget: ${ lines } lines, ${ bytes } bytes.` );
	}
	return { bytes, lines };
}

export function assertRecentDate( value, source ) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec( value );
	if ( ! match ) {
		throw new Error( `${ source }: expected an ISO date with a valid calendar date.` );
	}
	const [ year, month, day ] = match.slice( 1 ).map( Number );
	const reviewedAt = Date.UTC( year, month - 1, day );
	const parsed = new Date( reviewedAt );
	if (
		parsed.getUTCFullYear() !== year ||
		parsed.getUTCMonth() !== month - 1 ||
		parsed.getUTCDate() !== day
	) {
		throw new Error( `${ source }: expected an ISO date with a valid calendar date.` );
	}
	const ageInDays = ( Date.now() - reviewedAt ) / 86_400_000;
	if ( ageInDays < -1 ) {
		throw new Error( `${ source }: review date cannot be in the future.` );
	}
	if ( ageInDays > MAX_REVIEW_AGE_DAYS ) {
		throw new Error( `${ source }: review is ${ Math.floor( ageInDays ) } days old; refresh it within ${ MAX_REVIEW_AGE_DAYS } days.` );
	}
}

async function validateReviewDates( repoDir, manifest ) {
	assertRecentDate( manifest.lastReviewed, 'platforms/manifest.json lastReviewed' );
	for ( const platform of manifest.platforms ) {
		assertRecentDate( platform.lastVerified, `platforms/manifest.json ${ platform.id }.lastVerified` );
	}
	const standardsPath = path.join( repoDir, 'docs', 'standards-index.md' );
	const standards = normalizeMarkdown( await readFile( standardsPath, 'utf8' ) );
	const lines = standards.split( '\n' );
	const header = lines.indexOf( '| Source | Affected guidance | Last reviewed |' );
	const rows = header < 0
		? []
		: lines.slice( header + 2 ).filter( ( line ) => line.startsWith( '| ' ) );
	if ( rows.length === 0 ) {
		throw new Error( `${ standardsPath }: no review dates found.` );
	}
	for ( const row of rows ) {
		const cells = row.split( '|' ).slice( 1, -1 ).map( ( cell ) => cell.trim() );
		if ( cells.length !== 3 ) {
			throw new Error( `${ standardsPath }: standards rows must contain source, guidance, and review date.` );
		}
		assertRecentDate( cells[ 2 ], standardsPath );
	}
}

export async function validateContent( repoDir ) {
	const manifest = await loadManifest( repoDir );
	const [ skillCount, agentCount, universal ] = await Promise.all( [
		validateSkills( repoDir ),
		validateAgents( repoDir ),
		validateUniversalInstructions( repoDir ),
	] );
	await validateReviewDates( repoDir, manifest );
	return { skillCount, agentCount, universal };
}

async function main() {
	const repoDir = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '..' );
	const result = await validateContent( repoDir );
	console.log( `Content contracts passed: ${ result.skillCount } skills, ${ result.agentCount } agents, ${ result.universal.lines } universal lines / ${ result.universal.bytes } bytes.` );
}

if ( process.argv[ 1 ] && path.resolve( process.argv[ 1 ] ) === fileURLToPath( import.meta.url ) ) {
	main().catch( ( error ) => {
		console.error( `Error: ${ error.message }` );
		process.exitCode = 1;
	} );
}
