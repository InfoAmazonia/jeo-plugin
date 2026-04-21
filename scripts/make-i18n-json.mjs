import { spawnSync } from 'node:child_process';

const WP_CLI_BIN = process.env.WP_CLI_BIN || 'wp';
const args = [ 'i18n', 'make-json', 'src/languages', '--no-purge' ];

const result = spawnSync( WP_CLI_BIN, args, {
	stdio: 'inherit',
	shell: process.platform === 'win32',
} );

if ( result.error ) {
	if ( result.error.code === 'ENOENT' ) {
		console.error(
			[
				'Unable to run WP-CLI.',
				`Expected "${ WP_CLI_BIN }" to be available on PATH, or set WP_CLI_BIN explicitly.`,
				'Install WP-CLI before running npm run i18n:json or npm run build:release.',
			].join( ' ' )
		);
		process.exit( 1 );
	}

	throw result.error;
}

process.exit( result.status ?? 1 );
