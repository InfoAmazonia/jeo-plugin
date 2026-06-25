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
	apiVersion: 3,
	title: __( 'JEO Map', 'jeowp' ),
	description: __( 'Display maps with layers and data', 'jeowp' ),
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
	apiVersion: 3,
	title: __( 'JEO One-time Map', 'jeowp' ),
	description: __( 'Display maps with layers and data', 'jeowp' ),
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
					'description': __('East pan limit', 'jeowp'),
					'type': 'number'
				},
				'north': {
					'description': __('North pan limit', 'jeowp'),
					'type': 'number'
				},
				'south': {
					'description': __('South pan limit', 'jeowp'),
					'type': 'number'
				},
				'west': {
					'description': __('West pan limit', 'jeowp'),

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
	title: __( 'AI-Assisted Map', 'jeowp' ),
	description: __( 'Display an AI-generated contextual map with layers and geolocation pins', 'jeowp' ),
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
					opacity: { type: 'number' },
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
		conversation_id: {
			type: 'string',
			default: '',
		},
		conversation: {
			type: 'array',
			default: [],
			items: {
				type: 'object',
				properties: {
					role: { type: 'string' },
					text: { type: 'string' },
					ts: { type: 'string' },
				},
			},
		},
	},
	edit: ( props ) => (
		<AsyncModeProvider value={ true }>
			<MinimapEditor { ...props } />
		</AsyncModeProvider>
	),
	save: ( props ) => <MinimapDisplay { ...props } />,
} );

const storyMapCleanUp = (props, options = {}) => {
	const propsCopy = cloneDeep(props);
	const { removeYoastHeadJson = true } = options;

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
		if(! object || typeof object !== 'object') {
			return;
		}

		delete object.yoast_head;

		if(removeYoastHeadJson) {
			delete object.yoast_head_json;
		}
	}

	if(Array.isArray(attributesStructure.navigateMapLayers)) {
		attributesStructure.navigateMapLayers.forEach( item => {
			removeYoastTagsFromObject(item);
			if(item && typeof item === 'object') {
				delete item.content;
			}
		})
	}

	if(Array.isArray(attributesStructure.slides)) {
		attributesStructure.slides.forEach( slide => {
			if(! slide || ! Array.isArray(slide.selectedLayers)) {
				return;
			}

			slide.selectedLayers.forEach( layer => {
				// Remove yoast tags that are unecessary
				removeYoastTagsFromObject(layer);

				// Remove slide content from future JSON
				if(layer && typeof layer === 'object' && layer.content) {
					delete layer.content;
				}
			} )
		})
	}

	// Loaded layers aren't used properly
	attributesStructure.loadedLayers = [];

	return attributesStructure;
}

const legacyStoryMapCleanUp = (props) => storyMapCleanUp(props, { removeYoastHeadJson: false });

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
	// translators: Story Map is the name of JEO's storytelling map feature.
	title: __( 'Story Map', 'jeowp' ),
	description: __( 'Display maps with storytelling', 'jeowp' ),
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
	deprecated: [
		// Compatibility for storymaps saved before PR #564 started stripping
		// yoast_head_json; Gutenberg needs this exact legacy markup to validate.
		{
			attributes: storymapAttributes,
			save: ( { attributes } ) => {
				const blockProps = useBlockProps.save();
				const attributesStructure = legacyStoryMapCleanUp( { attributes } );
				return (
					<div { ...blockProps }>
						{ JSON.stringify( attributesStructure ) }
					</div>
				);
			},
		},
		{
			attributes: storymapAttributes,
			save: ( props ) => {
				const attributesStructure = legacyStoryMapCleanUp(props);
				return JSON.stringify(attributesStructure)
			},
		},
	],
} );

registerBlockType( 'jeo/embedded-storymap', {
	apiVersion: 3,
	title: __( 'Embedded Story Map', 'jeowp' ),
	description: __( 'Display maps with storytelling', 'jeowp' ),
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
	apiVersion: 3,
	title: __( 'Stories Near You', 'jeowp' ),
	description: __( 'Display geolocated posts sorted by proximity to the reader', 'jeowp' ),
	category: 'jeo',
	icon: MapIcon,
	supports: {
		align: true,
		color: {
			text: true,
			custom: true,
			background: false,
			gradients: false,
			link: true,
		},
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
		cardLayout: {
			type: 'string',
			default: '',
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
		postLayout: {
			type: 'string',
			default: 'grid',
		},
		mediaPosition: {
			type: 'string',
			default: 'top',
		},
		imageShape: {
			type: 'string',
			default: 'landscape',
		},
		excerptLength: {
			type: 'number',
			default: 55,
		},
		showReadMore: {
			type: 'boolean',
			default: false,
		},
		readMoreLabel: {
			type: 'string',
			default: '',
		},
		showAvatar: {
			type: 'boolean',
			default: true,
		},
		colGap: {
			type: 'number',
			default: 3,
		},
		typeScale: {
			type: 'number',
			default: 4,
		},
		imageScale: {
			type: 'number',
			default: 3,
		},
		minHeight: {
			type: 'number',
			default: 0,
		},
		categories: {
			type: 'string',
			default: '',
		},
		tags: {
			type: 'string',
			default: '',
		},
		categoryExclusions: {
			type: 'string',
			default: '',
		},
		tagExclusions: {
			type: 'string',
			default: '',
		},
		customTaxonomies: {
			type: 'string',
			default: '',
		},
		postType: {
			type: 'string',
			default: '',
		},
		imageSize: {
			type: 'string',
			default: 'medium_large',
		},
		imageAsLink: {
			type: 'boolean',
			default: false,
		},
		radius: {
			type: 'number',
			default: 100,
		},
		orderBy: {
			type: 'string',
			default: 'recent',
		},
		maxAgeDays: {
			type: 'number',
			default: 365,
		},
		distanceWeight: {
			type: 'number',
			default: 1,
		},
		dateWeight: {
			type: 'number',
			default: 1,
		},
	},
	edit: StoriesNearYouEditor,
	save: () => null,
} );

registerBlockType( 'jeo/layer-editor', {
	apiVersion: 3,
	title: __( 'Layer Editor Preview', 'jeowp' ),
	description: __( 'Interactive layer preview for the Map Layer post type editor.', 'jeowp' ),
	category: 'jeo',
	icon: MapIcon,
	supports: {
		align: true,
	},
	edit: ( props ) => (
		<AsyncModeProvider value={ true }>
			<LayerEditorPreview { ...props } />
		</AsyncModeProvider>
	),
	save: () => null,
} );

registerBlockType( 'jeo/map-editor', {
	apiVersion: 3,
	title: __( 'Map Editor Preview', 'jeowp' ),
	description: __( 'Interactive map preview for the Map post type editor.', 'jeowp' ),
	category: 'jeo',
	icon: MapIcon,
	supports: {
		align: true,
	},
	edit: ( props ) => (
		<AsyncModeProvider value={ true }>
			<MapEditorPreview { ...props } />
		</AsyncModeProvider>
	),
	save: () => null,
} );
