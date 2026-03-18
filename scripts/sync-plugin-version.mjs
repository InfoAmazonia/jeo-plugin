import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '..' );
const PLUGIN_FILE = path.join( ROOT, 'src', 'jeo.php' );
const PACKAGE_JSON_FILE = path.join( ROOT, 'package.json' );
const PACKAGE_LOCK_FILE = path.join( ROOT, 'package-lock.json' );
const TRANSLATION_FILES = [
	path.join( ROOT, 'src', 'languages', 'jeo.pot' ),
	path.join( ROOT, 'src', 'languages', 'jeo-pt_BR.po' ),
	path.join( ROOT, 'src', 'languages', 'jeo-es_ES.po' ),
];

function fail( message ) {
	console.error( `Version sync failed: ${ message }` );
	process.exit( 1 );
}

function extract( content, pattern, label ) {
	const match = content.match( pattern );
	if ( ! match ) {
		fail( `Unable to find ${ label }.` );
	}

	return match[ 1 ].trim();
}

const pluginContents = fs.readFileSync( PLUGIN_FILE, 'utf8' );
const headerVersion = extract( pluginContents, /^\s*\*\s+Version:\s+(.+)$/m, 'plugin header version' );
const constantVersion = extract(
	pluginContents,
	/define\(\s*'JEO_VERSION',\s*'([^']+)'\s*\)/,
	'JEO_VERSION constant'
);

if ( headerVersion !== constantVersion ) {
	fail( `Plugin header version (${ headerVersion }) does not match JEO_VERSION (${ constantVersion }).` );
}

const packageJson = JSON.parse( fs.readFileSync( PACKAGE_JSON_FILE, 'utf8' ) );
packageJson.version = headerVersion;
fs.writeFileSync( PACKAGE_JSON_FILE, `${ JSON.stringify( packageJson, null, '\t' ) }\n` );

const packageLock = JSON.parse( fs.readFileSync( PACKAGE_LOCK_FILE, 'utf8' ) );
packageLock.version = headerVersion;

if ( ! packageLock.packages?.[''] ) {
	fail( 'Unable to find the root package entry in package-lock.json.' );
}

packageLock.packages[''].version = headerVersion;
fs.writeFileSync( PACKAGE_LOCK_FILE, `${ JSON.stringify( packageLock, null, '\t' ) }\n` );

for ( const file of TRANSLATION_FILES ) {
	const contents = fs.readFileSync( file, 'utf8' );
	let matched = false;
	const nextContents = contents.replace(
		/"Project-Id-Version:\s*.+\\n"/,
		() => {
			matched = true;
			return `"Project-Id-Version: JEO ${ headerVersion }\\n"`;
		}
	);

	if ( ! matched ) {
		fail( `Unable to update Project-Id-Version in ${ path.relative( ROOT, file ) }.` );
	}

	if ( contents !== nextContents ) {
		fs.writeFileSync( file, nextContents );
	}
}

console.log( `Synchronized package manifests and translation headers to ${ headerVersion }.` );
