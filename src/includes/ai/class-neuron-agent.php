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

	public function __construct( $provider_name, $api_key, $model ) {
		$this->provider_name = $provider_name;
		$this->api_key       = $api_key;
		$this->model         = $model;
		parent::__construct();
	}

	protected function provider(): AIProviderInterface {
		$temperature_param = [ 'temperature' => 0.1 ];
		switch ( $this->provider_name ) {
			case 'gemini':
				return new Gemini(
					key: $this->api_key,
					model: $this->model,
					parameters: [ 
						'generationConfig' => [
							'temperature'      => 0.1,
							'responseMimeType' => 'application/json'
						] 
					]
				);
			case 'openai':
				return new OpenAI(
					key: $this->api_key,
					model: $this->model,
					parameters: $temperature_param,
					strict_response: true
				);
			case 'deepseek':
				return new Deepseek(
					key: $this->api_key,
					model: $this->model,
					parameters: $temperature_param,
					strict_response: false
				);
			case 'anthropic':
				return new Anthropic(
					key: $this->api_key,
					model: $this->model,
					parameters: $temperature_param
				);
			case 'ollama':
				return new Ollama(
					url: rtrim( $this->api_key, '/' ), // Here api_key is used as URL
					model: $this->model,
					parameters: $temperature_param
				);
			case 'mistral':
				return new Mistral(
					key: $this->api_key,
					model: $this->model,
					parameters: $temperature_param,
					strict_response: false
				);
			case 'zai':
				return new ZAI(
					key: $this->api_key,
					model: $this->model,
					parameters: $temperature_param
				);
			case 'huggingface':
				return new HuggingFace(
					key: $this->api_key,
					model: $this->model,
					inferenceProvider: InferenceProvider::HF_INFERENCE,
					parameters: $temperature_param
				);
			case 'grok':
				return new Grok(
					key: $this->api_key,
					model: $this->model,
					parameters: $temperature_param,
					strict_response: false
				);
			case 'cohere':
				return new Cohere(
					key: $this->api_key,
					model: $this->model
				);
			default:
				throw new \Exception( 'Unsupported AI Provider: ' . $this->provider_name );
		}
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