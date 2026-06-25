const baseConfig = require( '@wordpress/scripts/config/jest-unit.config' );

module.exports = {
	...baseConfig,
	transformIgnorePatterns: [
		'/node_modules/(?!.*(uuid|eta/dist/core\\.js|@rjsf/.+|@x0k/json-schema-merge/.+|marked))',
	],
};
