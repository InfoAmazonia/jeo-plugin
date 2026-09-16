#!/usr/bin/env node
//
// Validates that the active Node.js runtime matches the major version required
// by package.json `devEngines` (Node 24.x). npm itself errors with
// EBADDEVENGINES on other majors, so this gives a clearer message before any
// install/build step runs. The build scripts switch to Node 24 via nvm before
// calling this, so reaching the failure path here means the switch did not take.
//
// Exits 0 when the runtime is acceptable, 1 otherwise.

const REQUIRED_MAJOR = 24;

const current = process.versions.node;
const major = Number.parseInt( current.split( '.' )[ 0 ], 10 );

if ( major !== REQUIRED_MAJOR ) {
	console.error(
		`✖ Node ${ REQUIRED_MAJOR }.x is required, but the active runtime is v${ current }.\n` +
			`  Run "nvm use ${ REQUIRED_MAJOR }" (or "nvm install ${ REQUIRED_MAJOR }") and retry.`
	);
	process.exit( 1 );
}

console.log( `✔ Node v${ current } satisfies the Node ${ REQUIRED_MAJOR }.x requirement.` );
