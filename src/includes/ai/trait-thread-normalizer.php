<?php
/**
 * Normalizes stored AI conversation threads for replay.
 *
 * Failed turns persist an orphan trailing user message (see the catch blocks
 * in the minimap/context REST handlers), and tool-message filtering in
 * persist_history can create same-role adjacencies. The AI library validates
 * strict user/assistant alternation on every injected message, so replaying a
 * broken thread throws "Invalid message sequence" and permanently poisons the
 * conversation.
 *
 * @package Jeo
 */

namespace Jeo\AI;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Normalizes raw ConversationStore threads to strict alternation.
 */
trait Thread_Normalizer {

	/**
	 * Normalize a raw stored thread to strict user/assistant alternation.
	 *
	 * Rules:
	 * - drop items missing role/content;
	 * - coerce any non-assistant role to user (stored threads only carry user/assistant);
	 * - merge consecutive same-role messages into one;
	 * - drop leading assistant messages (history must start with user);
	 * - drop a trailing orphan user (the current turn appends the next user message).
	 *
	 * @param array $raw_messages Raw messages from ConversationStore::loadThread().
	 * @return array Normalized messages.
	 */
	protected function normalize_thread_messages( array $raw_messages ): array {
		$normalized = array();

		foreach ( $raw_messages as $msg ) {
			if ( ! is_array( $msg ) || empty( $msg['role'] ) || empty( $msg['content'] ) ) {
				continue;
			}

			$text = is_string( $msg['content'] ) ? $msg['content'] : wp_json_encode( $msg['content'] );
			if ( ! is_string( $text ) || '' === $text ) {
				continue;
			}

			$role = 'assistant' === $msg['role'] ? 'assistant' : 'user';

			$last = count( $normalized ) - 1;
			if ( $last >= 0 && $normalized[ $last ]['role'] === $role ) {
				$normalized[ $last ]['content'] .= "\n\n" . $text;
				continue;
			}

			$normalized[] = array(
				'role'    => $role,
				'content' => $text,
			);
		}

		// History must start with a user message.
		while ( ! empty( $normalized ) && 'user' !== $normalized[0]['role'] ) {
			array_shift( $normalized );
		}

		// A trailing user orphan (failed turn with no assistant reply) breaks
		// alternation when the next turn appends its own user message.
		if ( ! empty( $normalized ) && 'user' === $normalized[ count( $normalized ) - 1 ]['role'] ) {
			array_pop( $normalized );
		}

		return $normalized;
	}
}
