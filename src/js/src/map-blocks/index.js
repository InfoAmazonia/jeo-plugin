import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import EmbeddedStorymapEditor from './embedded-story-map-editor';
import LayerEditorPreview from './layer-editor-preview';
import MapDisplay from './map-display';
import MapEditor from './map-editor';
import MapEditorPreview from './map-editor-preview';
import MinimapDisplay from './minimap-display';
import MinimapEditor from './minimap-editor';
import OnetimeMapDisplay from './onetime-map-display';
import OnetimeMapEditor from './onetime-map-editor';
import StoriesNearYouEditor from './stories-near-you-editor';
import StorymapEditor from './storymap-editor';
import MapIcon from '../icons/ion/map';
import { cloneDeep } from 'lodash';
import { AsyncModeProvider } from '@wordpress/data';

registerBlockType( 'jeo/map', {
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
	save: ( props ) => <MapDisplay { ...props } />,
} );

registerBlockType( 'jeo/onetime-map', {
	title: __( 'JEO One-time Map', 'jeo' ),
	description: __( 'Display maps with layers and data', 'jeo' ),
	category: 'jeo',
	icon: MapIcon,
	supports: {
		align: true,
	},
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

	},
	edit: ( props ) => (
		<AsyncModeProvider value={ true }>
			<OnetimeMapEditor { ...props } />
		</AsyncModeProvider>
	),
	save: ( props ) => <OnetimeMapDisplay { ...props } />,
} );

registerBlockType( 'jeo/ai-minimap', {
	title: __( 'AI-Assisted Map', 'jeo' ),
	description: __( 'Display an AI-generated contextual map with layers and geolocation pins', 'jeo' ),
	category: 'jeo',
	icon: MapIcon,
	supports: {
		align: true,
	},
	attributes: {
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
		base_layer: {
			type: 'object',
			default: null,
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
		},
		pins: {
			type: 'array',
			default: [],
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
	},
	edit: ( props ) => (
		<AsyncModeProvider value={ true }>
			<MinimapEditor { ...props } />
		</AsyncModeProvider>
	),
	save: ( props ) => <MinimapDisplay { ...props } />,
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

registerBlockType( 'jeo/storymap', {
	title: __( 'Story Map', 'jeo' ),
	description: __( 'Display maps with storytelling', 'jeo' ),
	category: 'jeo',
	icon: MapIcon,
	attributes: {
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
	},
	edit: ( props ) => (
		<AsyncModeProvider value={ true }>
			<StorymapEditor { ...props } />
		</AsyncModeProvider>
	),
	save: ( props ) => {
		const attributesStructure = storyMapCleanUp(props);
		return JSON.stringify(attributesStructure)
	},
} );

registerBlockType( 'jeo/embedded-storymap', {
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
		return JSON.stringify(props);
	},
});

registerBlockType( 'jeo/stories-near-you', {
	title: __( 'Stories Near You', 'jeo' ),
	description: __( 'Display geolocated posts sorted by proximity to the reader', 'jeo' ),
	category: 'jeo',
	icon: MapIcon,
	supports: {
		align: true,
	},
	attributes: {
		postsPerPage: {
			type: 'number',
			default: 6,
		},
		postsPerRow: {
			type: 'number',
			default: 3,
		},
		category: {
			type: 'number',
			default: 0,
		},
		tag: {
			type: 'number',
			default: 0,
		},
		showThumbnail: {
			type: 'boolean',
			default: true,
		},
		showCategory: {
			type: 'boolean',
			default: true,
		},
		showDate: {
			type: 'boolean',
			default: true,
		},
		showExcerpt: {
			type: 'boolean',
			default: true,
		},
		showAuthor: {
			type: 'boolean',
			default: true,
		},
		lat: {
			type: 'number',
			default: 0,
		},
		lng: {
			type: 'number',
			default: 0,
		},
	},
	edit: StoriesNearYouEditor,
	save: () => null,
} );

registerBlockType( 'jeo/layer-editor', {
	title: __( 'Layer Preview', 'jeo' ),
	category: 'jeo',
	icon: MapIcon,
	supports: {
		align: true,
	},
	edit: ( props ) => <LayerEditorPreview { ...props } />,
	save: () => null,
} );

registerBlockType( 'jeo/map-editor', {
	title: __( 'Map Preview', 'jeo' ),
	category: 'jeo',
	icon: MapIcon,
	supports: {
		align: true,
	},
	edit: ( props ) => <MapEditorPreview { ...props } />,
	save: () => null,
} );
