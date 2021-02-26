import { Fragment } from '@wordpress/element';
import { Layer, Source } from 'react-mapbox-gl';
import { memo } from '@wordpress/element';
import { isEqual } from 'lodash-es';

export function renderLayer( { layer, instance, onSourceLoadedCallback } ) {
	if (
		[ 'swappable', 'switchable' ].includes( instance.use ) &&
		! instance.default
	) {
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
								`https://api.mapbox.com/styles/v1/${ style_id }/tiles/512/{z}/{x}/{y}@2x?access_token=${ accessToken }`,
							],
						} }
						onSourceLoaded={ () => {
							if ( onSourceLoadedCallback ) {
								onSourceLoadedCallback();
							}
						} }
					/>
					<Layer id={ layerId } type="raster" sourceId={ sourceId } />
				</Fragment>
			);
		case 'mapbox-tileset-vector':
		case 'mapbox-tileset-raster':
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
						onSourceLoaded={ () => {
							if ( onSourceLoadedCallback ) {
								onSourceLoadedCallback();
							}
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
							type: options.style_source_type,
							tiles: [ options.url ],
						} }
						onSourceLoaded={ () => {
							if ( onSourceLoadedCallback ) {
								onSourceLoadedCallback();
							}
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
						onSourceLoaded={ () => {
							if ( onSourceLoadedCallback ) {
								onSourceLoadedCallback();
							}
						} }
					/>
					<Layer id={ layerId } type="raster" sourceId={ sourceId } />
				</Fragment>
			);
		default:
			return null;
	}
}

export const MemoizedRenderLayer = memo( renderLayer, ( props, prevProps ) => {
	return isEqual(
		props.layer.layer_type_options,
		prevProps.layer.layer_type_options
	);
} );
