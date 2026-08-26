import assert from 'node:assert/strict';

const sessions = new Map();

function closeSession( accountId ) {
	const session = sessions.get( accountId );
	if ( ! session ) {
		return;
	}

	session.close();
	queueMicrotask( () => sessions.delete( accountId ) );
}

const closedSession = { close() {} };
const replacementSession = { close() {} };

sessions.set( 'account-7', closedSession );
closeSession( 'account-7' );
sessions.set( 'account-7', replacementSession );
await new Promise( queueMicrotask );

assert.equal(
	sessions.get( 'account-7' ),
	replacementSession,
	'deferred cleanup deleted the replacement session'
);
