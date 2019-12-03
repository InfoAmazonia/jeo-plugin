import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import MapEditor from './map-editor';
import MapDisplay from './map-display';

registerBlockType( 'jeo/map', {
	title: __( 'Map' ),
	description: __( 'Display maps with layers and data' ),
	category: 'common',
	edit() {
		return <MapEditor />;
	},
	save() {
		return <MapDisplay />;
	},
} );
