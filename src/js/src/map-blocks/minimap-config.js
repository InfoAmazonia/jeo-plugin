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

export function coerceMinimapAttributes( attributes, defaults = {} ) {
	return {
		...attributes,
		center_lat: coerceNumber( attributes.center_lat, defaults.center_lat ),
		center_lon: coerceNumber( attributes.center_lon, defaults.center_lon ),
		initial_zoom: coerceNumber( attributes.initial_zoom, defaults.initial_zoom ),
		min_zoom: coerceNumber( attributes.min_zoom, defaults.min_zoom ),
		max_zoom: coerceNumber( attributes.max_zoom, defaults.max_zoom ),
	};
}

export const minimapAttributes = {
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
				load_as_style: { type: 'boolean' },
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
		type: 'boolean',
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
				description: __( 'East pan limit', 'jeowp' ),
				type: 'number',
			},
			north: {
				description: __( 'North pan limit', 'jeowp' ),
				type: 'number',
			},
			south: {
				description: __( 'South pan limit', 'jeowp' ),
				type: 'number',
			},
			west: {
				description: __( 'West pan limit', 'jeowp' ),
				type: 'number',
			},
		},
	},
	pins: {
		type: 'array',
		default: [],
		items: {
			type: 'object',
			properties: {
				lat: { type: 'number' },
				lon: { type: 'number' },
				relevance: { type: 'string' },
				address: { type: 'string' },
			},
		},
	},
	show_pins: {
		type: 'boolean',
		default: true,
	},
	status: {
		type: 'string',
		default: 'idle',
	},
	message: {
		type: 'string',
		default: '',
	},
	prompt: {
		type: 'string',
		default: '',
	},
};
