import { useCallback, useEffect, useState } from '@wordpress/element';
import { select, useDispatch, useSelect } from '@wordpress/data';
import {
	PluginDocumentSettingPanel,
	PluginPrePublishPanel,
} from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

const REQUIRED_FIELDS_MESSAGE = __(
	'Please fill all required fields, you will not be able to publish or update until that.',
	'jeowp'
);

// Anti-flicker delay for the empty-canvas guide: the PHP block template
// injection mounts the editor block shortly after the editor loads, so the
// guide must wait a beat before showing itself (decisão NOTICE, condição 2).
const EMPTY_CANVAS_DELAY_MS = 1500;

/**
 * Deterministic publish lock for incomplete forms.
 *
 * A single condition (`isIncomplete`, derived from data validation — never
 * from render success) always produces the same trio: the required-fields
 * notice, the locked Publish/Save buttons, and the warning repeated inside
 * the WordPress pre-publish panel. The native "✓ Saved" indicator is left
 * untouched.
 *
 * Mounted from sidebar plugins (parent document), so the guard also applies
 * while the preview block is not mounted (e.g. before the first save).
 *
 * Notice ids are namespaced by `lockKey` and effects only run for the guard's
 * own post type: both sidebar plugins stay registered on every editor screen,
 * and a shared notice id would let the sibling guard erase this one's warning
 * (Gate 2 — G1).
 *
 * @param {Object}  props
 * @param {boolean} props.isIncomplete Whether the form is currently incomplete.
 * @param {string}  props.lockKey      Lock namespace passed to lockPostSaving.
 * @param {string}  props.postType     Post type this guard applies to.
 */
export function FormGuard( { isIncomplete, lockKey, postType } ) {
	const noticeId = `jeo_required_fields_${ lockKey }`;
	const isRelevant = useSelect(
		( selectFn ) =>
			selectFn( 'core/editor' ).getCurrentPostType() === postType,
		[ postType ]
	);
	const isActive = isRelevant && isIncomplete;

	const { createNotice, removeNotice } = useDispatch( 'core/notices' );
	const {
		lockPostSaving,
		unlockPostSaving,
		lockPostAutosaving,
		unlockPostAutosaving,
	} = useDispatch( 'core/editor' );

	useEffect( () => {
		// Never touch notices/locks on foreign screens — the sibling
		// sidebar's guard owns them there.
		if ( ! isRelevant ) {
			return;
		}
		if ( isActive ) {
			createNotice( 'warning', REQUIRED_FIELDS_MESSAGE, {
				id: noticeId,
				isDismissible: false,
			} );
			lockPostSaving( lockKey );
			lockPostAutosaving( lockKey );
		} else {
			removeNotice( noticeId );
			unlockPostSaving( lockKey );
			unlockPostAutosaving( lockKey );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- dispatchers are stable
	}, [ isActive, isRelevant, lockKey, noticeId ] );

	// Never leave a stale lock/notice behind when the guard unmounts. The
	// notice id is unique to this guard, so the cleanup cannot erase a
	// sibling's warning.
	useEffect( () => {
		return () => {
			removeNotice( noticeId );
			unlockPostSaving( lockKey );
			unlockPostAutosaving( lockKey );
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup on unmount only
	}, [] );

	if ( ! isActive ) {
		return null;
	}

	return (
		<>
			<PluginPrePublishPanel
				name="jeo-required-fields"
				title={ __( 'Required fields', 'jeowp' ) }
				initialOpen
				className="jeo-required-fields-panel"
			>
				<p>{ REQUIRED_FIELDS_MESSAGE }</p>
			</PluginPrePublishPanel>
			{ /* The pre-publish panel is unreachable while the Publish button
			     is locked, so the same warning also lives in the document
			     sidebar — always reachable (Gate 2 — G2 UI). */ }
			<PluginDocumentSettingPanel
				name="jeo-required-fields-sidebar"
				title={ __( 'Required fields', 'jeowp' ) }
				className="jeo-required-fields-sidebar-panel"
			>
				<p>{ REQUIRED_FIELDS_MESSAGE }</p>
			</PluginDocumentSettingPanel>
		</>
	);
}

/**
 * Permanent orientation for an empty editor canvas (map/map-layer CPTs).
 *
 * Covers legacy posts and template-injection timing gaps: while the canvas
 * has no blocks, a non-dismissible notice explains that the interactive
 * editor loads after the first save and offers a "Save draft" action.
 *
 * The notice only appears after a short delay (`EMPTY_CANVAS_DELAY_MS`) so
 * it never flashes during the normal template injection on post creation.
 * Notice ids are namespaced by post type — the two sidebar plugins stay
 * registered on every screen and must never erase each other's notice
 * (Gate 2 — G1).
 *
 * @param {Object}   props
 * @param {string}   props.postType      Post type this guide applies to.
 * @param {string}   props.message       Guidance message (already translated).
 * @param {string[]} props.saveLockKeys  FormGuard lock keys to lift
 *                                       defensively while saving the draft.
 */
export function EmptyCanvasGuide( { postType, message, saveLockKeys = [] } ) {
	const isActive = useSelect(
		( selectFn ) => {
			const editor = selectFn( 'core/editor' );
			if (
				editor.getCurrentPostType() !== postType ||
				! editor.getCurrentPost()?.id
			) {
				return false;
			}
			return selectFn( 'core/block-editor' ).getBlocks().length === 0;
		},
		[ postType ]
	);

	// Anti-flicker: only show the guide when the canvas stays empty for a
	// moment — normal loads inject the template block within this window.
	const [ isVisible, setIsVisible ] = useState( false );
	useEffect( () => {
		if ( ! isActive ) {
			setIsVisible( false );
			return undefined;
		}
		const timer = setTimeout(
			() => setIsVisible( true ),
			EMPTY_CANVAS_DELAY_MS
		);
		return () => clearTimeout( timer );
	}, [ isActive ] );

	const noticeId = `jeo_empty_canvas_guide_${ postType }`;
	const { createNotice, removeNotice } = useDispatch( 'core/notices' );
	const {
		savePost,
		editPost,
		lockPostSaving,
		unlockPostSaving,
		lockPostAutosaving,
		unlockPostAutosaving,
	} = useDispatch( 'core/editor' );

	// Drafts stay savable even while the form guard holds the publish lock
	// (spec 1.2/1.3 — Gate 2, BUG-02). The lock disables the editor buttons
	// but does not gate `savePost()` itself; lift this guard's locks
	// defensively around the call in case a future Gutenberg version
	// enforces the lock inside the action.
	const handleSaveDraft = useCallback( () => {
		const editorSelect = select( 'core/editor' );
		// R3-G3: the server rejects a layer draft without a valid `type`
		// ("Layer type not registered") — assign the simplest registered
		// type first so the draft save promised by this notice works. The
		// form then opens incomplete (missing fields), which is the
		// intended starting state.
		if ( postType === 'map-layer' ) {
			const currentMeta =
				editorSelect.getEditedPostAttribute( 'meta' ) || {};
			if ( ! currentMeta.type ) {
				editPost( {
					meta: { ...currentMeta, type: 'tilelayer' },
				} );
			}
		}
		const wasLocked = editorSelect.isPostSavingLocked();
		if ( wasLocked ) {
			saveLockKeys.forEach( ( key ) => {
				unlockPostSaving( key );
				unlockPostAutosaving( key );
			} );
		}
		try {
			savePost();
		} finally {
			if ( wasLocked ) {
				saveLockKeys.forEach( ( key ) => {
					lockPostSaving( key );
					lockPostAutosaving( key );
				} );
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- dispatchers are stable
	}, [ savePost, editPost, postType, saveLockKeys.join( ':' ) ] );

	useEffect( () => {
		if ( isVisible ) {
			createNotice( 'warning', message, {
				id: noticeId,
				isDismissible: false,
				actions: [
					{
						label: __( 'Save draft', 'jeowp' ),
						onClick: handleSaveDraft,
					},
				],
			} );
		} else {
			removeNotice( noticeId );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- dispatchers are stable
	}, [ isVisible, message, handleSaveDraft, noticeId ] );

	useEffect( () => {
		return () => removeNotice( noticeId );
		// eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup on unmount only
	}, [] );

	return null;
}
