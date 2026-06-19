import { useEntityRecords } from '@wordpress/core-data';
import { select, withDispatch, withSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useCallback, useMemo, useState } from '@wordpress/element';

import LayersPanel from '../map-blocks/layers-panel';
import LayersSettingsModal from '../map-blocks/layers-settings-modal';
import MapPanel from '../map-blocks/map-panel';
import MapEmbedUrl from './map-embed-url';
import PostsSelector from '../posts-selector';
import { normalizeRelatedPosts } from '../posts-selector/defaults';

function MapsSidebar( {
	postId,
	postMeta = {},
	relatedPosts,
	setPostMeta,
} ) {
	const [ modal, setModal ] = useState( false );

	const layerIds = useMemo( () => {
		return ( postMeta.layers || [] ).map( ( layer ) => layer.id );
	}, [ postMeta.layers ] );

	const { records: loadedLayers, isResolving: loadingLayers } = useEntityRecords(
		'postType',
		'map-layer',
		{
			include: layerIds,
			per_page: -1,
		},
		{ enabled: layerIds.length > 0 }
	);

	const closeModal = useCallback( () => setModal( false ), [] );
	const openModal = useCallback( () => setModal( true ), [] );

	const setRelatedPosts = useCallback(
		( value ) => {
			setPostMeta( {
				related_posts: normalizeRelatedPosts( value ),
			} );
		},
		[ setPostMeta ]
	);

	const setPanLimitsFromMap = useCallback( () => {
		if ( typeof window.__jeoSetPanLimitsFromMap === 'function' ) {
			window.__jeoSetPanLimitsFromMap();
		}
	}, [] );

	const embedUrl =
		postId && `${ jeo_settings.site_url }/embed/?map_id=${ postId }`;

	return (
		<>
			{ modal && (
				<LayersSettingsModal
					closeModal={ closeModal }
					attributes={ postMeta }
					setAttributes={ setPostMeta }
					loadedLayers={ loadedLayers }
					loadingLayers={ loadingLayers }
				/>
			) }

			{ embedUrl && ! postMeta.disable_embed && (
				<MapEmbedUrl url={ embedUrl } />
			) }

			<MapPanel
				attributes={ postMeta }
				setAttributes={ setPostMeta }
				renderPanel={ PluginDocumentSettingPanel }
				setPanLimitsFromMap={ setPanLimitsFromMap }
			/>

			<LayersPanel
				attributes={ postMeta }
				loadedLayers={ loadedLayers }
				loadingLayers={ loadingLayers }
				openModal={ openModal }
				renderPanel={ PluginDocumentSettingPanel }
			/>

			<PostsSelector
				relatedPosts={ relatedPosts }
				setRelatedPosts={ setRelatedPosts }
				renderPanel={ PluginDocumentSettingPanel }
			/>
		</>
	);
}

export default withDispatch( ( dispatch ) => ( {
	setPostMeta: ( meta ) => {
		const currentMeta =
			select( 'core/editor' ).getEditedPostAttribute( 'meta' ) || {};

		dispatch( 'core/editor' ).editPost( {
			meta: { ...currentMeta, ...meta },
		} );
	},
} ) )(
	withSelect( ( select ) => {
		const postMeta =
			select( 'core/editor' ).getEditedPostAttribute( 'meta' ) || {};

		return {
			postId: select( 'core/editor' ).getCurrentPostId(),
			postMeta,
			relatedPosts: normalizeRelatedPosts( postMeta.related_posts ),
		};
	} )( MapsSidebar )
);
