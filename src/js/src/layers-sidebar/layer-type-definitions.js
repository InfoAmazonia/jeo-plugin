import { __ } from '@wordpress/i18n';

export const coreLayerTypeOptions = [
	{ label: __( 'Mapbox Style', 'jeo' ), value: 'mapbox' },
	{
		label: __( 'Vector Mapbox Tiled Source', 'jeo' ),
		value: 'mapbox-tileset-vector',
	},
	{
		label: __( 'Raster Mapbox Tiled Source', 'jeo' ),
		value: 'mapbox-tileset-raster',
	},
	{ label: __( 'Raster Tiled Source', 'jeo' ), value: 'tilelayer' },
	{ label: __( 'Mapbox Vector Tiles (MVT)', 'jeo' ), value: 'mvt' },
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
						title: __( 'Style ID', 'jeo' ),
						description: __(
							'The Mapbox Style ID includes the user name and id. Example: username/id or mapbox://styles/username/id',
							'jeo'
						),
					},
					access_token: {
						type: 'string',
						title: __( 'Access token', 'jeo' ),
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
						title: __( 'URL', 'jeo' ),
					},
					scheme: {
						type: 'string',
						title: __( 'Scheme', 'jeo' ),
						description: __(
							'Influences the Y direction of the tile coordinates.',
							'jeo'
						),
						enum: [ 'xyz', 'tms' ],
						enumNames: [
							__( 'Slippy Map tilenames (XYZ)', 'jeo' ),
							__( 'OSGeo spec (TMS)', 'jeo' ),
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
						title: __( 'URL', 'jeo' ),
					},
					source_layer: {
						type: 'string',
						title: __( 'Source layer', 'jeo' ),
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
						title: __( 'Style Source Type', 'jeo' ),
						description: __( 'Which data the map should display', 'jeo' ),
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
						title: __( 'Tileset ID', 'jeo' ),
						description: __( 'Example: username.tilesetid', 'jeo' ),
					},
					style_source_type: {
						title: __( 'Style Source Type', 'jeo' ),
						description: __( 'Which data the map should display', 'jeo' ),
						type: 'string',
						default: 'raster',
						enum: [ 'raster', 'raster-dem' ],
					},
					type: {
						title: __( 'Layer Type', 'jeo' ),
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
						title: __( 'Tileset ID', 'jeo' ),
						description: __( 'Example: username.tilesetid', 'jeo' ),
					},
					source_layer: {
						type: 'string',
						title: __( 'Source layer', 'jeo' ),
						description: __( 'Which data the map should display.', 'jeo' ),
					},
					type: {
						title: __( 'Layer Type', 'jeo' ),
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
						title: __( 'Style Source Type', 'jeo' ),
						description: __( 'The layer source type style', 'jeo' ),
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
