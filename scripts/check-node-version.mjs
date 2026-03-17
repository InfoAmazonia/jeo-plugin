#!/usr/bin/env node

const major = Number.parseInt( process.versions.node.split( '.' )[ 0 ], 10 );
const supportedMajors = new Set( [ 20, 24 ] );

if ( ! supportedMajors.has( major ) ) {
	console.error(
		`Unsupported Node.js ${ process.versions.node }. ` +
			'Use Node 24 as the project default or Node 20 during the transition window.'
	);
	process.exit( 1 );
}

if ( major === 20 ) {
	console.warn(
		`Node.js ${ process.versions.node } is accepted as a transition runtime. ` +
			'Node 24 is the preferred default for this repository.'
	);
} else {
	console.log( `Node.js ${ process.versions.node } matches the preferred project runtime.` );
}
