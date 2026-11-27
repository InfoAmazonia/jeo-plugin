import { useSelect, AsyncModeProvider } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { registerPlugin } from '@wordpress/plugins';
import { __ } from '@wordpress/i18n';

import LayersSidebar from './layers-sidebar';
import { validateLayerFormData } from './form-validation';
import { EmptyCanvasGuide, FormGuard } from '../shared/form-guard';
import SaveErrorNotice from '../shared/save-error-notice';
import useDocumentSidebarDefault from '../shared/use-document-sidebar-default';

function LayerEditorGuards() {
	const isIncomplete = useSelect( ( select ) => {
		if ( select( 'core/editor' ).getCurrentPostType() !== 'map-layer' ) {
			return false;
		}
		const postMeta =
			select( 'core/editor' ).getEditedPostAttribute( 'meta' ) || {};
		return ! validateLayerFormData( postMeta ).complete;
	}, [] );

	return (
		<>
			<FormGuard
				isIncomplete={ isIncomplete }
				lockKey="layer_lock_key"
				postType="map-layer"
			/>
			<EmptyCanvasGuide
				postType="map-layer"
				saveLockKeys={ [ 'layer_lock_key' ] }
				message={ __(
					'The interactive layer editor is not loaded yet. Save the draft to load it.',
					'jeowp'
				) }
			/>
			<SaveErrorNotice postType="map-layer" />
		</>
	);
}

function LayersSidebarPlugin() {
	const currentPostType = useSelect( ( select ) => {
		return select( 'core/editor' ).getCurrentPostType();
	}, [] );

	useDocumentSidebarDefault( currentPostType === 'map-layer' );

	return (
		<AsyncModeProvider value={ true }>
			{ currentPostType === 'map-layer' ? <LayersSidebar /> : null }
			<LayerEditorGuards />
		</AsyncModeProvider>
	);
}

domReady( () => {
	registerPlugin( 'jeo-layers-sidebar', {
		icon: null,
		render: LayersSidebarPlugin,
	} );
} );
