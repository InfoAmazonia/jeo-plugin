import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '..' );
const PLUGIN_FILE = path.join( ROOT, 'src', 'jeo.php' );
const README_FILE = path.join( ROOT, 'src', 'readme.txt' );

function fail( message ) {
	console.error( `Release metadata validation failed: ${ message }` );
	process.exit( 1 );
}

function extract( content, pattern, label ) {
	const match = content.match( pattern );
	if ( ! match ) {
		fail( `Unable to find ${ label }.` );
	}

	return match[ 1 ].trim();
}

function isStableVersion( value ) {
	return /^\d+\.\d+\.\d+$/.test( value );
}

const pluginContents = fs.readFileSync( PLUGIN_FILE, 'utf8' );
const readmeContents = fs.readFileSync( README_FILE, 'utf8' );

const headerVersion = extract( pluginContents, /^\s*\*\s+Version:\s+(.+)$/m, 'plugin header version' );
const constantVersion = extract(
	pluginContents,
	/define\(\s*'JEO_VERSION',\s*'([^']+)'\s*\)/,
	'JEO_VERSION constant'
);
const stableTag = extract( readmeContents, /^Stable tag:\s*(.+)$/mi, 'readme stable tag' );
const readmeVersionMatch = readmeContents.match( /^Version:\s*(.+)$/mi );
const releaseTag = process.env.GITHUB_REF_NAME || process.env.RELEASE_TAG || '';

if ( headerVersion !== constantVersion ) {
	fail( `Plugin header version (${ headerVersion }) does not match JEO_VERSION (${ constantVersion }).` );
}

if ( readmeVersionMatch && readmeVersionMatch[ 1 ].trim() !== headerVersion ) {
	fail(
		`src/readme.txt version (${ readmeVersionMatch[ 1 ].trim() }) does not match src/jeo.php version (${ headerVersion }).`
	);
}

if ( stableTag !== headerVersion ) {
	fail( `Stable tag (${ stableTag }) must match src/jeo.php version (${ headerVersion }).` );
}

if ( ! isStableVersion( headerVersion ) ) {
	fail( `Plugin version ${ headerVersion } is not a stable x.y.z release.` );
}

if ( releaseTag ) {
	if ( ! isStableVersion( releaseTag ) ) {
		fail( `Git tag ${ releaseTag } is not a stable x.y.z release tag.` );
	}

	if ( releaseTag !== headerVersion ) {
		fail( `Git tag ${ releaseTag } does not match plugin version ${ headerVersion }.` );
	}
}

console.log( `Release metadata is valid for ${ headerVersion }.` );
