<?php
/**
 * Sanitizing message mapper decorator.
 *
 * @package Jeo
 */

namespace Jeo\AI;

use NeuronAI\Providers\AIProviderInterface;
use NeuronAI\Providers\MessageMapperInterface;
use ReflectionProperty;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Repairs invalid tool-protocol sequences in OpenAI-compatible chat payloads.
 *
 * Root cause this fixes (W2 item 2.3): when an agent delegates to a sub-agent
 * mid-tool-call, the sub-agent inherits the parent's chat history *while the
 * delegate tool call is still pending* — i.e. ending with an assistant message
 * carrying `tool_calls` that has no matching `tool` responses. Strict providers
 * (DeepSeek, OpenAI) reject that sequence with HTTP 400 ("An assistant message
 * with 'tool_calls' must be followed by tool messages..."), the parent agent
 * treats the failure as transient and re-delegates, and every retry re-sends the
 * same poisoned history — burning minutes of LLM round trips per editor turn.
 *
 * The decorator wraps the provider's own mapper and repairs the mapped payload
 * at the transport boundary:
 *
 * 1. An assistant message whose `tool_calls` are not fully answered by the
 *    immediately following `tool` messages is demoted to a plain assistant
 *    message (the `tool_calls` key is stripped; messages left with no content
 *    are dropped).
 * 2. Orphan `tool` messages whose `tool_call_id` has no preceding valid
 *    assistant `tool_calls` are dropped.
 *
 * Valid sequences pass through byte-identical — parent conversations and
 * conversation restoration are unaffected (J1/J2 invariant). Non-OpenAI payload
 * shapes (Anthropic, Gemini) are passed through untouched; the sanitizer only
 * recognizes the OpenAI chat format.
 */
class Sanitized_Message_Mapper implements MessageMapperInterface {

	/**
	 * Wrapped provider mapper.
	 *
	 * @var MessageMapperInterface
	 */
	private MessageMapperInterface $inner;

	/**
	 * Constructor.
	 *
	 * @param MessageMapperInterface $inner Mapper declared by the provider.
	 */
	public function __construct( MessageMapperInterface $inner ) {
		$this->inner = $inner;
	}

	/**
	 * Map messages and repair invalid tool sequences.
	 *
	 * @param array $messages Message objects from the chat history.
	 * @return array Provider-ready payload.
	 */
	public function map( array $messages ): array {
		return self::sanitize( $this->inner->map( $messages ) );
	}

	/**
	 * Install a sanitizing decorator on a provider, when it supports mappers.
	 *
	 * @param AIProviderInterface $provider Provider built by the factory.
	 * @return AIProviderInterface The same provider, with the sanitized mapper when possible.
	 */
	public static function install( AIProviderInterface $provider ): AIProviderInterface {
		try {
			$property = new ReflectionProperty( $provider, 'messageMapper' );
		} catch ( \ReflectionException $e ) {
			// Provider without an injectable mapper — leave it untouched.
			return $provider;
		}

		$property->setAccessible( true );

		if ( ! $property->isInitialized( $provider ) ) {
			// Instantiate the provider's own default mapper lazily, then wrap it.
			$provider->messageMapper();
		}

		$current = $property->getValue( $provider );

		if ( ! $current instanceof MessageMapperInterface || $current instanceof self ) {
			return $provider;
		}

		$property->setValue( $provider, new self( $current ) );

		return $provider;
	}

	/**
	 * Repair an OpenAI-compatible chat payload.
	 *
	 * @param array $payload Mapped messages (list of role-keyed arrays).
	 * @return array
	 */
	public static function sanitize( array $payload ): array {
		if ( ! self::is_openai_chat_payload( $payload ) ) {
			return $payload;
		}

		$answered_ids = array();
		$repaired     = array();

		$items = array_values( $payload );
		$count = count( $items );

		for ( $i = 0; $i < $count; $i++ ) {
			$item = $items[ $i ];
			$role = self::role_of( $item );

			if ( 'assistant' === $role && ! empty( $item['tool_calls'] ) && \is_array( $item['tool_calls'] ) ) {
				$called_ids = self::tool_call_ids( $item['tool_calls'] );

				// Tool responses must follow immediately, before any non-tool message.
				$present_ids = array();
				$j           = $i + 1;
				while ( $j < $count && 'tool' === self::role_of( $items[ $j ] ) ) {
					$present_ids[] = (string) ( $items[ $j ]['tool_call_id'] ?? '' );
					++$j;
				}

				$unanswered = array_diff( $called_ids, $present_ids );

				if ( empty( $unanswered ) ) {
					// Valid sequence — keep and remember the answered ids.
					$answered_ids = array_merge( $answered_ids, $called_ids );
					$repaired[]   = $item;
					continue;
				}

				// Dangling tool_calls: demote to a plain assistant message.
				unset( $item['tool_calls'] );
				if ( array_key_exists( 'content', $item ) && null !== $item['content'] && '' !== $item['content'] && array() !== $item['content'] ) {
					$repaired[] = $item;
				}
				// No content left → drop the message entirely.
				continue;
			}

			if ( 'tool' === $role ) {
				$call_id = (string) ( $item['tool_call_id'] ?? '' );
				if ( '' === $call_id || ! \in_array( $call_id, $answered_ids, true ) ) {
					// Orphan tool result — drop it.
					continue;
				}
				$repaired[] = $item;
				continue;
			}

			$repaired[] = $item;
		}

		return $repaired;
	}

	/**
	 * Extract the string role from a mapped message.
	 *
	 * NeuronAI mappers set `role` as a MessageRole enum instance; other
	 * implementations may use plain strings.
	 *
	 * @param array $item Mapped message.
	 * @return string
	 */
	private static function role_of( array $item ): string {
		$role = $item['role'] ?? '';

		if ( $role instanceof \BackedEnum ) {
			return (string) $role->value;
		}

		return \is_string( $role ) ? $role : '';
	}

	/**
	 * Extract tool call ids from an OpenAI tool_calls list.
	 *
	 * @param array $tool_calls OpenAI tool_calls array.
	 * @return string[]
	 */
	private static function tool_call_ids( array $tool_calls ): array {
		$ids = array();
		foreach ( $tool_calls as $call ) {
			if ( \is_array( $call ) && isset( $call['id'] ) ) {
				$ids[] = (string) $call['id'];
			}
		}
		return $ids;
	}

	/**
	 * Whether the payload looks like an OpenAI-compatible chat message list.
	 *
	 * @param array $payload Mapped messages.
	 * @return bool
	 */
	private static function is_openai_chat_payload( array $payload ): bool {
		if ( empty( $payload ) ) {
			return false;
		}

		foreach ( $payload as $item ) {
			if ( ! \is_array( $item ) || ! isset( $item['role'] ) ) {
				return false;
			}
		}

		return true;
	}
}
