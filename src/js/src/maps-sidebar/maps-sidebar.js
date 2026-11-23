import { useEntityRecords } from '@wordpress/core-data';
import {
	select,
	useDispatch,
	useSelect,
	withDispatch,
	withSelect,
} from '@wordpress/data';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

import LayersPanel from '../map-blocks/layers-panel';
import LayersSettingsModal from '../map-blocks/layers-settings-modal';
import MapPanel from '../map-blocks/map-panel';
import MapEmbedUrl from './map-embed-url';
import PostsSelector from '../posts-selector';
import { normalizeRelatedPosts } from '../posts-selector/defaults';

const NO_LAYERS_NOTICE_ID = 'jeo_map_published_without_layers';

function MapsSidebar( { postId, postMeta = {}, relatedPosts, setPostMeta } ) {
	const [ modal, setModal ] = useState( false );

	const layerIds = useMemo( () => {
		return ( postMeta.layers || [] ).map( ( layer ) => layer.id );
	}, [ postMeta.layers ] );

	const { records: loadedLayers, isResolving: loadingLayers } =
		useEntityRecords(
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

	// C2-04: a published map reopened with zero layers is a symptom of a past
	// save failure — surface a diagnostic notice pointing to the WP autosave
	// (which may still hold the layers), never a generic "Revisions" promise.
	const postStatus = useSelect(
		( select2 ) =>
			select2( 'core/editor' ).getCurrentPost()?.status ||
			select2( 'core/editor' ).getEditedPostAttribute( 'status' ),
		[]
	);
	const autosaves = useSelect(
		( select2 ) =>
			postId
				? select2( 'core' ).getAutosaves( 'map', postId )
				: undefined,
		[ postId ]
	);
	// C2-04 dedup: the core editor already shows an "autosave exists"
	// warning banner with the same CTA — when it is present, keep only the
	// diagnostic message and drop the duplicate action (Gate 2 — G5).
	const hasCoreAutosaveNotice = useSelect(
		( select2 ) =>
			Boolean(
				select2( 'core/notices' )
					.getNotices()
					.find( ( notice ) => notice.id === 'autosave-exists' )
			),
		[]
	);
	const { createNotice, removeNotice } = useDispatch( 'core/notices' );

	// Contrato N (W4 §6.2): normalization notes travel on the map's REST
	// record (top-level, only when a save adjusted a field).
	const normalizationNotes = useSelect(
		( select2 ) =>
			postId
				? select2( 'core' ).getEditedEntityRecord(
						'postType',
						'map',
						postId
				  )?.normalization_notes || []
				: [],
		[ postId ]
	);

	const showNoLayersWarning = Boolean(
		postId &&
			postStatus === 'publish' &&
			Array.isArray( postMeta.layers ) &&
			postMeta.layers.length === 0
	);

	useEffect( () => {
		if ( ! showNoLayersWarning ) {
			removeNotice( NO_LAYERS_NOTICE_ID );
			return;
		}

		const autosave = Array.isArray( autosaves ) ? autosaves[ 0 ] : null;
		// When the core autosave banner is present it already offers the
		// "View the autosave" CTA — deduplicate: keep the diagnostic, drop
		// our duplicate action.
		const actions =
			autosave && ! hasCoreAutosaveNotice
				? [
						{
							label: __( 'View the autosave', 'jeowp' ),
							url: `${ jeo_settings.site_url }/wp-admin/revision.php?revision=${ autosave.id }`,
						},
				  ]
				: [];

		createNotice(
			'warning',
			autosave
				? __(
						'This map was saved without layers. If you had added layers before, the autosave may still contain them.',
						'jeowp'
				  )
				: __(
						'This map was saved without layers. Use "Edit layers settings" to add layers again.',
						'jeowp'
				  ),
			{
				id: NO_LAYERS_NOTICE_ID,
				isDismissible: true,
				actions,
			}
		);
	}, [
		showNoLayersWarning,
		autosaves,
		hasCoreAutosaveNotice,
		createNotice,
		removeNotice,
	] );

	useEffect( () => {
		return () => removeNotice( NO_LAYERS_NOTICE_ID );
		// eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup on unmount only
	}, [] );

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

			{ /* "Map layers" comes first so it stays above the fold when
			     returning to a published map (C2-04). */ }
			<LayersPanel
				attributes={ postMeta }
				loadedLayers={ loadedLayers }
				loadingLayers={ loadingLayers }
				openModal={ openModal }
				renderPanel={ PluginDocumentSettingPanel }
			/>

			{ embedUrl && ! postMeta.disable_embed && (
				<MapEmbedUrl url={ embedUrl } />
			) }

			<MapPanel
				attributes={ postMeta }
				setAttributes={ setPostMeta }
				renderPanel={ PluginDocumentSettingPanel }
				setPanLimitsFromMap={ setPanLimitsFromMap }
				normalizationNotes={ normalizationNotes }
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
