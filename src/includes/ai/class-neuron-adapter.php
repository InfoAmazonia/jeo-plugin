<?php
/**
 * NeuronAI provider adapter.
 *
 * @package Jeo
 */

namespace Jeo\AI;

use Jeo\AI_Adapter;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Universal Neuron Adapter for JEO
 *
 * Implements Jeo\AI_Adapter and leverages Jeo\AI\Neuron_Agent for unified requests and token tracking.
 */
class Neuron_Adapter extends AI_Adapter {

	/**
	 * Neuron agent instance.
	 *
	 * @var Neuron_Agent
	 */
	protected $agent;

	/**
	 * AI provider slug.
	 *
	 * @var string
	 */
	protected $provider_name;

	/**
	 * Model identifier.
	 *
	 * @var string
	 */
	protected $model_name;

	/**
	 * Initialize the adapter with provider details and create the underlying Neuron_Agent instance.
	 *
	 * @param string $provider_name AI provider slug (e.g. 'gemini', 'openai').
	 * @param string $api_key       API key for the provider.
	 * @param string $model_name    Model identifier to use.
	 */
	public function __construct( $provider_name, $api_key, $model_name ) {
		$this->provider_name = $provider_name;
		$this->model_name    = $model_name;

		// Inicia o agente Neuron por trás das cenas.
		$this->agent = new Neuron_Agent( $provider_name, $api_key, $model_name );
	}

	/**
	 * Georeference a post content.
	 *
	 * @param string $title Post title.
	 * @param string $content Post content.
	 * @param string $override_prompt Optional custom prompt for testing.
	 * @return array|\WP_Error
	 */
	public function georeference( $title, $content, $override_prompt = null ) {
		$use_structured = \jeo_settings()->get_option( 'ai_use_structured_output' );

		// Internal tools (prompt generator, test connection) use [SKIP_ENFORCED_SCHEMA]
		// to bypass aggressive schema injection. They rely on free-text JSON array hacks,
		// so structured output (which enforces Georeference_Result) must be bypassed too.
		if ( $use_structured && null !== $override_prompt && strpos( $override_prompt, '[SKIP_ENFORCED_SCHEMA]' ) !== false ) {
			$use_structured = false;
		}

		// Prepara o texto do usuário.
		$user_text = "Title: {$title}\n\nContent: {$content}";

		// Variáveis de referência para guardar consumo.
		$input_tokens  = 0;
		$output_tokens = 0;
		$raw_output    = '';

		// ── Caminho primário: Structured Output ──
		if ( $use_structured ) {
			try {
				$system_prompt = $this->get_system_prompt( $override_prompt );
				$locations     = $this->agent->run_georeference_structured( $system_prompt, $user_text, $input_tokens, $output_tokens );

				$this->log_debug( $this->provider_name . ' (' . $this->model_name . ') [Structured]', $user_text, wp_json_encode( $locations ), $input_tokens, $output_tokens );

				return $locations;
			} catch ( \Throwable $e ) {
				// Structured output falhou — loga e cai no fallback de texto.
				$this->log_debug( $this->provider_name . ' [Structured Fallback]', $user_text, $e->getMessage(), 0, 0 );
			}
		}

		// ── Caminho fallback: texto livre + parser regex ──
		try {
			$system_prompt = $this->get_system_prompt( $override_prompt );
			$raw_output    = $this->agent->run_georeference( $system_prompt, $user_text, $input_tokens, $output_tokens, $raw_output );

			$this->log_debug( $this->provider_name . ' (' . $this->model_name . ')', $user_text, $raw_output, $input_tokens, $output_tokens );

			return $this->parse_json_from_text( $raw_output );

		} catch ( \Throwable $e ) {
			$this->log_debug( $this->provider_name . ' [ERROR]', $user_text, $e->getMessage(), 0, 0 );
			return new \WP_Error( 'neuron_api_error', "{$this->provider_name} Neuron API Error: " . $e->getMessage() );
		}
	}
}
