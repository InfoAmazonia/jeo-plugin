import { Fragment } from '@wordpress/element';
import { Layer, Source } from 'react-mapbox-gl';

export function renderLayer( layer, instance ) {
	if ( [ 'swappable', 'switchable' ].includes( instance.use ) && ! instance.default ) {
		return null;
	}

	const options = layer.layer_type_options;
	const layerId = `layer_${ instance.id }`;
	const sourceId = `source_${ instance.id }`;
	if ( ! options.source_layer || ! options.url ) {
		return;
	}

	switch ( layer.type ) {
		case 'mapbox':
			const accessToken = options.access_token || window.mapboxgl.accessToken;

			return (
				<Fragment>
					<Source
						id={ sourceId }
						tileJsonSource={ {
							type: 'raster',
							tiles: [
								`https://api.mapbox.com/styles/v1/${ options.style_id }/tiles/256/{z}/{x}/{y}@2x?access_token=${ accessToken }`,
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
		case 'mapbox-tileset':
			console.log(options.source_layer)
			return (
				<Fragment>
					<Source
						id={ sourceId }
						tileJsonSource={ {
							type: 'vector',
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
