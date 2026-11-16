import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import { __, _x } from '@wordpress/i18n';
import EmbeddedStorymapEditor from './embedded-story-map-editor';
import LayerEditorPreview from './layer-editor-preview';
import MapDisplay, { MapSave } from './map-display';
import MapEditor from './map-editor';
import MapEditorPreview from './map-editor-preview';
import MinimapDisplay from './minimap-display';
import MinimapEditor from './minimap-editor';
import { onetimeMapAttributes } from './onetime-map-config';
import OnetimeMapDisplay, { OnetimeMapSave } from './onetime-map-display';
import OnetimeMapEditor from './onetime-map-editor';
import StoriesNearYouEditor from './stories-near-you-editor';
import StorymapEditor from './storymap-editor';
import MapIcon from '../icons/ion/map';
import LayersIcon from '../icons/ion/layers';
import {
	AiMapIcon,
	EmbeddedStoryMapIcon,
	StoryMapIcon,
} from '../icons/block-icons';
import { cloneDeep } from 'lodash';
import { AsyncModeProvider } from '@wordpress/data';

// C2-06: inserter disambiguation kit — each of the 5 map/story blocks gets
// an intent-first description, distinct search keywords and a distinct icon.
registerBlockType( 'jeo/map', {
	apiVersion: 3,
	title: __( 'JEO Map', 'jeowp' ),
	description: __( 'Reuse a saved map in this post.', 'jeowp' ),
	category: 'jeo',
	icon: MapIcon,
	keywords: [
		_x( 'map', 'block keyword', 'jeowp' ),
		_x( 'layers', 'block keyword', 'jeowp' ),
		_x( 'saved map', 'block keyword', 'jeowp' ),
	],
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
	title: __( 'JEO One-time Map', 'jeowp' ),
	description: __(
		'Build a one-off map in this post, choosing layers without saving a reusable map.',
		'jeowp'
	),
	category: 'jeo',
	icon: LayersIcon,
	keywords: [
		_x( 'one-off', 'block keyword', 'jeowp' ),
		_x( 'custom', 'block keyword', 'jeowp' ),
		_x( 'temporary', 'block keyword', 'jeowp' ),
	],
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

registerBlockType( 'jeo/ai-minimap', {
	title: __( 'AI-Assisted Map', 'jeowp' ),
	description: __(
		"Let AI build a map from this article's content, then refine it by chat.",
		'jeowp'
	),
	category: 'jeo',
	icon: AiMapIcon,
	keywords: [
		_x( 'ai', 'block keyword', 'jeowp' ),
		_x( 'automatic map', 'block keyword', 'jeowp' ),
		_x( 'assistant', 'block keyword', 'jeowp' ),
	],
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
					provenance: { type: 'string' },
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
		framing_note: {
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
	description: __(
		'Create a storytelling sequence over a map, slide by slide.',
		'jeowp'
	),
	category: 'jeo',
	icon: StoryMapIcon,
	keywords: [
		_x( 'story', 'block keyword', 'jeowp' ),
		_x( 'slides', 'block keyword', 'jeowp' ),
		_x( 'narrative', 'block keyword', 'jeowp' ),
	],
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
	description: __( 'Embed a saved story map in this post.', 'jeowp' ),
	category: 'jeo',
	icon: EmbeddedStoryMapIcon,
	keywords: [
		_x( 'embed', 'block keyword', 'jeowp' ),
		_x( 'story map', 'block keyword', 'jeowp' ),
		_x( 'saved story', 'block keyword', 'jeowp' ),
	],
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

registerBlockType( 'jeo/map-editor', {
	apiVersion: 3,
	title: __( 'Map Editor Preview', 'jeowp' ),
	description: __( 'Interactive map preview for the Map post type editor.', 'jeowp' ),
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
