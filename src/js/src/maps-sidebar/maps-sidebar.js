import { withDispatch, withSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { Fragment, useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import LayersPanel from '../map-blocks/layers-panel';
import MapEditorModal from '../map-blocks/map-editor-modal';
import MapPanel from '../map-blocks/map-panel';
import PostsSelector from '../posts-selector';
import { layerLoader } from '../map-blocks/utils';

function MapsSidebar( {
	loadedLayers,
	loadingLayers,
	postMeta,
	relatedPosts,
	setPostMeta,
	setRelatedPosts,
} ) {
	const [ modal, setModal ] = useState( false );

	const loadLayer = useCallback( layerLoader( loadedLayers ), [ loadedLayers ] );

	return (
		<Fragment>
			{ modal && (
				<MapEditorModal
					modal={ modal }
					setModal={ setModal }
					attributes={ postMeta }
					setAttributes={ setPostMeta }
					loadedLayers={ loadedLayers }
					loadingLayers={ loadingLayers }
				/>
			) }

			<MapPanel
				attributes={ postMeta }
				setModal={ setModal }
				panel={ PluginDocumentSettingPanel }
			/>

			<LayersPanel
				attributes={ postMeta }
				setModal={ setModal }
				loadLayer={ loadLayer }
				loadingLayers={ loadingLayers }
				panel={ PluginDocumentSettingPanel }
			/>

			<PluginDocumentSettingPanel title={ __( 'Related posts', 'jeo' ) }>
				<PostsSelector
					relatedPosts={ relatedPosts }
					setRelatedPosts={ setRelatedPosts }
					panel={ PluginDocumentSettingPanel }
				/>
			</PluginDocumentSettingPanel>
		</Fragment>
	);
}

export default withDispatch(
	( dispatch ) => ( {
		setPostMeta: ( meta ) => {
			dispatch( 'core/editor' ).editPost( { meta } );
		},
		setRelatedPosts: ( value ) => {
			dispatch( 'core/editor' ).editPost( { meta: { related_posts: value } } );
		},
	} )
)( withSelect(
	( select ) => ( {
		loadedLayers: select( 'core' ).getEntityRecords( 'postType', 'map-layer' ),
		loadingLayers: select( 'core/data' ).isResolving( 'core', 'getEntityRecords', [
			'postType',
			'map-layer',
		] ),
		postMeta: select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
		relatedPosts: select( 'core/editor' ).getEditedPostAttribute( 'meta' ).related_posts,
	} )
)( MapsSidebar ) );
