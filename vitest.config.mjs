import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

// Sources keep JSX in `.js` files (the webpack build compiles them through
// @wordpress/babel-preset-default). plugin-react-swc decides its parser by
// extension and skips plain `.js` by default, so override the decision with
// the `parserConfig` callback: our `.js` sources parse with JSX enabled.
// See the Vitest migration guide shipped with @wordpress/scripts
// (docs/vitest-migration.md).
const parserConfig = ( id ) => {
	if ( id.endsWith( '.tsx' ) ) {
		return { syntax: 'typescript', tsx: true };
	}
	if ( id.endsWith( '.ts' ) || id.endsWith( '.mts' ) ) {
		return { syntax: 'typescript', tsx: false };
	}
	if ( /\.(js|mjs|jsx|mdx)$/.test( id ) ) {
		return { syntax: 'ecmascript', jsx: true };
	}
	return undefined;
};

export default defineConfig( {
	plugins: [ react( { parserConfig } ) ],
	test: {
		environment: 'jsdom',
		// Inline the WordPress packages so their ESM builds go through the Vite
		// pipeline instead of Node's native ESM loader (which requires JSON
		// import attributes that the packages' internal `.json` imports lack).
		server: {
			deps: {
				inline: [ /@wordpress\// ],
			},
		},
		globals: true,
		restoreMocks: true,
		include: [
			'src/js/src/**/*.test.{js,jsx,mjs,cjs}',
			'src/includes/layer-types/*.test.{js,jsx,mjs,cjs}',
		],
	},
} );
