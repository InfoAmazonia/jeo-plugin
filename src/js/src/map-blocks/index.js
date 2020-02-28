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
	category: 'common', // @TODO: add jeo maps category
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
	category: 'common', // @TODO: add jeo maps category
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
				},
			},
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
		related_posts: {},
	},
	edit: ( props ) => <OnetimeMapEditor { ...props } />,
	save: ( props ) => <OnetimeMapDisplay { ...props } />,
} );
