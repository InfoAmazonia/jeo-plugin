<?php

namespace Jeo\AI;

use Jeo\AI_Adapter;
use NeuronAI\Agent\Agent;
use NeuronAI\Chat\Messages\UserMessage;
use NeuronAI\Providers\Gemini\Gemini;
use NeuronAI\Providers\OpenAI\OpenAI;
use NeuronAI\Providers\Deepseek\Deepseek;
use NeuronAI\Providers\Anthropic\Anthropic;
use NeuronAI\Providers\Ollama\Ollama;
use NeuronAI\Providers\Mistral\Mistral;
use NeuronAI\Providers\ZAI\ZAI;
use NeuronAI\Providers\HuggingFace\HuggingFace;
use NeuronAI\Providers\HuggingFace\InferenceProvider;
use NeuronAI\Providers\XAI\Grok;
use NeuronAI\Providers\Cohere\Cohere;
use NeuronAI\Providers\AIProviderInterface;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Neuron Geocode Agent
 *
 * Utilizes Neuron AI framework to standardise API calls and Token Usage extraction.
 */
class Neuron_Agent extends Agent {

	/**
	 * @var string
	 */
	protected $provider_name;

	/**
	 * @var string
	 */
	protected $api_key;

	/**
	 * @var string
	 */
	protected $model;

	/**
	 * Initialize the Neuron Agent with provider credentials.
	 *
	 * @param string $provider_name AI provider slug.
	 * @param string $api_key       API key for the provider.
	 * @param string $model         Model identifier to use.
	 */
	public function __construct( $provider_name, $api_key, $model ) {
		$this->provider_name = $provider_name;
		$this->api_key       = $api_key;
		$this->model         = $model;
		parent::__construct();
	}

	/**
	 * Return the AI provider instance for the configured provider.
	 *
	 * @return AIProviderInterface
	 */
	protected function provider(): AIProviderInterface {
		return Neuron_Factory::create_provider( $this->provider_name, $this->api_key, $this->model );
	}

	/**
	 * Run the georeference task utilizing Neuron Structured Output
	 */
	public function run_georeference( $system_prompt, $user_text, &$input_tokens, &$output_tokens, &$raw_output ) {
		// Define the system instructions for the agent
		$this->setInstructions( $system_prompt );

		// Execute chat with User text
		$message = $this->chat( new UserMessage( $user_text ) )->getMessage();

		$raw_output = $message->getContent();
		$usage      = $message->getUsage();

		if ( $usage ) {
			$input_tokens  = $usage->inputTokens;
			$output_tokens = $usage->outputTokens;
		}

		return $raw_output;
	}
}
