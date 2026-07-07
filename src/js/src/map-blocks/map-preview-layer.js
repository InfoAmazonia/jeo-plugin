import { memo } from '@wordpress/element';
import { isEqual } from 'lodash-es';

import { Layer, Source } from '../lib/mapgl-react';
import { resolveTileUrl } from '../shared/styles';

export function renderLayer( { layer, instance } ) {
	if ( instance.load_as_style ) {
		return null;
	}

	if ( [ 'swappable', 'switchable' ].includes( instance.use ) && ! instance.default ) {
		return null;
	}

	if ( instance.load_as_style ) {
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

	const applyOpacity = ( style, opacity ) => {
		if ( typeof opacity !== 'number' || opacity >= 1 ) {
			return style;
		}

		const paint = style.paint ? { ...style.paint } : {};
		const opacity_props = [
			'fill-opacity',
			'line-opacity',
			'circle-opacity',
			'symbol-opacity',
			'raster-opacity',
			'heatmap-opacity',
			'fill-extrusion-opacity',
		];

		opacity_props.forEach( ( prop ) => {
			if ( typeof paint[ prop ] === 'number' ) {
				paint[ prop ] = paint[ prop ] * opacity;
			}
		} );

		return { ...style, paint };
	};

	switch ( layer.type ) {
		case 'mapbox': {
			return null;
		}

		case 'mapbox-tileset-raster': {
			const tilesetId = options.tileset_id ?? '';
			const tilesetUrl = tilesetId.includes( 'mapbox://' ) ? tilesetId : `mapbox://${ tilesetId }`;
			const opacity = typeof instance.opacity === 'number' ? instance.opacity : 1;

			return (
				<Source key={ tilesetUrl } id={ sourceId } type={ options.style_source_type } url={ tilesetUrl }>
					<Layer id={ layerId } type={ options.type } paint={ { 'raster-opacity': opacity } } />
				</Source>
			);
		}

		case 'mapbox-tileset-vector': {
			const tilesetId = options.tileset_id ?? '';
			const tilesetUrl = tilesetId.includes( 'mapbox://' ) ? tilesetId : `mapbox://${ tilesetId }`;
			const effectiveStyle = applyOpacity( resolveStyle( instance, layer ), instance.opacity );

			return (
				<Source key={ tilesetUrl } id={ sourceId } type={ options.style_source_type } url={ tilesetUrl }>
					<Layer id={ layerId } type={ options.type } source-layer={ options.source_layer } filter={ effectiveStyle.filter } paint={ effectiveStyle.paint } layout={ effectiveStyle.layout } />
				</Source>
			);
		}

		case 'mvt': {
			const effectiveStyle = applyOpacity( resolveStyle( instance, layer ), instance.opacity );

			return (
				<Source key={ options.url } id={ sourceId } type={ options.style_source_type } tiles={ [ options.url ] }>
					<Layer id={ layerId } type={ options.type } source-layer={ options.source_layer } filter={ effectiveStyle.filter } paint={ effectiveStyle.paint } layout={ effectiveStyle.layout } />
				</Source>
			);
		}

		case 'tilelayer': {
			const opacity = typeof instance.opacity === 'number' ? instance.opacity : 1;
			return (
				<Source id={ sourceId } type="raster" tiles={ [ resolveTileUrl( options.url ) ] } tileSize={ 256 } scheme={ options.scheme || 'xyz' }>
					<Layer id={ layerId } type="raster" paint={ { 'raster-opacity': opacity } } />
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
