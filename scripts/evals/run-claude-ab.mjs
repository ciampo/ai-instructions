#!/usr/bin/env node

/**
 * Paired A/B evaluation of two revisions of the core instructions and skills
 * in a real, isolated Claude Code session.
 *
 * Each trial runs `claude -p` in a fresh directory that holds only the
 * variant's core (as project memory) and skills. User-level memory, skills,
 * and MCP servers are not loaded. Deterministic checks and skill-loading
 * results come from the session's event stream. Assertions are graded by a
 * separate model call that sees both variants under shuffled labels.
 */

import { spawn, spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoDir = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../..' );
const usage =
	'Usage: run-claude-ab.mjs --base <rev|WORKTREE> --head <rev|WORKTREE> --suite <core|skill:name>... ' +
	'--model <id> --output <summary.json> [--grader-model <id>] [--trials <n>] [--case <id>]... [--concurrency <n>] [--keep <dir>]';

export function parseArguments( args ) {
	const options = { suites: [], cases: [], trials: 3, concurrency: 4 };
	const single = {
		'--base': 'base',
		'--head': 'head',
		'--model': 'model',
		'--grader-model': 'graderModel',
		'--output': 'output',
		'--keep': 'keep',
	};
	for ( let index = 0; index < args.length; index++ ) {
		const name = args[ index ];
		const value = args[ ++index ];
		if ( value === undefined || value.startsWith( '--' ) ) {
			throw new Error( `${ name } requires a value.\n${ usage }` );
		}
		if ( single[ name ] ) {
			options[ single[ name ] ] = value;
		} else if ( name === '--suite' ) {
			options.suites.push( value );
		} else if ( name === '--case' ) {
			options.cases.push( value );
		} else if ( name === '--trials' || name === '--concurrency' ) {
			const number = Number.parseInt( value, 10 );
			if ( ! Number.isInteger( number ) || number < 1 || number > 10 ) {
				throw new Error( `${ name } must be between 1 and 10.` );
			}
			options[ name.slice( 2 ) ] = number;
		} else {
			throw new Error( `Unknown argument ${ name }.\n${ usage }` );
		}
	}
	for ( const required of [ 'base', 'head', 'model', 'output' ] ) {
		if ( ! options[ required ] ) {
			throw new Error( `--${ required } is required.\n${ usage }` );
		}
	}
	if ( ! options.suites.length ) {
		throw new Error( `At least one --suite is required.\n${ usage }` );
	}
	for ( const suite of options.suites ) {
		if ( suite !== 'core' && ! /^skill:[a-z0-9-]+$/.test( suite ) ) {
			throw new Error( `--suite must be core or skill:<name>, received ${ suite }.` );
		}
	}
	options.graderModel ??= options.model;
	return options;
}

/** Runs one deterministic check against a trial. Returns true when it passes. */
export function runCheck( check, trial ) {
	const text = trial.response ?? '';
	switch ( check.type ) {
		case 'regex':
			return new RegExp( check.pattern, check.flags ?? 'u' ).test( text );
		case 'notRegex':
			return ! new RegExp( check.pattern, check.flags ?? 'u' ).test( text );
		case 'maxWords':
			return text.split( /\s+/ ).filter( Boolean ).length <= check.value;
		case 'noToolUse':
			return ! trial.tools.some( ( tool ) => check.tools.includes( tool ) );
		case 'loads':
			return trial.loaded.includes( check.skill );
		case 'notLoads':
			return ! trial.loaded.includes( check.skill );
		default:
			throw new Error( `Unknown check type ${ check.type }.` );
	}
}

/** Extracts the response, loaded skills, and attempted tools from stream-json output. */
export function parseStream( stdout ) {
	const events = stdout
		.split( '\n' )
		.filter( Boolean )
		.flatMap( ( line ) => {
			try {
				return [ JSON.parse( line ) ];
			} catch {
				return [];
			}
		} );
	const loaded = new Set();
	const tools = [];
	for ( const event of events ) {
		if ( event.type !== 'assistant' ) {
			continue;
		}
		for ( const block of event.message?.content ?? [] ) {
			if ( block.type !== 'tool_use' ) {
				continue;
			}
			tools.push( block.name );
			if ( block.name === 'Skill' && block.input?.skill ) {
				loaded.add( block.input.skill );
			}
			const match = /skills\/([a-z0-9-]+)\/SKILL\.md$/.exec( block.input?.file_path ?? '' );
			if ( block.name === 'Read' && match ) {
				loaded.add( match[ 1 ] );
			}
		}
	}
	const result = events.find( ( event ) => event.type === 'result' );
	return {
		response: result?.result ?? '',
		loaded: [ ...loaded ].sort(),
		tools,
		cost: result?.total_cost_usd ?? 0,
		completed: Boolean( result ) && ! result.is_error,
	};
}

function git( args, options = {} ) {
	const result = spawnSync( 'git', args, { cwd: repoDir, maxBuffer: 256 * 1024 * 1024, ...options } );
	if ( result.status !== 0 ) {
		throw new Error( `git ${ args.join( ' ' ) } failed: ${ result.stderr }` );
	}
	return result.stdout;
}

async function readSource( revision, relativePath ) {
	if ( revision === 'WORKTREE' ) {
		return fs.readFile( path.join( repoDir, relativePath ), 'utf8' );
	}
	return git( [ 'show', `${ revision }:${ relativePath }` ], { encoding: 'utf8' } );
}

async function stageVariant( revision, root ) {
	await fs.mkdir( path.join( root, '.claude' ), { recursive: true } );
	let core;
	try {
		core = await readSource( revision, 'instructions/core.md' );
	} catch {
		core = await readSource( revision, 'AGENTS.md' );
	}
	await fs.writeFile( path.join( root, 'CLAUDE.md' ), core );
	const skillsRoot = path.join( root, '.claude', 'skills' );
	if ( revision === 'WORKTREE' ) {
		await fs.cp( path.join( repoDir, 'skills' ), skillsRoot, { recursive: true } );
	} else {
		const archive = git( [ 'archive', '--format=tar', revision, 'skills' ] );
		const extract = spawnSync( 'tar', [ '-xf', '-', '-C', path.join( root, '.claude' ) ], { input: archive } );
		if ( extract.status !== 0 ) {
			throw new Error( `Cannot stage skills from ${ revision }.` );
		}
	}
	// The subject must not see the fixtures or their assertions.
	for ( const skill of await fs.readdir( skillsRoot ) ) {
		await fs.rm( path.join( skillsRoot, skill, 'evals' ), { recursive: true, force: true } );
	}
}

async function loadCases( options ) {
	const cases = [];
	for ( const suite of options.suites ) {
		const directory = suite === 'core' ? 'instructions' : `skills/${ suite.slice( 6 ) }`;
		const fixture = JSON.parse( await readSource( options.head, `${ directory }/evals/evals.json` ) );
		for ( const testCase of fixture.outputCases ?? [] ) {
			cases.push( {
				...testCase,
				kind: 'output',
				id: `${ suite }/${ testCase.id }`,
				contextText: testCase.context
					? await readSource( options.head, `${ directory }/${ testCase.context }` )
					: undefined,
			} );
		}
		for ( const testCase of suite === 'core' ? [] : fixture.triggerCases ?? [] ) {
			cases.push( {
				...testCase,
				kind: 'trigger',
				id: `${ suite }/trigger/${ testCase.id }`,
				skill: suite.slice( 6 ),
			} );
		}
	}
	const selected = options.cases.length ? cases.filter( ( testCase ) => options.cases.includes( testCase.id ) ) : cases;
	if ( ! selected.length ) {
		throw new Error( 'No evaluation cases matched.' );
	}
	return selected;
}

function runClaude( prompt, cwd, model, { tools = 'Read,Glob,Grep,Skill', maxTurns = 12 } = {} ) {
	return new Promise( ( resolve ) => {
		const child = spawn(
			'claude',
			[
				'-p',
				prompt,
				'--setting-sources',
				'project',
				'--strict-mcp-config',
				'--permission-mode',
				'dontAsk',
				'--allowedTools',
				tools,
				'--max-turns',
				String( maxTurns ),
				'--output-format',
				'stream-json',
				'--verbose',
				'--model',
				model,
			],
			{ cwd, stdio: [ 'ignore', 'pipe', 'pipe' ] }
		);
		let stdout = '';
		child.stdout.on( 'data', ( chunk ) => ( stdout += chunk ) );
		child.stderr.resume();
		const timer = setTimeout( () => child.kill( 'SIGKILL' ), 600_000 );
		child.on( 'close', () => {
			clearTimeout( timer );
			resolve( stdout );
		} );
		child.on( 'error', () => resolve( stdout ) );
	} );
}

async function runTrial( testCase, variant, templates, workRoot, options, trial ) {
	const cwd = await fs.mkdtemp( path.join( workRoot, 'trial-' ) );
	await fs.cp( templates[ variant ], cwd, { recursive: true } );
	let prompt = testCase.prompt;
	if ( testCase.contextText !== undefined ) {
		await fs.writeFile( path.join( cwd, 'context.md' ), testCase.contextText );
		prompt += '\n\nThe attached context is in ./context.md. It is the complete evidence for this request.';
	}
	const stdout = await runClaude( prompt, cwd, options.model, {
		maxTurns: testCase.kind === 'trigger' ? 6 : 12,
	} );
	const parsed = parseStream( stdout );
	if ( options.keep ) {
		await fs.writeFile(
			path.join( options.keep, `${ testCase.id.replaceAll( '/', '_' ) }.${ variant }.${ trial }.jsonl` ),
			stdout
		);
	}
	await fs.rm( cwd, { recursive: true, force: true } );
	return { ...parsed, variant, trial };
}

async function grade( testCase, pair, workRoot, options ) {
	const flip = Math.random() < 0.5;
	const labels = flip ? { X: 'head', Y: 'base' } : { X: 'base', Y: 'head' };
	const describe = ( trial ) =>
		`Skills loaded: ${ trial.loaded.join( ', ' ) || 'none' }\nTools attempted: ${
			trial.tools.join( ', ' ) || 'none'
		}\nResponse:\n${ trial.response || '(no response)' }`;
	const prompt = [
		'You grade two anonymous responses, X and Y, to the same request. Be strict. Judge only what is shown.',
		'The subject could read files and load skills but could not edit files, run commands, or reach the network. Do not fail a response for those limits.',
		`<request>\n${ testCase.prompt }\n</request>`,
		testCase.contextText ? `<context>\n${ testCase.contextText }\n</context>` : '',
		`<assertions>\n${ testCase.assertions.map( ( text, index ) => `${ index + 1 }. ${ text }` ).join( '\n' ) }\n</assertions>`,
		`<X>\n${ describe( pair[ labels.X ] ) }\n</X>`,
		`<Y>\n${ describe( pair[ labels.Y ] ) }\n</Y>`,
		'Reply with only a JSON object of this shape and nothing else:',
		'{"assertions":[{"index":1,"X":"pass","Y":"fail","note":"one short sentence of evidence"}]}',
	]
		.filter( Boolean )
		.join( '\n\n' );
	const cwd = await fs.mkdtemp( path.join( workRoot, 'grader-' ) );
	const { response } = parseStream( await runClaude( prompt, cwd, options.graderModel, { tools: 'Read', maxTurns: 2 } ) );
	await fs.rm( cwd, { recursive: true, force: true } );
	const json = /\{[\s\S]*\}/.exec( response );
	if ( ! json ) {
		return undefined;
	}
	try {
		return JSON.parse( json[ 0 ] ).assertions.map( ( entry ) => ( {
			index: entry.index,
			[ labels.X ]: entry.X === 'pass',
			[ labels.Y ]: entry.Y === 'pass',
			note: entry.note,
		} ) );
	} catch {
		return undefined;
	}
}

async function pool( jobs, concurrency ) {
	let next = 0;
	await Promise.all(
		Array.from( { length: concurrency }, async () => {
			while ( next < jobs.length ) {
				await jobs[ next++ ]();
			}
		} )
	);
}

async function main() {
	const options = parseArguments( process.argv.slice( 2 ) );
	const workRoot = await fs.mkdtemp( path.join( os.tmpdir(), 'claude-ab-' ) );
	if ( options.keep ) {
		options.keep = path.resolve( options.keep );
		await fs.mkdir( options.keep, { recursive: true } );
	}
	try {
		const templates = { base: path.join( workRoot, 'base' ), head: path.join( workRoot, 'head' ) };
		await stageVariant( options.base, templates.base );
		await stageVariant( options.head, templates.head );
		const cases = await loadCases( options );
		const results = cases.map( ( testCase ) => ( { testCase, trials: [] } ) );
		const jobs = [];
		for ( const result of results ) {
			for ( let trial = 1; trial <= options.trials; trial++ ) {
				jobs.push( async () => {
					const [ base, head ] = await Promise.all(
						[ 'base', 'head' ].map( ( variant ) =>
							runTrial( result.testCase, variant, templates, workRoot, options, trial )
						)
					);
					const pair = { base, head };
					const entry = { trial, pair };
					if ( result.testCase.kind === 'output' && result.testCase.assertions?.length ) {
						entry.grades = await grade( result.testCase, pair, workRoot, options );
					}
					result.trials.push( entry );
					process.stderr.write( `${ result.testCase.id } trial ${ trial } done\n` );
				} );
			}
		}
		await pool( jobs, options.concurrency );

		const totals = {};
		for ( const variant of [ 'base', 'head' ] ) {
			totals[ variant ] = {
				assertionsPassed: 0,
				assertionsGraded: 0,
				checksPassed: 0,
				checksRun: 0,
				triggersPassed: 0,
				triggersRun: 0,
				incomplete: 0,
				words: 0,
				cost: 0,
			};
		}
		const caseSummaries = results.map( ( { testCase, trials } ) => {
			const summary = { id: testCase.id, kind: testCase.kind, base: {}, head: {}, failures: [] };
			for ( const variant of [ 'base', 'head' ] ) {
				const total = totals[ variant ];
				const row = { assertions: 0, checks: 0, triggers: 0, loaded: [] };
				for ( const { trial, pair, grades } of trials ) {
					const run = pair[ variant ];
					total.cost += run.cost;
					total.incomplete += run.completed ? 0 : 1;
					total.words += run.response.split( /\s+/ ).filter( Boolean ).length;
					row.loaded.push( run.loaded.join( '+' ) || '-' );
					if ( testCase.kind === 'trigger' ) {
						const passed = run.loaded.includes( testCase.skill ) === testCase.shouldTrigger;
						total.triggersRun++;
						total.triggersPassed += passed ? 1 : 0;
						row.triggers += passed ? 1 : 0;
						if ( ! passed ) {
							summary.failures.push( `${ variant } trial ${ trial }: loaded ${ run.loaded.join( ', ' ) || 'nothing' }` );
						}
						continue;
					}
					for ( const check of testCase.checks ?? [] ) {
						const passed = runCheck( check, run );
						total.checksRun++;
						total.checksPassed += passed ? 1 : 0;
						row.checks += passed ? 1 : 0;
						if ( ! passed ) {
							summary.failures.push( `${ variant } trial ${ trial }: check ${ JSON.stringify( check ) }` );
						}
					}
					for ( const entry of grades ?? [] ) {
						total.assertionsGraded++;
						total.assertionsPassed += entry[ variant ] ? 1 : 0;
						row.assertions += entry[ variant ] ? 1 : 0;
						if ( ! entry[ variant ] ) {
							summary.failures.push( `${ variant } trial ${ trial }: assertion ${ entry.index }: ${ entry.note ?? '' }` );
						}
					}
				}
				summary[ variant ] = row;
			}
			summary.ungradedTrials = testCase.kind === 'output' && testCase.assertions?.length
				? trials.filter( ( entry ) => ! entry.grades ).length
				: 0;
			return summary;
		} );

		const report = {
			base: options.base === 'WORKTREE' ? 'WORKTREE' : git( [ 'rev-parse', options.base ], { encoding: 'utf8' } ).trim(),
			head: options.head === 'WORKTREE' ? 'WORKTREE' : git( [ 'rev-parse', options.head ], { encoding: 'utf8' } ).trim(),
			client: spawnSync( 'claude', [ '--version' ], { encoding: 'utf8' } ).stdout.trim(),
			model: options.model,
			graderModel: options.graderModel,
			trials: options.trials,
			suites: options.suites,
			totals,
			cases: caseSummaries,
		};
		await fs.writeFile( path.resolve( options.output ), JSON.stringify( report, null, '\t' ) + '\n' );
		for ( const variant of [ 'base', 'head' ] ) {
			const total = totals[ variant ];
			process.stdout.write(
				`${ variant }: assertions ${ total.assertionsPassed }/${ total.assertionsGraded }, checks ${ total.checksPassed }/${ total.checksRun }, ` +
					`triggers ${ total.triggersPassed }/${ total.triggersRun }, incomplete ${ total.incomplete }, words ${ total.words }, cost $${ total.cost.toFixed( 2 ) }\n`
			);
		}
	} finally {
		await fs.rm( workRoot, { recursive: true, force: true } );
	}
}

if ( process.argv[ 1 ] && path.resolve( process.argv[ 1 ] ) === fileURLToPath( import.meta.url ) ) {
	main().catch( ( error ) => {
		process.stderr.write( `${ error.message }\n` );
		process.exit( 1 );
	} );
}
