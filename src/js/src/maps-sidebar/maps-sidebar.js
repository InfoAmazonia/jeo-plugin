import { withDispatch, withSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { Fragment, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import LayersSettings from '../map-blocks/layers-settings';
import MapSettings from '../map-blocks/map-settings';
import PostsSelector from '../posts-selector';
import SettingPanelWithModal from './panel-with-modal';

function MapsSidebar( {
	loadedLayers,
	loadingLayers,
	postMeta,
	relatedPosts,
	setPostMeta,
	setRelatedPosts,
} ) {
	const [ modal, setModal ] = useState( false );

	return (
		<Fragment>
			<SettingPanelWithModal
				title={ __( 'Settings' ) }
				buttonLabel={ __( 'Edit map settings' ) }
				value="map"
				checked={ modal === 'map' }
				onChange={ setModal }
			>
				<MapSettings
					attributes={ postMeta }
					setAttributes={ setPostMeta }
				/>
			</SettingPanelWithModal>

			<SettingPanelWithModal
				title={ __( 'Layers', 'jeo' ) }
				buttonLabel={ __( 'Edit layers settings' ) }
				value="layers"
				checked={ modal === 'layers' }
				onChange={ setModal }
			>
				<LayersSettings title={ __( 'Layers', 'jeo' ) }
					attributes={ postMeta }
					setAttributes={ setPostMeta }
					loadedLayers={ loadedLayers }
					loadingLayers={ loadingLayers }
				/>
			</SettingPanelWithModal>

			<PluginDocumentSettingPanel title={ __( 'Related posts', 'jeo' ) }>
				<PostsSelector
					relatedPosts={ relatedPosts }
					setRelatedPosts={ setRelatedPosts }
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
