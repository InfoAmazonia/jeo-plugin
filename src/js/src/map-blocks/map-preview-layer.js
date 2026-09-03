import { memo } from '@wordpress/element';
import { isEqual } from 'lodash-es';

import { Layer, Source } from '../lib/mapgl-react';
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

	if (
		[ 'swappable', 'switchable' ].includes( instance.use ) &&
		! instance.default
	) {
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

			// Merge a saved nested style ({ paint, layout }) over the shared
			// defaults from JeoLayerTypes.getFallbackPaint().
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
			const mergeStyle = ( defaults, saved ) => ( {
				paint: { ...defaults, ...( saved?.paint || {} ) },
				layout: { ...( saved?.layout || {} ) },
			} );
			const applyInstanceOpacity = ( paint ) => {
				if ( typeof opacity !== 'number' || opacity >= 1 ) {
					return paint;
				}
				const next = { ...paint };
				[
					'fill-opacity',
					'line-opacity',
					'circle-opacity',
					'symbol-opacity',
					'heatmap-opacity',
					'fill-extrusion-opacity',
				].forEach( ( prop ) => {
					if ( typeof next[ prop ] === 'number' ) {
						next[ prop ] = next[ prop ] * opacity;
					}
				} );
				return next;
			};

			// Only "fill" is exposed in the schema for now; the switch is the
			// extension point for future render types (line, circle, ...).
			const renderType = options.type || 'fill';

			if ( 'fill' !== renderType ) {
				const fallback =
					window.JeoLayerTypes?.getFallbackPaint?.( renderType );
				const style = mergeStyle( fallback || {}, options.style );
				const paint = applyInstanceOpacity( style.paint );
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
							{ ...( Object.keys( paint ).length
								? { paint }
								: {} ) }
						/>
					</Source>
				);
			}

			const style = mergeStyle( paintDefaults, options.style );

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
						paint={ applyInstanceOpacity( style.paint ) }
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
