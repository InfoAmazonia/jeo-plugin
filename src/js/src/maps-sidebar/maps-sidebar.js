import { withDispatch, withSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import LayersPanel from '../map-blocks/layers-panel';
import LayersSettingsModal from '../map-blocks/layers-settings-modal';
import MapPanel from '../map-blocks/map-panel';
import MapEmbedUrl from './map-embed-url';
import PostsSelector from '../posts-selector';
import { normalizeRelatedPosts } from '../posts-selector/defaults';
import { useRecordsByIds } from '../shared/rest-records';

import './maps-sidebar.scss';

function MapsSidebar( {
	postId,
	postMeta,
	relatedPosts,
	setPostMeta,
	setRelatedPosts,
} ) {
	const [ modal, setModal ] = useState( false );

	const layerIds = useMemo( () => {
		return postMeta.layers.map( ( layer ) => layer.id );
	}, [ postMeta.layers ] );

	const { records: loadedLayers = [], isLoading: loadingLayers } = useRecordsByIds( {
		path: '/wp/v2/map-layer',
		ids: layerIds,
		enabled: layerIds.length > 0,
		query: { context: 'edit' },
	} );

	const closeModal = useCallback( () => setModal( false ), [ setModal ] );
	const openModal = useCallback( () => setModal( true ), [ setModal ] );

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

			{ embedUrl && !postMeta.disable_embed && <MapEmbedUrl url={ embedUrl } /> }

			<MapPanel
				attributes={ postMeta }
				setAttributes={ setPostMeta }
				renderPanel={ PluginDocumentSettingPanel }
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
		dispatch( 'core/editor' ).editPost( { meta } );
	},
	setRelatedPosts: ( value ) => {
		dispatch( 'core/editor' ).editPost( {
			meta: { related_posts: normalizeRelatedPosts( value ) },
		} );
	},
} ) )(
	withSelect( ( select ) => ( {
		postId: select( 'core/editor' ).getCurrentPostId(),
		postMeta: select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
		relatedPosts: normalizeRelatedPosts(
			select( 'core/editor' ).getEditedPostAttribute( 'meta' )
				.related_posts
		),
	} ) )( MapsSidebar )
);
