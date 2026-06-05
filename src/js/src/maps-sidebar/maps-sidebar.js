import { select, withDispatch, withSelect } from '@wordpress/data';
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
	postMeta = {},
	relatedPosts,
	setPostMeta,
} ) {
	const [ modal, setModal ] = useState( false );

	const layerIds = useMemo( () => {
		return ( postMeta.layers || [] ).map( ( layer ) => layer.id );
	}, [ postMeta.layers ] );

	const { records: loadedLayers = [], isLoading: loadingLayers } = useRecordsByIds( {
		path: '/jeo/v1/map-layer',
		ids: layerIds,
		enabled: layerIds.length > 0,
		query: { context: 'edit' },
	} );

	const closeModal = useCallback( () => setModal( false ), [ setModal ] );
	const openModal = useCallback( () => setModal( true ), [ setModal ] );
	const setRelatedPosts = useCallback(
		( value ) => {
			setPostMeta( {
				related_posts: normalizeRelatedPosts( value ),
			} );
		},
		[ setPostMeta ]
	);

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
