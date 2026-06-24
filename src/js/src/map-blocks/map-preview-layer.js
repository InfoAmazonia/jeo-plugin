import { memo } from '@wordpress/element';
import { isEqual } from 'lodash-es';

import { Layer, Source } from '../lib/mapgl-react';

export function renderLayer( { layer, instance } ) {
	if ( [ 'swappable', 'switchable' ].includes( instance.use ) && ! instance.default ) {
		return null;
	}

	const options = layer.layer_type_options;
	const layerId = `layer_${ instance.id }`;
	const sourceId = `source_${ instance.id }`;

	switch ( layer.type ) {
		case 'mapbox': {
			return null;
		}

		case 'mapbox-tileset-raster': {
			const tilesetId = options.tileset_id ?? '';
			const tilesetUrl = tilesetId.includes( 'mapbox://' ) ? tilesetId : `mapbox://${ tilesetId }`;

			return (
				<Source key={ tilesetUrl } id={ sourceId } type={ options.style_source_type } url={ tilesetUrl }>
					<Layer id={ layerId } type={ options.type } />
				</Source>
			);
		}

		case 'mapbox-tileset-vector': {
			const tilesetId = options.tileset_id ?? '';
			const tilesetUrl = tilesetId.includes( 'mapbox://' ) ? tilesetId : `mapbox://${ tilesetId }`;

			return (
				<Source key={ tilesetUrl } id={ sourceId } type={ options.style_source_type } url={ tilesetUrl }>
					<Layer id={ layerId } type={ options.type } source-layer={ options.source_layer } />
				</Source>
			);
		}

		case 'mvt': {
			return (
				<Source key={ options.url } id={ sourceId } type={ options.style_source_type } tiles={ [ options.url ] }>
					<Layer id={ layerId } type={ options.type } source-layer={ options.source_layer } />
				</Source>
			);
		}

		case 'tilelayer': {
			return (
				<Source id={ sourceId } type="raster" tiles={ [ options.url ] } tileSize={ 256 } scheme={ options.scheme || 'xyz' }>
					<Layer id={ layerId } type="raster" />
				</Source>
			);
		}

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
