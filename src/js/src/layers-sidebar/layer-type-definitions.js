import { __ } from '@wordpress/i18n';

export const coreLayerTypeOptions = [
	{ label: __( 'Mapbox Style', 'jeowp' ), value: 'mapbox' },
	{
		label: __( 'Vector Mapbox Tiled Source', 'jeowp' ),
		value: 'mapbox-tileset-vector',
	},
	{
		label: __( 'Raster Mapbox Tiled Source', 'jeowp' ),
		value: 'mapbox-tileset-raster',
	},
	{ label: __( 'Raster Tiled Source', 'jeowp' ), value: 'tilelayer' },
	{ label: __( 'Mapbox Vector Tiles (MVT)', 'jeowp' ), value: 'mvt' },
];

function getFallbackLayerTypeSchema( attributes = {} ) {
	switch ( attributes.type ) {
		case 'mapbox':
			return {
				type: 'object',
				required: [ 'style_id' ],
				properties: {
					style_id: {
						type: 'string',
						title: __( 'Style ID', 'jeowp' ),
						description: __(
							'The Mapbox Style ID includes the user name and id. Example: username/id or mapbox://styles/username/id',
							'jeo'
						),
					},
					access_token: {
						type: 'string',
						title: __( 'Access token', 'jeowp' ),
						description: __(
							'Optional. If this layer needs a different access token from the one set in Settings, inform it here.',
							'jeo'
						),
					},
				},
			};
		case 'tilelayer':
			return {
				type: 'object',
				required: [ 'url' ],
				properties: {
					url: {
						type: 'string',
						title: __( 'URL', 'jeowp' ),
					},
					scheme: {
						type: 'string',
						title: __( 'Scheme', 'jeowp' ),
						description: __(
							'Influences the Y direction of the tile coordinates.',
							'jeo'
						),
						enum: [ 'xyz', 'tms' ],
						enumNames: [
							__( 'Slippy Map tilenames (XYZ)', 'jeowp' ),
							__( 'OSGeo spec (TMS)', 'jeowp' ),
						],
						default: 'xyz',
					},
				},
			};
		case 'mvt':
			return {
				type: 'object',
				required: [ 'url', 'type', 'source_layer' ],
				properties: {
					url: {
						type: 'string',
						title: __( 'URL', 'jeowp' ),
					},
					source_layer: {
						type: 'string',
						title: __( 'Source layer', 'jeowp' ),
						description: __(
							'Layer to use from a vector tile source.',
							'jeo'
						),
					},
					type: {
						type: 'string',
						default: 'fill',
						enum: [
							'fill',
							'line',
							'symbol',
							'circle',
							'heatmap',
							'fill-extrusion',
							'hillshade',
							'background',
						],
					},
					style_source_type: {
						title: __( 'Style Source Type', 'jeowp' ),
						description: __( 'Which data the map should display', 'jeowp' ),
						type: 'string',
						default: 'vector',
						disabled: true,
					},
				},
			};
		case 'mapbox-tileset-raster':
			return {
				type: 'object',
				required: [ 'tileset_id', 'style_source_type', 'type' ],
				properties: {
					tileset_id: {
						type: 'string',
						title: __( 'Tileset ID', 'jeowp' ),
						description: __( 'Example: username.tilesetid', 'jeowp' ),
					},
					style_source_type: {
						title: __( 'Style Source Type', 'jeowp' ),
						description: __( 'Which data the map should display', 'jeowp' ),
						type: 'string',
						default: 'raster',
						enum: [ 'raster', 'raster-dem' ],
					},
					type: {
						title: __( 'Layer Type', 'jeowp' ),
						description: __(
							'Layers take the data that they get from a source, optionally filter features, and then define how those features are styled.',
							'jeo'
						),
						type: 'string',
						default: 'raster',
						disabled: true,
					},
				},
			};
		case 'mapbox-tileset-vector':
			return {
				type: 'object',
				required: [ 'tileset_id', 'style_source_type', 'type', 'source_layer' ],
				properties: {
					tileset_id: {
						type: 'string',
						title: __( 'Tileset ID', 'jeowp' ),
						description: __( 'Example: username.tilesetid', 'jeowp' ),
					},
					source_layer: {
						type: 'string',
						title: __( 'Source layer', 'jeowp' ),
						description: __( 'Which data the map should display.', 'jeowp' ),
					},
					type: {
						title: __( 'Layer Type', 'jeowp' ),
						description: __(
							'Layers take the data that they get from a source, optionally filter features, and then define how those features are styled.',
							'jeo'
						),
						type: 'string',
						default: 'fill',
						enum: [
							'fill',
							'line',
							'symbol',
							'circle',
							'heatmap',
							'fill-extrusion',
							'hillshade',
							'background',
						],
					},
					style_source_type: {
						title: __( 'Style Source Type', 'jeowp' ),
						description: __( 'The layer source type style', 'jeowp' ),
						type: 'string',
						default: 'vector',
						disabled: true,
					},
				},
			};
		default:
			return null;
	}
}

export function getEditorLayerTypeSchema( attributes = {} ) {
	const runtimeSchema = window.JeoLayerTypes?.getLayerTypeSchema?.( attributes );

	if ( runtimeSchema ) {
		return runtimeSchema;
	}

	return getFallbackLayerTypeSchema( attributes );
}
