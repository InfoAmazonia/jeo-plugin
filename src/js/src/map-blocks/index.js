import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import MapEditor from './map-editor';
import MapDisplay from './map-display';

registerBlockType( 'jeo/map', {
	title: __( 'Map' ),
	description: __( 'Display maps with layers and data' ),
	category: 'common', // @TODO: add jeo maps category
	attributes: {
		layers: {
			type: 'array',
			default: [],
			items: {
				type: 'number',
			},
		},
		centerLat: {
			type: 'number',
		},
		centerLon: {
			type: 'number',
		},
		initialZoom: {
			type: 'number',
		},
	},
	edit: ( props ) => <MapEditor { ...props } />,
	save: ( props ) => <MapDisplay { ...props } />,
} );
