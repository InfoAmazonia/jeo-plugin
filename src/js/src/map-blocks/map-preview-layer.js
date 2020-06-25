import { Fragment } from '@wordpress/element';
import { Layer, Source } from 'react-mapbox-gl';

export function renderLayer( layer, instance ) {
	if ( [ 'swappable', 'switchable' ].includes( instance.use ) && ! instance.default ) {
		return null;
	}

	const options = layer.layer_type_options;
	const layerId = `layer_${ instance.id }`;
	const sourceId = `source_${ instance.id }`;

	switch ( layer.type ) {
		case 'mapbox':
			const accessToken = options.access_token || window.mapboxgl.accessToken;

			let style_id = options.style_id;
			if ( style_id ) {
				style_id = style_id.replace( 'mapbox://styles/', '' );
			}

			return (
				<Fragment>
					<Source
						id={ sourceId }
						tileJsonSource={ {
							type: 'raster',
							tiles: [
								`https://api.mapbox.com/styles/v1/${ style_id }/tiles/256/{z}/{x}/{y}@2x?access_token=${ accessToken }`,
							],
						} }
					/>
					<Layer
						id={ layerId }
						type="raster"
						sourceId={ sourceId }
					/>
				</Fragment>
			);
		case 'mapbox-tileset-vector':
		case 'mapbox-tileset-raster':
			console.log(layer);
			let tileset_id = options.tileset_id;

			if ( tileset_id && ! tileset_id.includes( 'mapbox://' ) ) {
				tileset_id = 'mapbox://' + tileset_id;
			}

			return (
				<Fragment>
					<Source
						id={ sourceId }
						tileJsonSource={ {
							type: options.style_source_type,
							url: `mapbox://${ options.tileset_id }`,
						} }
					/>
					<Layer
						id={ layerId }
						type={ options.type }
						sourceId={ sourceId }
						sourceLayer={ options.source_layer }
					/>
				</Fragment>
			);
		case 'mvt':
			return (
				<Fragment>
					<Source
						id={ sourceId }
						tileJsonSource={ {
							type: 'vector',
							tiles: [ options.url ],
						} }
					/>
					<Layer
						id={ layerId }
						type={ options.type }
						source={ sourceId }
						sourceLayer={ options.source_layer }
					/>
				</Fragment>
			);
		case 'tilelayer':
			return (
				<Fragment>
					<Source
						id={ sourceId }
						tileJsonSource={ {
							type: 'raster',
							tiles: [ options.url ],
							tileSize: 256,
						} }
					/>
					<Layer
						id={ layerId }
						type="raster"
						sourceId={ sourceId }
					/>
				</Fragment>
			);
		default:
			return null;
	}
}
