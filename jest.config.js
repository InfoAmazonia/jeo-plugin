const baseConfig = require( '@wordpress/scripts/config/jest-unit.config' );

module.exports = {
	...baseConfig,
	transform: {
		...baseConfig.transform,
		// @wordpress/theme ships ESM-only (.mjs); transform it so Jest can require it.
		'\\.mjs$': require.resolve( '@wordpress/scripts/config/babel-transform' ),
	},
	transformIgnorePatterns: [
		'/node_modules/(?!.*(uuid|eta/dist/core\\.js|@rjsf/.+|@x0k/json-schema-merge/.+|marked|lodash-es|@wordpress/theme/))',
	],
};
