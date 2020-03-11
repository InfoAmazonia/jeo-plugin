import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import MapDisplay from './map-display';
import MapEditor from './map-editor';
import OnetimeMapDisplay from './onetime-map-display';
import OnetimeMapEditor from './onetime-map-editor';

import MapIcon from '../icons/ion/map';

registerBlockType( 'jeo/map', {
	title: __( 'JEO Map' ),
	description: __( 'Display maps with layers and data' ),
	category: 'jeo',
	icon: MapIcon,
	attributes: {
		map_id: {
			type: 'number',
		},
		height: {
			type: 'string',
		},
		width: {
			type: 'string',
		},
	},
	edit: ( props ) => <MapEditor { ...props } />,
	save: ( props ) => <MapDisplay { ...props } />,
} );

registerBlockType( 'jeo/onetime-map', {
	title: __( 'JEO One-time Map' ),
	description: __( 'Display maps with layers and data' ),
	category: 'jeo',
	icon: MapIcon,
	attributes: {
		layers: {
			type: 'array',
			default: [],
			items: {
				type: 'object',
				properties: {
					id: { type: 'number' },
					use: { type: 'string' /* enum */ },
					default: { type: 'boolean' },
					show_legend: { type: 'boolean' },
				},
			},
		},
		height: {
			type: 'string',
		},
		width: {
			type: 'string',
		},
		center_lat: {
			type: 'number',
		},
		center_lon: {
			type: 'number',
		},
		initial_zoom: {
			type: 'number',
		},
		min_zoom: {
			type: 'number',
		},
		max_zoom: {
			type: 'number',
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
	},
	edit: ( props ) => <OnetimeMapEditor { ...props } />,
	save: ( props ) => <OnetimeMapDisplay { ...props } />,
} );
