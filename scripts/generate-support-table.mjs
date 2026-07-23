#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { writeAtomic } from './lib/files.mjs';
import { loadManifest } from './lib/manifest.mjs';

const repoDir = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '..' );
const readmePath = path.join( repoDir, 'README.md' );
const startMarker = '<!-- platform-support:start -->';
const endMarker = '<!-- platform-support:end -->';

function displayPath( capability, fileName = capability.fileName ) {
	if ( ! capability.supported ) {
		return `Not distributed: ${ capability.reason }`;
	}
	const root = `~/${ capability.userPath }`;
	if ( [ 'direct', 'wrapper' ].includes( capability.strategy ) ) {
		return `\`${ root }\``;
	}
	if ( capability.strategy === 'directories' ) {
		return `\`${ root }/*/${ capability.fileName }\``;
	}
	return `\`${ root }/${ fileName }${ capability.extension }\``;
}

export function renderSupportTable( manifest ) {
	const rows = [
		'| Product surface | Tier | Instructions | Skills | Agents | Adapter checked |',
		'| --- | --- | --- | --- | --- | --- |',
	];
	for ( const platform of manifest.platforms ) {
		rows.push(
			`| ${ platform.surface } | ${ platform.supportTier } | ${ displayPath( platform.capabilities.instructions ) } | ${ displayPath( platform.capabilities.skills ) } | ${ displayPath( platform.capabilities.agents, 'review-coordinator' ) } | ${ platform.lastAdapterChecked } |`
		);
	}
	return `${ startMarker }\n\n<!-- Generated from platforms/manifest.json. Do not edit this table directly. -->\n\n${ rows.join( '\n' ) }\n\n${ endMarker }`;
}

async function main() {
	const manifest = await loadManifest( repoDir );
	const readme = await readFile( readmePath, 'utf8' );
	const start = readme.indexOf( startMarker );
	const end = readme.indexOf( endMarker, start );
	if ( start < 0 || end < 0 ) {
		throw new Error( 'README.md: platform support markers are missing.' );
	}
	const generated = renderSupportTable( manifest );
	const next = `${ readme.slice( 0, start ) }${ generated }${ readme.slice( end + endMarker.length ) }`;
	if ( process.argv.includes( '--check' ) ) {
		if ( next !== readme ) {
			throw new Error( 'README.md platform support table is out of date. Run npm run docs:generate.' );
		}
		console.log( 'README platform support table is current.' );
		return;
	}
	await writeAtomic( readmePath, next );
	console.log( 'Updated README platform support table.' );
}

main().catch( ( error ) => {
	console.error( `Error: ${ error.message }` );
	process.exitCode = 1;
} );
