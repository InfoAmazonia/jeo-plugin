import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import EmbeddedStorymapEditor from './embedded-story-map-editor';
import MapDisplay from './map-display';
import MapEditor from './map-editor';
import OnetimeMapDisplay from './onetime-map-display';
import OnetimeMapEditor from './onetime-map-editor';
import StorymapEditor from './storymap-editor'
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

function cleanupLayer( object, version = 1 ) {
	if ( object && version >= 2 ) {
		const keys = [ 'yoast_head', 'yoast_head_json', '_links', 'content' ];
		for ( const key of keys ) {
			if ( object[ key ] ) {
				delete object[ key ];
			}
		}
	}
}

export function cleanupStorymap( attributes, version = 1 ) {
	const attributesCopy = cloneDeep( attributes );

	const cleanAttributes = {
		version: undefined,
		map_id: null,
		description: undefined,
		slides: [],
		navigateButton: undefined,
		hasIntroduction: undefined,
		loadedLayers: [],
		navigateMapLayers: [],
		postID: null,
	};

	for ( const key in attributes ) {
		if ( attributesCopy[ key] ) {
			cleanAttributes[ key ] = attributesCopy[ key ];
		}
	}

	for ( const layer of cleanAttributes.navigateMapLayers ) {
		cleanupLayer( layer, version );
	}

	for ( const slide of cleanAttributes.slides ) {
		for ( const layer of slide.selectedLayers ) {
			cleanupLayer( layer, version );
		}
	}

	if (version >= 2) {
		cleanAttributes.loadedLayers = [];
	}

	return cleanAttributes;
}

const baseStorymapBlock = {
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
};

registerBlockType( 'jeo/storymap', {
	...baseStorymapBlock,
	save: ( { attributes } ) => {
		const cleanAttributes = cleanupStorymap( attributes, 2 );
		console.log( 2.2, cleanAttributes );
		return JSON.stringify(cleanAttributes)
	},
	deprecated: [
		{
			...baseStorymapBlock,
			attributes: {
				...baseStorymapBlock.attributes,
				loadedLayers: {
					type: 'array',
				},
			},
			isEligible: ( attributes ) => {
				console.log( 'testing eligibility', attributes );
				return true;
			},
			migrate: ( attributes ) => {
				console.log( 2.1, cleanupStorymap( attributes, 2 ));
				return cleanupStorymap( attributes, 2 );
			},
			save: ( { attributes } ) => {
				const cleanAttributes = cleanupStorymap( attributes, 1 );
				console.log( 1, cleanAttributes );
				return JSON.stringify(cleanAttributes)
			},
		},
	],
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
