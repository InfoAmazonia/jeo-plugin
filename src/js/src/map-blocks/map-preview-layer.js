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

			if ( ! sourceId || ! layerId ) {
				return;
			}

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
		case 'mapbox-tileset':
			if ( ! sourceId || ! layerId || ! options.type || ! options.source_layer || ! options.tileset_id ) {
				return;
			}

			let tileset_id = options.tileset_id;

			if ( tileset_id && ! tileset_id.includes( 'mapbox://' ) ) {
				tileset_id = 'mapbox://' + tileset_id;
			}

			return (
				<Fragment>
					<Source
						id={ sourceId }
						tileJsonSource={ {
							type: 'vector',
							url: tileset_id,
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
			if ( ! sourceId || ! options.url || ! layerId || ! options.type || ! options.source_layer ) {
				return;
			}

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
			if ( ! sourceId || ! options.url || ! layerId ) {
				return;
			}

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
