( () => {
	const { __ } = wp.i18n;

	// Uses only style-spec v8 core APIs (geojson source with URL or inline
	// data, fill layers with fill-outline-color, standard paint properties)
	// so it works with both the MapLibre GL JS and the Mapbox GL JS runtimes.

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
	 * Merge a saved style object ({ paint, layout }) over generated paint
	 * defaults. The computed visibility always wins over a saved layout.
	 *
	 * @param {Object}         defaults   Generated paint defaults.
	 * @param {Object|void}    saved      Saved style object, if any.
	 * @param {string}         visibility GL visibility value.
	 * @return {Object} Merged { paint, layout }.
	 */
	function mergeStyle( defaults, saved, visibility ) {
		const savedLayout =
			saved && typeof saved.layout === 'object' && saved.layout
				? saved.layout
				: {};
		return {
			paint: {
				...defaults,
				...( saved && typeof saved.paint === 'object' ? saved.paint : {} ),
			},
			layout: { ...savedLayout, visibility },
		};
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
	 * types (line, circle, symbol, ...) keyed by layer_type_options.type.
	 * A saved nested style (style.paint / style.layout) overrides the
	 * shared defaults from JeoLayerTypes.getFallbackPaint().
	 *
	 * @param {string} layerId   Layer instance id.
	 * @param {Object} options   Layer type options.
	 * @param {string} visibility GL visibility value.
	 * @param {number} opacity   Layer instance opacity (0-1).
	 * @return {Array} GL layer definitions.
	 */
	function buildLayers( layerId, options, visibility, opacity ) {
		const renderType = options.type || 'fill';

		if ( 'fill' === renderType ) {
			// fill-outline-color draws a ~1px outline via the fill's
			// antialiasing pass (fill-antialias defaults to true).
			const style = mergeStyle(
				getFillPaintDefaults(),
				options.style,
				visibility
			);

			return [
				{
					id: layerId,
					type: 'fill',
					source: layerId,
					layout: style.layout,
					paint: applyOpacity( style.paint, opacity ),
				},
			];
		}

		// Future render types: single GL layer of the requested type. Saved
		// style wins; otherwise fall back to a visible default paint.
		const fallbackPaint =
			window.JeoLayerTypes?.getFallbackPaint?.( renderType );
		const style = mergeStyle( fallbackPaint || {}, options.style, visibility );
		const paint = applyOpacity( style.paint, opacity );

		const layer = {
			id: layerId,
			type: renderType,
			source: layerId,
			layout: style.layout,
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
			const paintDefaults = getFillPaintDefaults();
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
					style: {
						type: 'object',
						title: __( 'Style', 'jeowp' ),
						description: __(
							'Optional style overrides as raw GL properties. Empty fields fall back to the type defaults.',
							'jeowp'
						),
						properties: {
							paint: {
								type: 'object',
								title: __( 'Paint', 'jeowp' ),
								properties: {
									'fill-color': {
										type: 'string',
										title: __( 'Fill color', 'jeowp' ),
										default: paintDefaults[ 'fill-color' ],
									},
									'fill-opacity': {
										type: 'number',
										title: __( 'Fill opacity', 'jeowp' ),
										min: 0,
										max: 1,
										default:
											paintDefaults[ 'fill-opacity' ],
									},
									'fill-outline-color': {
										type: 'string',
										title: __( 'Outline color', 'jeowp' ),
										description: __(
											'Outline (about 1px) drawn by the fill antialiasing pass. Not rendered when antialiasing is disabled.',
											'jeowp'
										),
										default:
											paintDefaults[
												'fill-outline-color'
											],
									},
								},
								// Pass-through for any other GL paint prop.
								additionalProperties: {
									type: [ 'string', 'number' ],
								},
							},
							layout: {
								type: 'object',
								title: __( 'Layout', 'jeowp' ),
								additionalProperties: {
									type: [ 'string', 'number', 'boolean' ],
								},
							},
						},
					},
				},
			};
		},
	} );
} )();
