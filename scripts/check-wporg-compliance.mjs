import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '..' );
const SRC_DIR = path.join( ROOT, 'src' );
const README_FILE = path.join( SRC_DIR, 'readme.txt' );
const TEXT_EXTENSIONS = new Set( [
	'.css',
	'.ejs',
	'.js',
	'.json',
	'.map',
	'.md',
	'.php',
	'.po',
	'.scss',
	'.svg',
	'.txt',
	'.xml',
] );
const FORBIDDEN_PATTERNS = [
	{
		label: 'curl usage',
		pattern: /\bcurl_(?:init|exec|setopt|close|multi_exec|copy)\b/i,
	},
	{
		label: 'raw.githubusercontent.com',
		pattern: /raw\.githubusercontent\.com/i,
	},
	{
		label: 'fonts.openmaptiles.org',
		pattern: /fonts\.openmaptiles\.org/i,
	},
];

function listFiles( dir ) {
	return fs.readdirSync( dir, { withFileTypes: true } ).flatMap( ( entry ) => {
		const fullPath = path.join( dir, entry.name );

		if ( entry.isDirectory() ) {
			return listFiles( fullPath );
		}

		return [ fullPath ];
	} );
}

function fail( message ) {
	console.error( `WordPress.org compliance check failed: ${ message }` );
	process.exit( 1 );
}

const readme = fs.readFileSync( README_FILE, 'utf8' );
if ( ! /^== Third Party Services ==$/m.test( readme ) ) {
	fail( 'src/readme.txt is missing the "Third Party Services" section.' );
}

for ( const file of listFiles( SRC_DIR ) ) {
	if ( ! TEXT_EXTENSIONS.has( path.extname( file ) ) ) {
		continue;
	}

	const contents = fs.readFileSync( file, 'utf8' );

	for ( const forbidden of FORBIDDEN_PATTERNS ) {
		if ( forbidden.pattern.test( contents ) ) {
			fail( `${ forbidden.label } found in ${ path.relative( ROOT, file ) }.` );
		}
	}
}

console.log( 'WordPress.org compliance checks passed.' );
