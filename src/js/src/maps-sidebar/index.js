import { useSelect, AsyncModeProvider } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { registerPlugin } from '@wordpress/plugins';
import { __ } from '@wordpress/i18n';

import MapsSidebar from './maps-sidebar';
import StoryMapSidebar from './storymap-sidebar';
import { validateMapFormData } from '../layers-sidebar/form-validation';
import { EmptyCanvasGuide, FormGuard } from '../shared/form-guard';
import SaveErrorNotice from '../shared/save-error-notice';
import useDocumentSidebarDefault from '../shared/use-document-sidebar-default';

function MapEditorGuards() {
	const isIncomplete = useSelect( ( select ) => {
		if ( select( 'core/editor' ).getCurrentPostType() !== 'map' ) {
			return false;
		}
		const postMeta =
			select( 'core/editor' ).getEditedPostAttribute( 'meta' ) || {};
		return ! validateMapFormData( postMeta ).complete;
	}, [] );

	return (
		<>
			<FormGuard
				isIncomplete={ isIncomplete }
				lockKey="map_lock_key"
				postType="map"
			/>
			<EmptyCanvasGuide
				postType="map"
				saveLockKeys={ [ 'map_lock_key' ] }
				message={ __(
					'The interactive map editor is not loaded yet. Save the draft to load it.',
					'jeowp'
				) }
			/>
			<SaveErrorNotice postType="map" />
		</>
	);
}

function MapsSidebarPlugin() {
	const currentPostType = useSelect( ( select ) => {
		return select( 'core/editor' ).getCurrentPostType();
	}, [] );

	useDocumentSidebarDefault(
		currentPostType === 'map' || currentPostType === 'storymap'
	);

	return (
		<AsyncModeProvider value={ true }>
			{ currentPostType === 'map' ? <MapsSidebar /> : null }
			{ currentPostType === 'storymap' ? <StoryMapSidebar /> : null }
			<MapEditorGuards />
		</AsyncModeProvider>
	);
}

domReady( () => {
	registerPlugin( 'jeo-maps-sidebar', {
		icon: null,
		render: MapsSidebarPlugin,
	} );
} );
