import { memo } from '@wordpress/element';
import { isEqual } from 'lodash-es';

import { Layer, Source } from '../lib/mapgl-react';
import { isStyleLayerType } from '../shared/style-layer-types';
import { resolveTileUrl } from '../shared/styles';

export function getStyleProps( style = {} ) {
	const props = {};

	if ( style.filter !== undefined ) {
		props.filter = style.filter;
	}
	if ( style.paint !== undefined ) {
		props.paint = style.paint;
	}
	if ( style.layout !== undefined ) {
		props.layout = style.layout;
	}

	return props;
}

export function renderLayer( { layer, instance } ) {
	if ( instance.load_as_style ) {
		return null;
	}

	// Style types (mapbox, style-json, …) render as the map's base style,
	// hoisted via findStyleLayer — never as individual GL layers.
	if ( isStyleLayerType( layer.type ) ) {
		return null;
	}

	if (
		[ 'swappable', 'switchable' ].includes( instance.use ) &&
		! instance.default
	) {
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
		case 'mapbox-tileset-raster': {
			const tilesetId = options.tileset_id ?? '';
			const tilesetUrl = tilesetId.includes( 'mapbox://' )
				? tilesetId
				: `mapbox://${ tilesetId }`;
			const opacity =
				typeof instance.opacity === 'number' ? instance.opacity : 1;

			return (
				<Source
					key={ tilesetUrl }
					id={ sourceId }
					type={ options.style_source_type }
					url={ tilesetUrl }
				>
					<Layer
						id={ layerId }
						type={ options.type }
						paint={ { 'raster-opacity': opacity } }
					/>
				</Source>
			);
		}

		case 'mapbox-tileset-vector': {
			const tilesetId = options.tileset_id ?? '';
			const tilesetUrl = tilesetId.includes( 'mapbox://' )
				? tilesetId
				: `mapbox://${ tilesetId }`;
			const effectiveStyle = applyOpacity(
				resolveStyle( instance, layer ),
				instance.opacity
			);

			return (
				<Source
					key={ tilesetUrl }
					id={ sourceId }
					type={ options.style_source_type }
					url={ tilesetUrl }
				>
					<Layer
						id={ layerId }
						type={ options.type }
						source-layer={ options.source_layer }
						{ ...getStyleProps( effectiveStyle ) }
					/>
				</Source>
			);
		}

		case 'mvt': {
			const effectiveStyle = applyOpacity(
				resolveStyle( instance, layer ),
				instance.opacity
			);

			return (
				<Source
					key={ options.url }
					id={ sourceId }
					type={ options.style_source_type }
					tiles={ [ options.url ] }
				>
					<Layer
						id={ layerId }
						type={ options.type }
						source-layer={ options.source_layer }
						{ ...getStyleProps( effectiveStyle ) }
					/>
				</Source>
			);
		}

		case 'tilelayer': {
			const opacity =
				typeof instance.opacity === 'number' ? instance.opacity : 1;
			return (
				<Source
					id={ sourceId }
					type="raster"
					tiles={ [ resolveTileUrl( options.url ) ] }
					tileSize={ 256 }
					scheme={ options.scheme || 'xyz' }
				>
					<Layer
						id={ layerId }
						type="raster"
						paint={ { 'raster-opacity': opacity } }
					/>
				</Source>
			);
		}

		case 'geojson': {
			const opacity =
				typeof instance.opacity === 'number' ? instance.opacity : 1;

			// Inline GeoJSON takes precedence over the URL.
			const inlineRaw = ( options.inline_geojson || '' ).trim();
			let data = options.data;
			if ( inlineRaw.startsWith( '{' ) || inlineRaw.startsWith( '[' ) ) {
				try {
					data = JSON.parse( inlineRaw );
				} catch {
					// Invalid inline JSON: fall back to the URL.
				}
			}

			if ( ! data ) {
				return null;
			}

			const sourceKey =
				typeof data === 'string' ? data : inlineRaw || 'inline';

			// Instance style (or the layer's default_style when the instance
			// defers to it) merged over the shared fill defaults.
			const effectiveStyle = resolveStyle( instance, layer );
			const instancePaint =
				effectiveStyle.paint && typeof effectiveStyle.paint === 'object'
					? effectiveStyle.paint
					: {};
			const instanceLayout =
				effectiveStyle.layout && typeof effectiveStyle.layout === 'object'
					? effectiveStyle.layout
					: {};

			// Merge over the shared defaults from JeoLayerTypes.getFallbackPaint().
			const fallbackPaint =
				window.JeoLayerTypes?.getFallbackPaint?.( 'fill' ) || {};
			const paintDefaults = {
				'fill-color': fallbackPaint[ 'fill-color' ] || '#8e44ad',
				'fill-opacity':
					typeof fallbackPaint[ 'fill-opacity' ] === 'number'
						? fallbackPaint[ 'fill-opacity' ]
						: 0.15,
				'fill-outline-color':
					fallbackPaint[ 'fill-outline-color' ] ||
					fallbackPaint[ 'fill-color' ] ||
					'#8e44ad',
			};

			// Only "fill" is exposed in the schema for now; the switch is the
			// extension point for future render types (line, circle, ...).
			const renderType = options.type || 'fill';

			if ( 'fill' !== renderType ) {
				const fallback =
					window.JeoLayerTypes?.getFallbackPaint?.( renderType ) || {};
				const paint = applyOpacity(
					{ paint: { ...fallback, ...instancePaint } },
					opacity
				).paint;
				return (
					<Source
						key={ sourceKey }
						id={ sourceId }
						type="geojson"
						data={ data }
					>
						<Layer
							id={ layerId }
							type={ renderType }
							layout={ instanceLayout }
							{ ...( Object.keys( paint ).length
								? { paint }
								: {} ) }
						/>
					</Source>
				);
			}

			const paint = applyOpacity(
				{ paint: { ...paintDefaults, ...instancePaint } },
				opacity
			).paint;

			return (
				<Source
					key={ sourceKey }
					id={ sourceId }
					type="geojson"
					data={ data }
				>
					<Layer
						id={ layerId }
						type="fill"
						layout={ instanceLayout }
						paint={ paint }
					/>
				</Source>
			);
		}

		default:
			return null;
	}
}

export const MemoizedRenderLayer = memo( renderLayer, ( props, prevProps ) => {
	return (
		isEqual(
			props.layer.layer_type_options,
			prevProps.layer.layer_type_options
		) &&
		isEqual( props.layer.default_style, prevProps.layer.default_style ) &&
		isEqual( props.instance.style, prevProps.instance.style )
	);
} );
