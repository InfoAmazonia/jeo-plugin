import { memo } from '@wordpress/element';
import { isEqual } from 'lodash-es';

import { mapboxToken } from '../lib/mapgl-loader';
import { Layer, Source } from '../lib/mapgl-react';
import { resolveTileUrl } from '../shared/styles';

const MAPBOX_RASTER_ATTRIBUTION =
	'&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> ' +
	'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
	'<a href="https://www.mapbox.com/map-feedback/">Improve this map</a>';

export function renderLayer( { layer, instance } ) {
	if ( [ 'swappable', 'switchable' ].includes( instance.use ) && ! instance.default ) {
		return null;
	}

	const options = layer.layer_type_options;
	const layerId = `layer_${ instance.id }`;
	const sourceId = `source_${ instance.id }`;

	const resolveStyle = ( inst, ly ) => {
		if ( inst.style?.use_default && ly.default_style ) {
			return ly.default_style;
		}
		return inst.style || {};
	};

	switch ( layer.type ) {
		case 'mapbox': {
			const accessToken = options.access_token || mapboxToken;

			const styleId = options.style_id?.replace( 'mapbox://styles/', '' );
			const styleUrl = `https://api.mapbox.com/styles/v1/${ styleId }/tiles/512/{z}/{x}/{y}@2x?access_token=${ accessToken }`

			return (
				<Source
					key={ styleUrl }
					id={ sourceId }
					type="raster"
					tiles={ [ styleUrl ] }
					attribution={ MAPBOX_RASTER_ATTRIBUTION }
				>
					<Layer id={ layerId } type="raster" />
				</Source>
			);
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
			const effectiveStyle = resolveStyle( instance, layer );

			return (
				<Source key={ tilesetUrl } id={ sourceId } type={ options.style_source_type } url={ tilesetUrl }>
					<Layer id={ layerId } type={ options.type } source-layer={ options.source_layer } filter={ effectiveStyle.filter } paint={ effectiveStyle.paint } layout={ effectiveStyle.layout } />
				</Source>
			);
		}

		case 'mvt': {
			const effectiveStyle = resolveStyle( instance, layer );

			return (
				<Source key={ options.url } id={ sourceId } type={ options.style_source_type } tiles={ [ options.url ] }>
					<Layer id={ layerId } type={ options.type } source-layer={ options.source_layer } filter={ effectiveStyle.filter } paint={ effectiveStyle.paint } layout={ effectiveStyle.layout } />
				</Source>
			);
		}

		case 'tilelayer': {
			return (
				<Source id={ sourceId } type="raster" tiles={ [ resolveTileUrl( options.url ) ] } tileSize={ 256 } scheme={ options.scheme || 'xyz' }>
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
	) && isEqual(
		props.layer.default_style,
		prevProps.layer.default_style
	) && isEqual(
		props.instance.style,
		prevProps.instance.style
	);
} );
