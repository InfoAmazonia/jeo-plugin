<?php
/**
 * Gemini AI provider with safe structured output handling for tool-enabled agents.
 *
 * @package Jeo\AI
 */

namespace Jeo\AI;

use NeuronAI\Chat\Enums\MessageRole;
use NeuronAI\Chat\Messages\Message;
use NeuronAI\Providers\Gemini\Gemini;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Extends the NeuronAI Gemini provider to always use prompt-based structured output
 * when tools are present, avoiding the "Function calling with responseMimeType" 400 error.
 *
 * The upstream HandleStructured trait tries to send responseSchema + responseMimeType
 * for models listed in $supportedModels, but Gemini 2.x does not support that combination
 * with function calling. This override unconditionally uses prompt-based schema injection
 * whenever tools are registered, regardless of model name — making it future-proof.
 *
 * @package Jeo\AI
 */
class Gemini_Provider extends Gemini {

	/**
	 * Override structured output to always use prompt-based approach when tools are present.
	 *
	 * When the agent has tools registered, the JSON schema is appended to the last user
	 * message instead of being sent as responseSchema/responseMimeType in the API call.
	 * When no tools are present, the native Gemini structured output is used.
	 *
	 * @param array|Message $messages        Chat messages.
	 * @param string        $class           Target output class FQCN.
	 * @param array         $response_format JSON schema for structured output.
	 * @return Message
	 */
	public function structured( array|Message $messages, string $class, array $response_format ): Message { // phpcs:ignore Universal.NamingConventions.NoReservedKeywordParameterNames -- $class matches parent signature.
		$messages = is_array( $messages ) ? $messages : array( $messages );

		if ( ! array_key_exists( 'generationConfig', $this->parameters ) ) {
			$this->parameters['generationConfig'] = array(
				'temperature' => 0,
			);
		}

		if ( ! empty( $this->tools ) ) {
			$last_message = end( $messages );
			if ( $last_message instanceof Message && $last_message->getRole() === MessageRole::USER->value ) {
				$last_message->setContents(
					$last_message->getContent() . ' Respond using this JSON schema: ' . wp_json_encode( $response_format )
				);
			}
		} else {
			$this->parameters['generationConfig']['responseSchema']   = $this->adaptSchema( $response_format );
			$this->parameters['generationConfig']['responseMimeType'] = 'application/json';
		}

		return $this->chat( ...$messages );
	}
}
