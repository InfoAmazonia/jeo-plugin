import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import EmbeddedStorymapEditor from './embedded-story-map-editor';
import LayerEditorPreview from './layer-editor-preview';
import MapDisplay, { MapSave } from './map-display';
import MapEditor from './map-editor';
import MapEditorPreview from './map-editor-preview';
import { onetimeMapAttributes } from './onetime-map-config';
import OnetimeMapDisplay, { OnetimeMapSave } from './onetime-map-display';
import OnetimeMapEditor from './onetime-map-editor';
import StorymapEditor from './storymap-editor'
import MapIcon from '../icons/ion/map';
import { cloneDeep } from 'lodash';
import { AsyncModeProvider } from '@wordpress/data';

registerBlockType( 'jeo/map', {
	apiVersion: 3,
	title: __( 'JEO Map', 'jeo' ),
	description: __( 'Display maps with layers and data', 'jeo' ),
	category: 'jeo',
	icon: MapIcon,
	supports: {
		align: true,
	},
	attributes: {
		map_id: {
			type: 'number',
		},
	},
	edit: ( props ) => (
		<AsyncModeProvider value={ true }>
			<MapEditor { ...props } />
		</AsyncModeProvider>
	),
	save: ( props ) => <MapSave { ...props } />,
	deprecated: [
		{
			attributes: {
				map_id: { type: 'number' },
			},
			save: ( props ) => <MapDisplay { ...props } />,
		},
	],
} );

registerBlockType( 'jeo/onetime-map', {
	apiVersion: 3,
	title: __( 'JEO One-time Map', 'jeo' ),
	description: __( 'Display maps with layers and data', 'jeo' ),
	category: 'jeo',
	icon: MapIcon,
	supports: {
		align: true,
	},
	attributes: onetimeMapAttributes,
	edit: ( props ) => (
		<AsyncModeProvider value={ true }>
			<OnetimeMapEditor { ...props } />
		</AsyncModeProvider>
	),
	save: ( props ) => <OnetimeMapSave { ...props } />,
	deprecated: [
		{
			attributes: onetimeMapAttributes,
			save: ( props ) => <OnetimeMapDisplay { ...props } />,
		},
	],
} );

const storyMapCleanUp = (props) => {
	const propsCopy = cloneDeep(props);

	const attributesStructure = {
		map_id: null,
		description: null,
		slides: [],
		navigateButton: null,
		hasIntroduction: null,
		// loadedLayers: null,
		navigateMapLayers: [],
		postID: null,
	};

	for (const key in attributesStructure) {
		if(propsCopy.attributes[key]) {
			attributesStructure[key] = propsCopy.attributes[key];
		}
	}

	function removeYoastTagsFromObject(object) {
		if( object && object.hasOwnProperty('yoast_head') ) {
			delete object.yoast_head;
		}
	}

	attributesStructure.navigateMapLayers.forEach( item => {
		removeYoastTagsFromObject(item);
		delete item.content;
	})

	attributesStructure.slides.forEach( slide => {
		slide.selectedLayers.forEach( layer => {
			// Remove yoast tags that are unecessary
			removeYoastTagsFromObject(layer);

			// Remove slide content from future JSON
			if(layer.content) {
				delete layer.content;
			}
		} )
	})

	// Loaded layers aren't used properly
	attributesStructure.loadedLayers = [];

	return attributesStructure;
}

const storymapAttributes = {
	map_id: {
		type: 'number',
	},
	description: {
		type: 'string',
	},
	slides: {
		type: 'array'
	},
	navigateButton: {
		type: 'boolean',
	},
	hasIntroduction: {
		type: 'boolean',
	},
	loadedLayers: {
		type: 'array',
	},
	navigateMapLayers: {
		type: 'array'
	},
	postID : {
		type: 'number',
	},
};

registerBlockType( 'jeo/storymap', {
	apiVersion: 3,
	title: __( 'Story Map', 'jeo' ),
	description: __( 'Display maps with storytelling', 'jeo' ),
	category: 'jeo',
	icon: MapIcon,
	attributes: storymapAttributes,
	edit: ( props ) => (
		<AsyncModeProvider value={ true }>
			<StorymapEditor { ...props } />
		</AsyncModeProvider>
	),
	save: ( { attributes } ) => {
		const blockProps = useBlockProps.save();
		const attributesStructure = storyMapCleanUp( { attributes } );
		return (
			<div { ...blockProps }>
				{ JSON.stringify( attributesStructure ) }
			</div>
		);
	},
	deprecated: [
		{
			attributes: storymapAttributes,
			save: ( props ) => {
				const attributesStructure = storyMapCleanUp(props);
				return JSON.stringify(attributesStructure)
			},
		},
	],
} );

registerBlockType( 'jeo/embedded-storymap', {
	apiVersion: 3,
	title: __( 'Embedded Story Map', 'jeo' ),
	description: __( 'Display maps with storytelling', 'jeo' ),
	category: 'jeo',
	icon: MapIcon,
	attributes: {
		storyID: {
			type: 'number',
		},
	},
	edit: ( props ) => (
		<AsyncModeProvider value={ true }>
			<EmbeddedStorymapEditor { ...props } />
		</AsyncModeProvider>
	),
	save: ( props ) => {
		const blockProps = useBlockProps.save();
		return (
			<div { ...blockProps }>
				{ JSON.stringify( props ) }
			</div>
		);
	},
	deprecated: [
		{
			attributes: {
				storyID: { type: 'number' },
			},
			save: ( props ) => {
				return JSON.stringify(props);
			},
		},
	],
});

// Editor-only preview blocks for custom post types (map, map-layer).
// These render the interactive map preview inside the block editor
// content area, similar to how jeo/storymap works for storymap posts.
// They are locked in the post type template and hidden from the inserter.

registerBlockType( 'jeo/map-editor', {
	apiVersion: 3,
	title: __( 'Map Editor Preview', 'jeo' ),
	description: __( 'Interactive map preview for the Map post type editor.', 'jeo' ),
	category: 'jeo',
	icon: MapIcon,
	supports: {
		inserter: false,
		html: false,
		reusable: false,
		lock: false,
		customClassName: false,
		align: [ 'full' ],
	},
	attributes: {
		align: {
			type: 'string',
			default: 'full',
		},
	},
	edit: ( props ) => (
		<AsyncModeProvider value={ true }>
			<MapEditorPreview { ...props } />
		</AsyncModeProvider>
	),
	save: () => null,
} );

registerBlockType( 'jeo/layer-editor', {
	apiVersion: 3,
	title: __( 'Layer Editor Preview', 'jeo' ),
	description: __( 'Interactive layer preview for the Map Layer post type editor.', 'jeo' ),
	category: 'jeo',
	icon: MapIcon,
	supports: {
		inserter: false,
		html: false,
		reusable: false,
		lock: false,
		customClassName: false,
		align: [ 'full' ],
	},
	attributes: {
		align: {
			type: 'string',
			default: 'full',
		},
	},
	edit: ( props ) => (
		<AsyncModeProvider value={ true }>
			<LayerEditorPreview { ...props } />
		</AsyncModeProvider>
	),
	save: () => null,
} );
