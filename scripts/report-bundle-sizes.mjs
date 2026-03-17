#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const buildDir = path.resolve( 'src/js/build' );
const budgetByEntry = {
	mapboxglReact: 1800,
	mapboxglLoader: 1750,
	mapBlocks: 1150,
	maplibreglReact: 1100,
	maplibreglLoader: 1100,
	layersSidebar: 360,
	discovery: 280,
	mapsSidebar: 240,
	postsSidebar: 190,
	jeoMap: 120,
	jeoStorymap: 40,
};

const bundleEntries = Object.entries( budgetByEntry ).map( ( [ name, budgetKb ] ) => {
	const filename = path.join( buildDir, `${ name }.js` );
	if ( ! fs.existsSync( filename ) ) {
		return {
			name,
			sizeKb: null,
			budgetKb,
			missing: true,
		};
	}

	const sizeKb = Math.ceil( fs.statSync( filename ).size / 1024 );

	return {
		name,
		sizeKb,
		budgetKb,
		missing: false,
	};
} );

const failures = bundleEntries.filter(
	( bundle ) => bundle.missing || bundle.sizeKb > bundle.budgetKb
);

console.log( 'Bundle size report (KB):' );
bundleEntries.forEach( ( bundle ) => {
	if ( bundle.missing ) {
		console.log( `- ${ bundle.name }: missing (budget ${ bundle.budgetKb })` );
		return;
	}

	console.log( `- ${ bundle.name }: ${ bundle.sizeKb } / ${ bundle.budgetKb }` );
} );

if ( failures.length ) {
	console.error( '\nBundle budget check failed.' );
	process.exit( 1 );
}
