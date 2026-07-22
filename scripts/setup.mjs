#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import {
	copilotProjectExport,
	managedMarkdown,
} from './lib/formats.mjs';
import {
	isOwnedPath,
	lstatSafe,
	writeManagedFilesTransactionally,
} from './lib/files.mjs';
import { categories, loadManifest, resolveUserPath } from './lib/manifest.mjs';
import { createPlatformInstaller } from './lib/platform-installer.mjs';

const repoDir = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '..' );
const canonicalInstructionsPath = path.join( repoDir, 'AGENTS.md' );

function fail( message ) {
	throw new Error( message );
}

function requireSupportedNode() {
	const major = Number.parseInt( process.versions.node.split( '.', 1 )[ 0 ], 10 );
	if ( major < 22 ) {
		fail( `ai-instructions requires Node.js 22 or newer; found ${ process.versions.node }.` );
	}
}

function parseArguments( argv, platformIds ) {
	const options = {
		command: 'install',
		selected: new Set(),
		only: new Set(),
		copy: false,
		yes: false,
		dryRun: false,
		copilotConcat: null,
	};
	let index = 0;
	if ( [ 'install', 'list', 'remove', 'update', 'check' ].includes( argv[ 0 ] ) ) {
		options.command = argv[ 0 ];
		index = 1;
	}

	for ( ; index < argv.length; index++ ) {
		const argument = argv[ index ];
		switch ( argument ) {
			case '--agent': {
				const value = argv[ ++index ];
				if ( ! value ) {
					fail( '--agent requires a value.' );
				}
				if ( value === '*' ) {
					for ( const id of platformIds ) {
						options.selected.add( id );
					}
				} else if ( platformIds.includes( value ) ) {
					options.selected.add( value );
				} else {
					fail( `Unknown agent '${ value }'. Available: ${ platformIds.join( ', ' ) }.` );
				}
				break;
			}
			case '--only': {
				let value = argv[ ++index ];
				if ( ! value ) {
					fail( '--only requires a value.' );
				}
				if ( value === 'personas' ) {
					console.warn( '[warning] --only personas is deprecated; use --only agents.' );
					value = 'agents';
				}
				if ( ! categories.includes( value ) ) {
					fail( '--only value must be instructions, skills, or agents.' );
				}
				options.only.add( value );
				break;
			}
			case '--copilot-concat':
				options.copilotConcat = argv[ index + 1 ] && ! argv[ index + 1 ].startsWith( '-' )
					? argv[ ++index ]
					: '.';
				break;
			case '--copy':
				options.copy = true;
				break;
			case '--yes':
			case '-y':
				options.yes = true;
				break;
			case '--dry-run':
				options.dryRun = true;
				break;
			case '--help':
			case '-h':
				options.help = true;
				break;
			default:
				fail( `Unknown option: ${ argument }.` );
		}
	}

	if ( options.copilotConcat && ! [ 'install', 'update' ].includes( options.command ) ) {
		fail( '--copilot-concat can only be used with install or update.' );
	}
	return options;
}

function printUsage( platformIds ) {
	console.log( `Usage: ai-instructions [COMMAND] [OPTIONS]

Wire ai-instructions into supported AI tool configurations.

Commands:
  install              Install missing managed artifacts (default)
  list                 List installed, stale, and conflicting artifacts
  remove               Remove only artifacts owned by this repository
  update               Safely refresh managed artifacts and clean stale ones
  check                Verify installed artifacts; exits non-zero on drift or conflicts

Options:
  --agent <name>       Target ${ platformIds.join( ', ' ) }; repeatable; '*' selects all
  --only <category>    Limit to instructions, skills, or agents; repeatable
  --copilot-concat [DIR]  Export a shared AGENTS.md and Copilot wrapper explicitly
  --copy               Copy portable files instead of symlinking them
  -y, --yes            Select every detected product without prompting
  --dry-run            Preview changes without writing
  -h, --help           Show this help message` );
}

function createState( options ) {
	return {
		options,
		new: 0,
		upToDate: 0,
		skipped: 0,
		removed: 0,
		stale: 0,
		broken: 0,
		checkFailures: 0,
	};
}

function logHeader( value ) {
	console.log( `\n==> ${ value }` );
}

async function detectPlatforms( manifest, home ) {
	const detected = [];
	for ( const platform of manifest.platforms ) {
		if ( await lstatSafe( resolveUserPath( home, platform.detection.userPath ) ) ) {
			detected.push( platform.id );
		}
	}
	return detected;
}

async function choosePlatforms( manifest, home, options ) {
	if ( options.selected.size > 0 ) {
		return;
	}
	const detected = await detectPlatforms( manifest, home );
	if ( options.yes || options.copilotConcat ) {
		for ( const id of detected ) {
			options.selected.add( id );
		}
		if ( detected.length === 0 && ! options.copilotConcat ) {
			fail( "No known agent directories found in $HOME. Use --agent <name> or --agent '*'." );
		}
		return;
	}
	if ( detected.length === 0 ) {
		fail( "No known agent directories found in $HOME. Use --agent <name> or --agent '*'." );
	}
	if ( ! process.stdin.isTTY ) {
		fail( "Cannot prompt because stdin is not interactive. Re-run with --yes or --agent <name>." );
	}

	console.log( 'Detected agents:' );
	detected.forEach( ( id, index ) => console.log( `  ${ index + 1 }) ${ id }` ) );
	console.log( '  a) All detected' );
	const prompt = createInterface( { input: process.stdin, output: process.stdout } );
	const answer = await prompt.question( "Select agents (numbers separated by spaces, or 'a' for all): " );
	prompt.close();
	if ( answer.trim().toLowerCase() === 'a' ) {
		detected.forEach( ( id ) => options.selected.add( id ) );
	} else {
		for ( const token of answer.trim().split( /\s+/ ) ) {
			const id = detected[ Number.parseInt( token, 10 ) - 1 ];
			if ( id ) {
				options.selected.add( id );
			}
		}
	}
	if ( options.selected.size === 0 ) {
		fail( 'No agents selected.' );
	}
}

async function processCopilotExport( directory, state ) {
	const root = path.resolve( directory );
	const source = await readFile( canonicalInstructionsPath, 'utf8' );
	const artifacts = [
		{
			destination: path.join( root, 'AGENTS.md' ),
			expectedContent: managedMarkdown( source ),
		},
		{
			destination: path.join( root, '.github', 'copilot-instructions.md' ),
			expectedContent: copilotProjectExport( '@../AGENTS.md\n' ),
		},
	];
	const statuses = await Promise.all( artifacts.map( async ( artifact ) => ( {
		artifact,
		stats: await lstatSafe( artifact.destination ),
	} ) ) );
	for ( const { artifact, stats } of statuses ) {
		if ( stats && ! await isOwnedPath( artifact.destination, repoDir ) ) {
			console.warn( `  [warning] ${ artifact.destination } already exists and was not generated by this script -- skipping` );
			state.skipped++;
			return;
		}
	}
	const isCurrent = await Promise.all( statuses.map( async ( { artifact, stats } ) =>
		Boolean( stats ) && await readFile( artifact.destination, 'utf8' ) === artifact.expectedContent
	) );
	if ( isCurrent.every( Boolean ) ) {
		for ( const { artifact } of statuses ) {
			console.log( `  [=] ${ artifact.destination }` );
			state.upToDate++;
		}
		return;
	}
	if ( statuses.some( ( { stats }, index ) => stats && ! isCurrent[ index ] ) && state.options.command === 'install' ) {
		console.warn( '  [warning] repository export is outdated; run update to refresh' );
		state.skipped++;
		return;
	}
	if ( state.options.dryRun ) {
		for ( const { artifact } of statuses ) {
			console.log( `  [dry-run] write ${ artifact.destination }` );
		}
		return;
	}
	await writeManagedFilesTransactionally(
		artifacts.map( ( artifact ) => ( {
			destination: artifact.destination,
			content: artifact.expectedContent,
		} ) ),
		repoDir
	);
	for ( const [ index, { artifact } ] of statuses.entries() ) {
		if ( isCurrent[ index ] ) {
			console.log( `  [=] ${ artifact.destination }` );
			state.upToDate++;
		} else {
			console.log( `  [+] ${ artifact.destination }` );
			state.new++;
		}
	}
}

function printSummary( state ) {
	console.log( '\nSummary' );
	if ( [ 'install', 'update' ].includes( state.options.command ) ) {
		console.log( `  Newly linked/copied: ${ state.new }` );
		console.log( `  Already up to date:  ${ state.upToDate }` );
		if ( state.skipped ) console.log( `  Skipped (conflict):  ${ state.skipped }` );
		if ( state.stale ) console.log( `  Stale removed:       ${ state.stale }` );
	} else if ( state.options.command === 'remove' ) {
		console.log( `  Removed: ${ state.removed }` );
		if ( state.skipped ) console.log( `  Skipped (conflict): ${ state.skipped }` );
	} else if ( state.options.command === 'check' ) {
		console.log( `  OK: ${ state.upToDate }` );
		if ( state.skipped ) console.log( `  Conflict: ${ state.skipped }` );
		if ( state.broken ) console.log( `  Broken: ${ state.broken }` );
	}
}

async function main() {
	requireSupportedNode();
	const home = process.env.HOME || homedir();
	if ( ! home ) {
		fail( 'Cannot determine the home directory for agent configuration.' );
	}
	const manifest = await loadManifest( repoDir );
	const platformIds = manifest.platforms.map( ( platform ) => platform.id );
	const options = parseArguments( process.argv.slice( 2 ), platformIds );
	if ( options.help ) {
		printUsage( platformIds );
		return;
	}
	await choosePlatforms( manifest, home, options );
	const selectedCategories = options.only.size > 0 ? [ ...options.only ] : categories;
	const state = createState( options );
	const installer = createPlatformInstaller( { repoDir, home, state } );

	console.log( `ai-instructions (source: ${ repoDir })` );
	if ( options.dryRun ) console.log( '(dry-run mode -- no changes will be made)' );
	if ( options.copy ) console.log( '(copy mode -- portable files will be copied)' );
	if ( options.selected.size ) console.log( `Agents: ${ [ ...options.selected ].join( ' ' ) }` );

	for ( const id of options.selected ) {
		const platform = manifest.platforms.find( ( entry ) => entry.id === id );
		await installer.processPlatform( platform, selectedCategories );
	}
	if ( options.copilotConcat ) {
		logHeader( 'GitHub Copilot (repository export)' );
		await processCopilotExport( options.copilotConcat, state );
	}
	if ( options.command !== 'list' ) {
		printSummary( state );
	}
	if ( options.command === 'check' && state.checkFailures > 0 ) {
		process.exitCode = 1;
	}
}

main().catch( ( error ) => {
	console.error( `Error: ${ error.message }` );
	process.exitCode = 1;
} );
