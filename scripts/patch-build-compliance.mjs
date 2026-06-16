import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '..' );
const BUILD_DIR = path.join( ROOT, 'src', 'js', 'build' );
const BUILD_SOURCE_MAP_EXTENSION = '.map';
const TEXT_EXTENSIONS = new Set( [ '.css', '.js', '.json', '.php', '.svg', '.txt' ] );
const REPLACEMENTS = [
	{
		search: /https:\/\/raw\.githubusercontent\.com\/ajv-validator\/ajv\/master\/lib\/refs\/([^"'`]+?)(?=[#"'`])/g,
		replace: 'urn:jeo:ajv:$1',
	},
	{
		search: /https:\/\/raw\.githubusercontent\.com\/ajv-validator\/ajv\/master\/lib\/refs\/([^"'`]+)/g,
		replace: 'urn:jeo:ajv:$1',
	},
];

function listFiles( dir ) {
	if ( ! fs.existsSync( dir ) ) {
		return [];
	}

	return fs.readdirSync( dir, { withFileTypes: true } ).flatMap( ( entry ) => {
		const fullPath = path.join( dir, entry.name );

		if ( entry.isDirectory() ) {
			return listFiles( fullPath );
		}

		return [ fullPath ];
	} );
}

let filesPatched = 0;
let sourceMapsRemoved = 0;

for ( const file of listFiles( BUILD_DIR ) ) {
	if ( path.extname( file ) === BUILD_SOURCE_MAP_EXTENSION ) {
		fs.unlinkSync( file );
		sourceMapsRemoved += 1;
		continue;
	}

	if ( ! TEXT_EXTENSIONS.has( path.extname( file ) ) ) {
		continue;
	}

	const original = fs.readFileSync( file, 'utf8' );
	let updated = original;

	for ( const replacement of REPLACEMENTS ) {
		updated = updated.replace( replacement.search, replacement.replace );
	}

	if ( updated === original ) {
		continue;
	}

	fs.writeFileSync( file, updated );
	filesPatched += 1;
}

if ( filesPatched > 0 ) {
	console.log( `Patched WordPress.org compliance references in ${ filesPatched } build file(s).` );
}

if ( sourceMapsRemoved > 0 ) {
	console.log( `Removed ${ sourceMapsRemoved } stale build source map(s).` );
}
