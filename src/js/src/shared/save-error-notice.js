import { useEffect, useRef } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

import {
	buildPreviewErrorDetail,
	copyToClipboard,
	getServerErrorPayload,
} from '../map-blocks/preview-error';

import './save-error-notice.css';

// Notice id used by the core editor store for save failures
// (`getNotificationArgumentsForSaveFail` in @wordpress/editor).
const CORE_SAVE_NOTICE_ID = 'editor-save';
const PUBLISH_STATUSES = [ 'publish', 'private', 'future' ];

/**
 * Escape a string for inclusion in notice HTML.
 *
 * @param {*}      text Raw text.
 * @return {string} Escaped HTML.
 */
export function escapeNoticeHtml( text ) {
	return String( text == null ? '' : text )
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		.replace( /"/g, '&quot;' );
}

/**
 * Mirror of the core save-failure headline logic
 * (`getNotificationArgumentsForSaveFail`): drafts being published get
 * "Publishing failed.", already-published posts get "Updating failed.".
 *
 * @param {Object}  context
 * @param {boolean} context.isPublished  Whether the post is already public.
 * @param {string}  context.targetStatus The edited (target) status.
 * @return {string} Headline (translated).
 */
export function getSaveFailureHeadline( { isPublished, targetStatus } = {} ) {
	if ( ! isPublished && targetStatus === 'future' ) {
		return __( 'Scheduling failed.', 'jeowp' );
	}
	if ( ! isPublished && PUBLISH_STATUSES.includes( targetStatus ) ) {
		return __( 'Publishing failed.', 'jeowp' );
	}
	return __( 'Updating failed.', 'jeowp' );
}

/**
 * Build the enriched save-failure notice content from a REST error that
 * carries the Contract A payload ({ message, action, detail } in
 * `error.data`).
 *
 * Returns null when the error has no humanized payload — in that case the
 * core notice is left untouched.
 *
 * @param {Error|Object} error   The last entity save error.
 * @param {Object}       context Forwarded to getSaveFailureHeadline.
 * @return {Object|null} { html, detail } or null.
 */
export function buildEnrichedSaveNotice( error, context = {} ) {
	const payload = getServerErrorPayload( error );
	if ( ! payload || ( ! payload.actionLabel && ! payload.detail ) ) {
		return null;
	}

	const cause = payload.message || error?.message || '';
	const detail = payload.detail || buildPreviewErrorDetail( error );

	let html = `${ escapeNoticeHtml(
		getSaveFailureHeadline( context )
	) } ${ escapeNoticeHtml( cause ) }`.trim();

	if ( payload.actionLabel ) {
		html += `<p class="jeo-save-error__action">${ escapeNoticeHtml(
			payload.actionLabel
		) }</p>`;
	}

	if ( detail ) {
		html += `<details class="jeo-save-error__details"><summary>${ escapeNoticeHtml(
			__( 'Technical details', 'jeowp' )
		) }</summary><pre>${ escapeNoticeHtml( detail ) }</pre></details>`;
	}

	return { html, detail };
}

/**
 * Contract A on the save surface (Gate 2 — BUG-01): when a save/publish
 * fails with a humanized server payload, replace the core "editor-save"
 * notice with the single error pattern — human cause + action + collapsed
 * technical detail with a "Copy details" button. Errors without the
 * payload keep the stock core notice.
 *
 * @param {Object} props
 * @param {string} props.postType Post type this watcher applies to.
 */
export default function SaveErrorNotice( { postType } ) {
	const { createNotice, removeNotice } = useDispatch( 'core/notices' );
	const handledErrorRef = useRef( null );

	const failure = useSelect(
		( selectFn ) => {
			const editor = selectFn( 'core/editor' );
			if ( editor.getCurrentPostType() !== postType ) {
				return null;
			}
			if (
				typeof editor.didPostSaveRequestFail === 'function' &&
				! editor.didPostSaveRequestFail()
			) {
				return null;
			}
			const postId = editor.getCurrentPostId();
			if ( ! postId ) {
				return null;
			}
			const error = selectFn( 'core' ).getLastEntitySaveError(
				'postType',
				postType,
				postId
			);
			if ( ! error ) {
				return null;
			}
			const currentStatus = editor.getCurrentPost()?.status;
			return {
				error,
				isPublished: PUBLISH_STATUSES.includes( currentStatus ),
				targetStatus: editor.getEditedPostAttribute( 'status' ),
			};
		},
		[ postType ]
	);

	useEffect( () => {
		if ( ! failure ) {
			handledErrorRef.current = null;
			return;
		}
		// Each failed save produces a new error object; handle it once.
		if ( handledErrorRef.current === failure.error ) {
			return;
		}
		handledErrorRef.current = failure.error;

		const enriched = buildEnrichedSaveNotice( failure.error, failure );
		if ( ! enriched ) {
			return;
		}

		removeNotice( CORE_SAVE_NOTICE_ID );
		createNotice( 'error', enriched.html, {
			id: CORE_SAVE_NOTICE_ID,
			__unstableHTML: true,
			isDismissible: true,
			actions: enriched.detail
				? [
						{
							label: __( 'Copy details', 'jeowp' ),
							onClick: () => {
								copyToClipboard( enriched.detail ).then(
									( ok ) => {
										if ( ok ) {
											createNotice(
												'success',
												__(
													'Details copied to clipboard.',
													'jeowp'
												),
												{ type: 'snackbar' }
											);
										}
									}
								);
							},
						},
				  ]
				: [],
		} );
		// eslint-disable-next-line react-hooks/exhaustive-deps -- dispatchers are stable
	}, [ failure ] );

	return null;
}
