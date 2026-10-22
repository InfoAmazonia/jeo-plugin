( () => {
	const { __ } = wp.i18n;

	// Uses only style-spec v8 core APIs (geojson source with URL or inline
	// data, fill layers with fill-outline-color, standard paint properties)
	// so it works with both the MapLibre GL JS and the Mapbox GL JS runtimes.
	//
	// Styling lives on the map layer instance (`attributes.style`, the same
	// flat { use_default, paint, layout } shape used by MVT and the minimap),
	// never on the layer CPT. When the instance sets `use_default`, the
	// layer's `default_style` meta (AI-suggested paint) takes over.

	const DEFAULT_FILL_COLOR = '#8e44ad';
	const DEFAULT_FILL_OPACITY = 0.15;

	const OPACITY_PROPS = [
		'fill-opacity',
		'line-opacity',
		'circle-opacity',
		'symbol-opacity',
		'heatmap-opacity',
		'fill-extrusion-opacity',
	];

	/**
	 * Resolve the source data for a geojson layer: inline JSON takes
	 * precedence over the URL. Returns an object for inline GeoJSON or a
	 * string URL, or null when nothing usable is configured.
	 *
	 * @param {Object} options Layer type options.
	 * @return {Object|string|null} GeoJSON object, URL, or null.
	 */
	function resolveGeoJSONData( options ) {
		const inline = ( options.inline_geojson || '' ).trim();
		if ( inline.startsWith( '{' ) || inline.startsWith( '[' ) ) {
			try {
				return JSON.parse( inline );
			} catch ( error ) {
				// eslint-disable-next-line no-console
				console.warn(
					'[JEO] Invalid inline GeoJSON for layer; falling back to the URL.',
					error
				);
			}
		}
		return options.data || null;
	}

	/**
	 * Resolve the effective style for a layer instance: the instance style
	 * wins, except when it defers to the layer's default_style meta.
	 *
	 * @param {Object} attributes JeoLayer attributes.
	 * @return {Object} Effective style object (may be empty).
	 */
	function resolveEffectiveStyle( attributes ) {
		const instanceStyle =
			attributes.style && typeof attributes.style === 'object'
				? attributes.style
				: null;
		const defaultStyle =
			attributes.default_style &&
			typeof attributes.default_style === 'object'
				? attributes.default_style
				: null;

		if ( instanceStyle?.use_default && defaultStyle ) {
			return defaultStyle;
		}
		return instanceStyle || {};
	}

	/**
	 * Multiply numeric paint opacity properties by the layer instance opacity.
	 *
	 * @param {Object} paint  Paint properties.
	 * @param {number} opacity Layer instance opacity (0-1).
	 * @return {Object} Paint with opacity applied.
	 */
	function applyOpacity( paint, opacity ) {
		if ( typeof opacity !== 'number' || opacity >= 1 ) {
			return paint;
		}
		const next = { ...paint };
		OPACITY_PROPS.forEach( ( prop ) => {
			if ( typeof next[ prop ] === 'number' ) {
				next[ prop ] = next[ prop ] * opacity;
			}
		} );
		return next;
	}

	/**
	 * Default paint for the fill render type. Reuses the shared
	 * JeoLayerTypes.getFallbackPaint() table so defaults stay consistent
	 * across layer types; falls back to local constants when the registry
	 * is not loaded (e.g. unit tests).
	 *
	 * @return {Object} Paint defaults (fill-color, fill-opacity, fill-outline-color).
	 */
	function getFillPaintDefaults() {
		const fallback = window.JeoLayerTypes?.getFallbackPaint?.( 'fill' ) || {};
		return {
			'fill-color':
				fallback[ 'fill-color' ] || DEFAULT_FILL_COLOR,
			'fill-opacity':
				typeof fallback[ 'fill-opacity' ] === 'number'
					? fallback[ 'fill-opacity' ]
					: DEFAULT_FILL_OPACITY,
			'fill-outline-color':
				fallback[ 'fill-outline-color' ] ||
				fallback[ 'fill-color' ] ||
				DEFAULT_FILL_COLOR,
		};
	}

	/**
	 * Build the GL layers for the configured render type.
	 *
	 * Only "fill" (polygon with a fill-outline-color) is exposed in the
	 * schema for now; the switch is the extension point for future render
	 * types (line, circle, ...) keyed by layer_type_options.type. The
	 * effective instance paint is merged over the shared defaults from
	 * JeoLayerTypes.getFallbackPaint(); the computed visibility always
	 * wins over a saved layout.
	 *
	 * @param {string} layerId   Layer instance id.
	 * @param {Object} options   Layer type options.
	 * @param {Object} attributes JeoLayer attributes (instance style).
	 * @param {string} visibility GL visibility value.
	 * @param {number} opacity   Layer instance opacity (0-1).
	 * @return {Array} GL layer definitions.
	 */
	function buildLayers( layerId, options, attributes, visibility, opacity ) {
		const renderType = options.type || 'fill';
		const effectiveStyle = resolveEffectiveStyle( attributes );
		const savedPaint =
			effectiveStyle.paint && typeof effectiveStyle.paint === 'object'
				? effectiveStyle.paint
				: {};
		const savedLayout =
			effectiveStyle.layout && typeof effectiveStyle.layout === 'object'
				? effectiveStyle.layout
				: {};
		const layout = { ...savedLayout, visibility };

		if ( 'fill' === renderType ) {
			// fill-outline-color draws a ~1px outline via the fill's
			// antialiasing pass (fill-antialias defaults to true).
			const paint = applyOpacity(
				{ ...getFillPaintDefaults(), ...savedPaint },
				opacity
			);

			return [
				{
					id: layerId,
					type: 'fill',
					source: layerId,
					layout,
					paint,
				},
			];
		}

		// Future render types: single GL layer of the requested type. Saved
		// paint wins over the shared fallback paint table.
		const fallbackPaint =
			window.JeoLayerTypes?.getFallbackPaint?.( renderType ) || {};
		const paint = applyOpacity(
			{ ...fallbackPaint, ...savedPaint },
			opacity
		);

		const layer = {
			id: layerId,
			type: renderType,
			source: layerId,
			layout,
		};
		if ( Object.keys( paint ).length ) {
			layer.paint = paint;
		}
		return [ layer ];
	}

	window.JeoLayerTypes.registerLayerType( 'geojson', {
		label: __( 'GeoJSON', 'jeowp' ),

		addLayer( map, attributes, addLayerParams = null ) {
			const options = attributes.layer_type_options || {};
			const data = resolveGeoJSONData( options );

			if ( ! data ) {
				return;
			}

			map.addSource( attributes.layer_id, {
				type: 'geojson',
				data,
			} );

			const opacity =
				typeof attributes.opacity === 'number' ? attributes.opacity : 1;
			const visibility = attributes.visible ? 'visible' : 'none';

			const layers = buildLayers(
				attributes.layer_id,
				options,
				attributes,
				visibility,
				opacity
			);

			if ( addLayerParams ) {
				map.addLayer( layers[ 0 ], ...addLayerParams );
			} else {
				map.addLayer( layers[ 0 ] );
			}
			layers.slice( 1 ).forEach( ( layer ) => map.addLayer( layer ) );
		},

		getSchema() {
			return {
				type: 'object',
				properties: {
					data: {
						type: 'string',
						title: __( 'GeoJSON URL', 'jeowp' ),
						description: __(
							'Public URL of a GeoJSON file (usually a FeatureCollection). Used when no inline GeoJSON is provided.',
							'jeowp'
						),
					},
					inline_geojson: {
						type: 'string',
						format: 'textarea',
						title: __( 'Inline GeoJSON', 'jeowp' ),
						description: __(
							'Optional. Paste a raw GeoJSON object or FeatureCollection. Takes precedence over the URL — useful for small geometries.',
							'jeowp'
						),
					},
					type: {
						type: 'string',
						title: __( 'Layer style', 'jeowp' ),
						description: __(
							'How the GeoJSON features are drawn.',
							'jeowp'
						),
						enum: [ 'fill' ],
						default: 'fill',
					},
				},
			};
		},
	} );
} )();
