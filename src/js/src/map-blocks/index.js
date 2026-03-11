import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import EmbeddedStorymapEditor from './embedded-story-map-editor';
import MapDisplay, { MapSave } from './map-display';
import MapEditor from './map-editor';
import OnetimeMapDisplay, { OnetimeMapSave } from './onetime-map-display';
import OnetimeMapEditor from './onetime-map-editor';
import StorymapEditor from './storymap-editor'
import MapIcon from '../icons/ion/map';
import { cloneDeep } from 'lodash';
import { AsyncModeProvider } from '@wordpress/data';

registerBlockType( 'jeo/map', {
	apiVersion: 2,
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

const onetimeMapAttributes = {
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
		'properties': {
			'east': {
				'description': __('East pan limit', 'jeo'),
				'type': 'number'
			},
			'north': {
				'description': __('North pan limit', 'jeo'),
				'type': 'number'
			},
			'south': {
				'description': __('South pan limit', 'jeo'),
				'type': 'number'
			},
			'west': {
				'description': __('West pan limit', 'jeo'),

				'type': 'number'
			},
		}
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

registerBlockType( 'jeo/onetime-map', {
	apiVersion: 2,
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
	apiVersion: 2,
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
	apiVersion: 2,
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
