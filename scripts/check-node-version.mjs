#!/usr/bin/env node

const major = Number.parseInt( process.versions.node.split( '.' )[ 0 ], 10 );
const supportedMajors = new Set( [ 24 ] );

if ( ! supportedMajors.has( major ) ) {
	console.error(
		`Unsupported Node.js ${ process.versions.node }. ` +
			'Use Node 24 as the project runtime for this repository.'
	);
	process.exit( 1 );
}

console.log( `Node.js ${ process.versions.node } matches the supported project runtime.` );
