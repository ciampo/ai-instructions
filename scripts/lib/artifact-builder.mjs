import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import {
	concatInstructions,
	concatenatedInstructions,
	codexAgent,
	cursorRule,
	managedMarkdown,
	parseFrontmatter,
} from './formats.mjs';
import { lstatSafe } from './files.mjs';
import { resolveUserPath } from './manifest.mjs';

export function createArtifactBuilder( { repoDir } ) {
	const instructionsDir = path.join( repoDir, 'instructions' );
	const skillsDir = path.join( repoDir, 'skills' );
	const agentsDir = path.join( repoDir, 'agents' );

	function fail( message ) {
		throw new Error( message );
	}

	async function sourceMarkdownFiles( directory ) {
		return ( await readdir( directory, { withFileTypes: true } ) )
			.filter( ( entry ) => entry.isFile() && entry.name.endsWith( '.md' ) )
			.map( ( entry ) => entry.name )
			.sort();
	}

	async function sourceSkillFiles() {
		const entries = ( await readdir( skillsDir, { withFileTypes: true } ) )
			.filter( ( entry ) => entry.isDirectory() )
			.sort( ( a, b ) => a.name.localeCompare( b.name ) );
		const result = [];
		for ( const entry of entries ) {
			const source = path.join( skillsDir, entry.name, 'SKILL.md' );
			if ( await lstatSafe( source ) ) {
				result.push( { name: entry.name, source } );
			}
		}
		return result;
	}

	function artifactLabel( format, destination ) {
		if ( format === 'cursor-rule' ) {
			return `${ destination } (cursor rule)`;
		}
		if ( format === 'agents-md' ) {
			return `${ destination } (concatenated)`;
		}
		if ( format === 'codex-agent-toml' ) {
			return `${ destination } (Codex agent)`;
		}
		return destination;
	}

	async function buildArtifacts( platform, selectedCategories, home ) {
		const artifacts = [];
		for ( const category of selectedCategories ) {
			const capability = platform.capabilities[ category ];
			if ( ! capability.supported ) {
				continue;
			}

			if ( category === 'instructions' ) {
				if ( capability.strategy === 'concat' ) {
					const destination = resolveUserPath( home, capability.userPath );
					artifacts.push( {
						category,
						destination,
						expectedContent: concatenatedInstructions( await concatInstructions( instructionsDir ) ),
						format: capability.format,
						generated: true,
						label: artifactLabel( capability.format, destination ),
					} );
					continue;
				}

				for ( const name of await sourceMarkdownFiles( instructionsDir ) ) {
					const source = path.join( instructionsDir, name );
					const content = await readFile( source, 'utf8' );
					const destination = path.join(
						resolveUserPath( home, capability.userPath ),
						`${ path.basename( name, '.md' ) }${ capability.extension }`
					);
					artifacts.push( {
						category,
						destination,
						expectedContent: capability.format === 'cursor-rule'
							? cursorRule( content, source )
							: managedMarkdown( content ),
						format: capability.format,
						generated: capability.format !== 'markdown',
						label: artifactLabel( capability.format, destination ),
						source,
					} );
				}
				continue;
			}

			if ( category === 'skills' ) {
				for ( const { name, source } of await sourceSkillFiles() ) {
					const content = await readFile( source, 'utf8' );
					const metadata = parseFrontmatter( content, source );
					if ( metadata.name !== name ) {
						fail( `${ source }: frontmatter name must match its directory.` );
					}
					const destination = path.join(
						resolveUserPath( home, capability.userPath ),
						name,
						capability.fileName
					);
					artifacts.push( {
						category,
						destination,
						expectedContent: managedMarkdown( content ),
						format: capability.format,
						generated: false,
						label: destination,
						source,
					} );
				}
				continue;
			}

			for ( const name of await sourceMarkdownFiles( agentsDir ) ) {
				const source = path.join( agentsDir, name );
				const content = await readFile( source, 'utf8' );
				const metadata = parseFrontmatter( content, source );
				const expectedName = path.basename( name, '.md' );
				if ( metadata.name !== expectedName ) {
					fail( `${ source }: frontmatter name must match its filename.` );
				}
				const destination = path.join(
					resolveUserPath( home, capability.userPath ),
					`${ expectedName }${ capability.extension }`
				);
				artifacts.push( {
					category,
					destination,
					expectedContent: capability.format === 'codex-agent-toml'
						? codexAgent( content, source )
						: managedMarkdown( content ),
					format: capability.format,
					generated: capability.format === 'codex-agent-toml',
					label: artifactLabel( capability.format, destination ),
					source,
				} );
			}
		}
		return artifacts;
	}

	return { buildArtifacts };
}

