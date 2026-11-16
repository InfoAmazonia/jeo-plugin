import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Minimap REST client (W2/W3 — Contratos F e G).
 *
 * Contrato F (C2-32): the conversation/status/message live server-side,
 * keyed by (post_id, conversation_id); only the visual map output stays in
 * block attributes. Contrato G (C2-01): the version list payload is
 * `{ versions: [ { n, timestamp, label, is_current } ] }`.
 *
 * The backend half of these contracts is delivered by the parallel PHP
 * track. Every caller must degrade gracefully when the endpoint is missing
 * (404) — the block keeps working with attribute-based legacy data.
 *
 * If the PHP track ships different route names or payload shapes, this
 * module is the single adjustment point.
 */

function buildQuery( postId, conversationId ) {
	return `?post_id=${ encodeURIComponent(
		postId
	) }&conversation_id=${ encodeURIComponent( conversationId ) }`;
}

/**
 * Fetch the persisted conversation state for a block conversation.
 *
 * @param {number} postId         Post ID.
 * @param {string} conversationId Conversation UUID.
 * @return {Promise<Object>} Resolves to `{ conversation: Array, message: string }`.
 */
export function fetchMinimapState( postId, conversationId ) {
	return apiFetch( {
		path: `/jeo/v1/minimap/state${ buildQuery( postId, conversationId ) }`,
	} );
}

/**
 * Fetch the stored version history (Contrato G).
 *
 * @param {number} postId         Post ID.
 * @param {string} conversationId Conversation UUID.
 * @return {Promise<Object>} Resolves to `{ versions: Array }`.
 */
export function fetchMinimapVersions( postId, conversationId ) {
	return apiFetch( {
		path: `/jeo/v1/minimap/versions${ buildQuery(
			postId,
			conversationId
		) }`,
	} );
}

/**
 * Build the chat message that drives a deterministic version restore.
 *
 * Contrato G keeps restore on the existing chat channel: the list is
 * read-only and the agent applies the declared `restore_version`
 * deterministically from an explicit user request. The confirmation lives
 * in the Restore button (not in a conversation round).
 *
 * @param {number} version 1-based version number (Contrato G `n`).
 * @return {string} The user message to send.
 */
export function buildRestoreMessage( version ) {
	return sprintf(
		/* translators: %d: version number to restore. */
		__( 'Restore version #%d.', 'jeowp' ),
		version
	);
}
