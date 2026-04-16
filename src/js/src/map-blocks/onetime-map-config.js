import { __ } from '@wordpress/i18n';

function sourcedHtmlAttribute( attribute ) {
	return {
		type: 'string',
		source: 'attribute',
		selector: 'div',
		attribute,
	};
}

function coerceNumber( value, fallback ) {
	if ( value === '' || value === undefined || value === null ) {
		return fallback;
	}

	const normalizedValue = Number( value );
	return Number.isFinite( normalizedValue ) ? normalizedValue : fallback;
}

export function coerceOnetimeMapAttributes( attributes, defaults = {} ) {
	return {
		...attributes,
		center_lat: coerceNumber( attributes.center_lat, defaults.center_lat ),
		center_lon: coerceNumber( attributes.center_lon, defaults.center_lon ),
		initial_zoom: coerceNumber( attributes.initial_zoom, defaults.initial_zoom ),
		min_zoom: coerceNumber( attributes.min_zoom, defaults.min_zoom ),
		max_zoom: coerceNumber( attributes.max_zoom, defaults.max_zoom ),
	};
}

export const onetimeMapAttributes = {
	layers: {
		type: 'array',
		default: [],
		items: {
			type: 'object',
			properties: {
				id: { type: 'number' },
				use: { type: 'string' },
				default: { type: 'boolean' },
				show_legend: { type: 'boolean' },
			},
		},
	},
	center_lat: sourcedHtmlAttribute( 'data-center_lat' ),
	center_lon: sourcedHtmlAttribute( 'data-center_lon' ),
	initial_zoom: sourcedHtmlAttribute( 'data-initial_zoom' ),
	min_zoom: sourcedHtmlAttribute( 'data-min_zoom' ),
	max_zoom: sourcedHtmlAttribute( 'data-max_zoom' ),
	disable_scroll_zoom: {
		type: 'boolean',
	},
	disable_drag_pan: {
		type: 'booelan',
	},
	disable_drag_rotate: {
		type: 'boolean',
	},
	enable_fullscreen: {
		type: 'boolean',
	},
	pan_limits: {
		type: 'object',
		properties: {
			east: {
				description: __( 'East pan limit', 'jeo' ),
				type: 'number',
			},
			north: {
				description: __( 'North pan limit', 'jeo' ),
				type: 'number',
			},
			south: {
				description: __( 'South pan limit', 'jeo' ),
				type: 'number',
			},
			west: {
				description: __( 'West pan limit', 'jeo' ),
				type: 'number',
			},
		},
	},
	related_posts: {
		type: 'object',
		default: {
			categories: [],
			tags: [],
			meta_query: [],
		},
		properties: {
			categories: {
				type: 'array',
				items: { type: 'integer' },
			},
			tags: {
				type: 'array',
				items: { type: 'integer' },
			},
			before: { type: 'string' },
			after: { type: 'string' },
			meta_query: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						key: { type: 'string' },
						compare: { type: 'string' },
						value: { type: 'string' },
					},
				},
			},
		},
	},
};
