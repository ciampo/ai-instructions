import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import {
	codexAgent,
	cursorRule,
	managedMarkdown,
	parseFrontmatter,
} from './formats.mjs';
import { lstatSafe, SKILL_DIRECTORY_MARKER } from './files.mjs';
import { resolveUserChildPath, resolveUserPath } from './manifest.mjs';

export function createArtifactBuilder( { repoDir } ) {
	const canonicalInstructionsPath = path.join( repoDir, 'AGENTS.md' );
	const skillsDir = path.join( repoDir, 'skills' );
	const agentsDir = path.join( repoDir, 'agents' );

	function fail( message ) {
		throw new Error( message );
	}

	async function sourceMarkdownFiles( directory, optional = false ) {
		let directoryEntries;
		try {
			directoryEntries = await readdir( directory, { withFileTypes: true } );
		} catch ( error ) {
			if ( optional && error.code === 'ENOENT' ) {
				return [];
			}
			throw error;
		}
		return directoryEntries
			.filter( ( entry ) => entry.isFile() && entry.name.endsWith( '.md' ) )
			.map( ( entry ) => entry.name )
			.sort();
	}

	async function sourceSkillDirectories() {
		const entries = ( await readdir( skillsDir, { withFileTypes: true } ) )
			.filter( ( entry ) => entry.isDirectory() )
			.sort( ( a, b ) => a.name.localeCompare( b.name ) );
		const result = [];
		for ( const entry of entries ) {
			const source = path.join( skillsDir, entry.name );
			const entrypoint = path.join( source, 'SKILL.md' );
			const entrypointStats = await lstatSafe( entrypoint );
			if ( entrypointStats?.isSymbolicLink() || ( entrypointStats && ! entrypointStats.isFile() ) ) {
				fail( `${ entrypoint }: source SKILL.md must be a regular file.` );
			}
			if ( await lstatSafe( path.join( source, SKILL_DIRECTORY_MARKER ) ) ) {
				fail( `${ source }: ${ SKILL_DIRECTORY_MARKER } is reserved for installed skill copies.` );
			}
			if ( entrypointStats ) {
				result.push( { name: entry.name, source, entrypoint } );
			}
		}
		return result;
	}

	function artifactLabel( format, destination ) {
		if ( format === 'cursor-rule' ) {
			return `${ destination } (cursor rule)`;
		}
		if ( format === 'agents-md' ) {
			return `${ destination } (canonical)`;
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
				const content = await readFile( canonicalInstructionsPath, 'utf8' );
				if ( capability.strategy === 'files' ) {
					const destination = resolveUserChildPath(
						home,
						capability.userPath,
						`${ capability.fileName }${ capability.extension }`
					);
					artifacts.push( {
						category,
						destination,
						expectedContent: cursorRule( content, canonicalInstructionsPath ),
						format: capability.format,
						generated: true,
						label: artifactLabel( capability.format, destination ),
					} );
					continue;
				}

				if ( capability.strategy === 'direct' ) {
					const destination = resolveUserPath( home, capability.userPath );
					artifacts.push( {
						category,
						destination,
						expectedContent: managedMarkdown( content ),
						format: capability.format,
						generated: true,
						label: artifactLabel( capability.format, destination ),
					} );
					continue;
				}

				const canonicalDestination = resolveUserPath( home, capability.canonicalPath );
				const group = `${ category }:${ capability.userPath }`;
				artifacts.push( {
					category,
					destination: canonicalDestination,
					expectedContent: managedMarkdown( content ),
					format: 'agents-md',
					generated: true,
					group,
					label: artifactLabel( 'agents-md', canonicalDestination ),
				} );
				const destination = resolveUserPath( home, capability.userPath );
				const importPath = path.posix.relative(
					path.posix.dirname( capability.userPath ),
					capability.canonicalPath
				);
				artifacts.push( {
					category,
					destination,
					expectedContent: managedMarkdown( `@${ importPath }\n` ),
					format: capability.format,
					generated: true,
					group,
					label: artifactLabel( capability.format, destination ),
				} );
				continue;
			}

			if ( category === 'skills' ) {
				for ( const { name, source, entrypoint } of await sourceSkillDirectories() ) {
					const content = await readFile( entrypoint, 'utf8' );
					const metadata = parseFrontmatter( content, entrypoint );
					if ( metadata.name !== name ) {
						fail( `${ entrypoint }: frontmatter name must match its directory.` );
					}
					const destination = resolveUserChildPath(
						home,
						capability.userPath,
						name
					);
					artifacts.push( {
						category,
						destination,
						expectedContent: content,
						format: capability.format,
						generated: false,
						kind: 'skill-directory',
						label: `${ destination }/ (skill)`,
						source,
					} );
				}
				continue;
			}

			for ( const name of await sourceMarkdownFiles( agentsDir, true ) ) {
				const source = path.join( agentsDir, name );
				const content = await readFile( source, 'utf8' );
				const metadata = parseFrontmatter( content, source );
				const expectedName = path.basename( name, '.md' );
				if ( metadata.name !== expectedName ) {
					fail( `${ source }: frontmatter name must match its filename.` );
				}
				const destination = resolveUserChildPath(
					home,
					capability.userPath,
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
