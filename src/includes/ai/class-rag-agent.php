<?php

namespace Jeo\AI;

use NeuronAI\RAG\RAG;
use NeuronAI\RAG\VectorStore\FileVectorStore;
use NeuronAI\RAG\VectorStore\VectorStoreInterface;
use NeuronAI\RAG\Embeddings\EmbeddingsProviderInterface;
use NeuronAI\Providers\AIProviderInterface;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * Neuron RAG Agent
 *
 * Utilizes Neuron AI framework to manage the Retrieval-Augmented Generation processes.
 */
class RAG_Agent extends RAG {

	public bool $is_test_mode = false;

	/**
	 * Check if RAG operations are feasible.
	 *
	 * @return bool|\WP_Error True if feasible, WP_Error with message if not.
	 */
	public static function is_feasible() {
		$upload_dir = wp_upload_dir();
		$store_dir  = $upload_dir['basedir'] . '/jeo-ai-store';

		// 1. Check directory permissions
		if ( ! is_dir( $store_dir ) ) {
			if ( ! wp_mkdir_p( $store_dir ) ) {
				return new \WP_Error( 'rag_dir_error', sprintf( __( 'The RAG Vector Store directory (%s) could not be created. Please check your uploads folder permissions.', 'jeo' ), 'wp-content/uploads/jeo-ai-store' ) );
			}
		}

		if ( ! is_writable( $store_dir ) ) {
			return new \WP_Error( 'rag_write_error', sprintf( __( 'The RAG Vector Store directory (%s) is not writable. Local Vectorization is disabled.', 'jeo' ), 'wp-content/uploads/jeo-ai-store' ) );
		}

		// 2. Check if an AI provider is configured
		$active = \jeo_settings()->get_option( 'ai_default_provider' );
		if ( empty( $active ) ) {
			return new \WP_Error( 'rag_no_provider', __( 'No AI Provider is configured. Please set up a provider (Gemini, OpenAI, etc.) before using RAG.', 'jeo' ) );
		}

		// 3. Check for specific provider compatibility (Embeddings)
		$compatible_providers = [ 'openai', 'gemini', 'ollama' ];
		if ( ! in_array( $active, $compatible_providers ) ) {
			return new \WP_Error( 'rag_incompatible_provider', sprintf( __( 'The current AI Provider (%s) does not support native Embeddings in JEO yet. Please use OpenAI, Gemini or Ollama for RAG features.', 'jeo' ), ucfirst( $active ) ) );
		}

		// 4. Check API Key
		$api_key = \jeo_settings()->get_option( $active . '_api_key' );
		if ( 'ollama' === $active ) {
			$api_key = \jeo_settings()->get_option( 'ollama_url' );
		}

		if ( empty( $api_key ) ) {
			return new \WP_Error( 'rag_no_key', sprintf( __( 'The API Key for %s is missing. RAG requires a valid connection to generate embeddings.', 'jeo' ), ucfirst( $active ) ) );
		}

		return true;
	}

	protected function ai(): AIProviderInterface {
		// Returns the active AI provider configured in JEO settings
		return Neuron_Factory::get_active_provider();
	}

	protected function embeddings(): EmbeddingsProviderInterface {
		// Returns the active AI provider assuming it implements EmbeddingsProviderInterface
		// For a robust system, the embedding model should be separate from the chat model
		return Neuron_Factory::get_active_embeddings_provider();
	}

	protected function vectorStore(): VectorStoreInterface {
		// Store defaults to wp-content/uploads/jeo-ai-store for shared hosting support
		$upload_dir = wp_upload_dir();
		$store_dir  = $upload_dir['basedir'] . '/jeo-ai-store';

		// Ensure directory exists (fallback, usually it should exist via activation or setup hooks)
		if ( ! is_dir( $store_dir ) ) {
			wp_mkdir_p( $store_dir );
		}

		$store_name = $this->is_test_mode ? 'jeo_knowledge_test' : 'jeo_knowledge';
		$store_file = $store_dir . '/' . $store_name . '.store';

		// Prevent fopen() errors on empty/uninitialized stores
		if ( ! file_exists( $store_file ) ) {
			if ( ! is_writable( $store_dir ) ) {
				throw new \Exception( "Directory {$store_dir} is not writable by the web server. Please fix permissions." );
			}
			touch( $store_file );
		} elseif ( ! is_writable( $store_file ) && ! is_readable( $store_file ) ) {
			throw new \Exception( "File {$store_file} is not readable/writable. Please fix permissions." );
		}

		return new FileVectorStore( directory: $store_dir, topK: 3, name: $store_name );
	}
}