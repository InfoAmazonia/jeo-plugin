const baseConfig = require( '@wordpress/scripts/config/jest-unit.config' );

module.exports = {
	...baseConfig,
	transform: {
		...baseConfig.transform,
		'\\.mjsx?$': require.resolve(
			'@wordpress/scripts/config/babel-transform'
		),
	},
	transformIgnorePatterns: [
		'/node_modules/(?!.*(uuid|eta/dist/core\\.js|@rjsf/.+|@x0k/json-schema-merge/.+|marked|lodash-es|@wordpress/(ui|theme)/.+))',
	],
};
