import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [ command, ...args ] = process.argv.slice( 2 );
if ( command === '--version' ) {
	console.log( 'taskbook 1.0.0' );
} else {
	const dataDirectory = process.env.TASKBOOK_DATA_DIR;
	if ( ! dataDirectory || ! path.isAbsolute( dataDirectory ) ) {
		console.error( 'Set TASKBOOK_DATA_DIR to an absolute disposable directory.' );
		process.exit( 2 );
	}
	const file = path.join( dataDirectory, 'tasks.json' );
	if ( command === 'doctor' ) {
		console.log( JSON.stringify( { version: '1.0.0', dataDirectory } ) );
	} else if ( command === 'add' && args.length === 1 && args[ 0 ].trim() ) {
		await mkdir( dataDirectory, { recursive: true } );
		const tasks = await readTasks();
		tasks.push( { id: tasks.length + 1, title: args[ 0 ].trim() } );
		await writeFile( file, JSON.stringify( tasks ) + '\n' );
		console.log( JSON.stringify( tasks.at( -1 ) ) );
	} else if ( command === 'list' && args.join( ' ' ) === '--format json' ) {
		console.log( JSON.stringify( await readTasks() ) );
	} else {
		console.error( 'Usage: taskbook --version | doctor | add <title> | list --format json' );
		process.exit( 2 );
	}

	async function readTasks() {
		try {
			return JSON.parse( await readFile( file, 'utf8' ) );
		} catch ( error ) {
			if ( error.code === 'ENOENT' ) return [];
			throw error;
		}
	}
}
