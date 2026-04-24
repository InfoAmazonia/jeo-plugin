<?php

namespace Jeo\AI;

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
use NeuronAI\RAG\Embeddings\EmbeddingsProviderInterface;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Factory for creating Neuron AI provider and embeddings instances.
 *
 * @package Jeo
 */
class Neuron_Factory {

	/**
	 * Create an AIProviderInterface instance for the given provider slug.
	 *
	 * @param string $provider_name AI provider slug (e.g. 'gemini', 'openai').
	 * @param string $api_key       API key for the provider.
	 * @param string $model         Model identifier to use.
	 * @return AIProviderInterface
	 * @throws \Exception If the provider is not supported.
	 */
	public static function create_provider( $provider_name, $api_key, $model ): AIProviderInterface {
		$temperature_param = array( 'temperature' => 0.1 );
		switch ( $provider_name ) {
			case 'gemini':
				return new Gemini(
					key: $api_key,
					model: $model,
					parameters: array(
						'generationConfig' => array(
							'temperature'      => 0.1,
							'responseMimeType' => 'application/json',
						),
					)
				);
			case 'openai':
				return new OpenAI(
					key: $api_key,
					model: $model,
					parameters: $temperature_param,
					strict_response: false
				);
			case 'deepseek':
				return new Deepseek(
					key: $api_key,
					model: $model,
					parameters: $temperature_param,
					strict_response: false
				);
			case 'anthropic':
				return new Anthropic(
					key: $api_key,
					model: $model,
					parameters: $temperature_param
				);
			case 'ollama':
				return new Ollama(
					url: rtrim( $api_key, '/' ),
					model: $model,
					parameters: $temperature_param
				);
			case 'mistral':
				return new Mistral(
					key: $api_key,
					model: $model,
					parameters: $temperature_param,
					strict_response: false
				);
			case 'zai':
				return new ZAI(
					key: $api_key,
					model: $model,
					parameters: $temperature_param
				);
			case 'huggingface':
				return new HuggingFace(
					key: $api_key,
					model: $model,
					inferenceProvider: InferenceProvider::HF_INFERENCE,
					parameters: $temperature_param
				);
			case 'grok':
				return new Grok(
					key: $api_key,
					model: $model,
					parameters: $temperature_param,
					strict_response: false
				);
			case 'cohere':
				return new Cohere(
					key: $api_key,
					model: $model
				);
			default:
				throw new \Exception( 'Unsupported AI Provider: ' . $provider_name );
		}
	}

	/**
	 * Create an EmbeddingsProviderInterface for the given provider.
	 *
	 * @param string $provider_name AI provider slug.
	 * @param string $api_key       API key for the provider.
	 * @param string $model         Embedding model identifier.
	 * @return EmbeddingsProviderInterface
	 * @throws \Exception If the provider does not have a native embeddings implementation.
	 */
	public static function create_embeddings_provider( $provider_name, $api_key, $model ): EmbeddingsProviderInterface {
		switch ( $provider_name ) {
			case 'openai':
				return new \NeuronAI\RAG\Embeddings\OpenAIEmbeddingsProvider(
					key: $api_key,
					model: $model
				);
			case 'gemini':
				// Gemini provider in neuron-ai already includes 'models/' in its baseUri
				$model = str_replace( 'models/', '', $model );
				return new \NeuronAI\RAG\Embeddings\GeminiEmbeddingsProvider(
					key: $api_key,
					model: $model
				);
			case 'ollama':
				return new \NeuronAI\RAG\Embeddings\OllamaEmbeddingsProvider(
					model: $model,
					url: rtrim( $api_key, '/' ) // api_key acts as URL for Ollama in JEO
				);
			default:
				throw new \Exception( "The provider {$provider_name} does not have a native Embeddings Provider in Neuron AI configured for JEO." );
		}
	}

	/**
	 * Resolve the currently configured AI provider from JEO settings and return its instance.
	 *
	 * @return AIProviderInterface
	 */
	public static function get_active_provider(): AIProviderInterface {
		$active = \jeo_settings()->get_option( 'ai_default_provider' );
		if ( ! $active ) {
			$active = 'gemini';
		}

		$api_key = \jeo_settings()->get_option( $active . '_api_key' );
		$model   = \jeo_settings()->get_option( $active . '_model' );

		if ( 'ollama' === $active ) {
			$api_key = \jeo_settings()->get_option( 'ollama_url' );
		}

		return self::create_provider( $active, (string) $api_key, (string) $model );
	}

	/**
	 * Resolve the configured embedding model and provider from settings, handling provider-prefixed model names.
	 *
	 * @return EmbeddingsProviderInterface
	 * @throws \Exception If no embedding model is configured.
	 */
	public static function get_active_embeddings_provider(): EmbeddingsProviderInterface {
		$active = \jeo_settings()->get_option( 'ai_default_provider' );
		if ( ! $active ) {
			$active = 'gemini';
		}

		// User MUST specifically select an embedding model
		$configured_embedding_model = \jeo_settings()->get_option( 'ai_embedding_model' );

		if ( empty( $configured_embedding_model ) ) {
			throw new \Exception( __( 'No Embedding Model configured. Please select one in the JEO AI settings.', 'jeo' ) );
		}

		$api_key         = '';
		$embedding_model = '';

		// Check if it has a provider prefix like 'openai:text-embedding-3-small'
		if ( strpos( $configured_embedding_model, ':' ) !== false ) {
			list( $provider_override, $embedding_model ) = explode( ':', $configured_embedding_model, 2 );
			$active                                      = $provider_override;

			// Re-fetch API key for the new overridden provider
			$api_key = \jeo_settings()->get_option( $active . '_api_key' );
			if ( 'ollama' === $active ) {
				$api_key = \jeo_settings()->get_option( 'ollama_url' );
			}
		} else {
			// Legacy support, assume it was the main active provider
			$embedding_model = $configured_embedding_model;
			$api_key         = \jeo_settings()->get_option( $active . '_api_key' );
			if ( 'ollama' === $active ) {
				$api_key = \jeo_settings()->get_option( 'ollama_url' );
			}
		}

		return self::create_embeddings_provider( $active, (string) $api_key, $embedding_model );
	}
}
