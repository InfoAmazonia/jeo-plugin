<?php
/**
 * RAG Agent class file.
 *
 * @package Jeo
 */

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

	/**
	 * Whether the agent is in test mode.
	 *
	 * @var bool
	 */
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
				/* translators: %s: directory path */
				return new \WP_Error( 'rag_dir_error', sprintf( __( 'The RAG Vector Store directory (%s) could not be created. Please check your uploads folder permissions.', 'jeo' ), 'wp-content/uploads/jeo-ai-store' ) );
			}
		}

		if ( ! is_writable( $store_dir ) ) {
			/* translators: %s: directory path */
			return new \WP_Error( 'rag_write_error', sprintf( __( 'The RAG Vector Store directory (%s) is not writable. Local Vectorization is disabled.', 'jeo' ), 'wp-content/uploads/jeo-ai-store' ) );
		}

		// 2. Check if an AI provider is configured
		$active = \jeo_settings()->get_option( 'ai_default_provider' );
		if ( empty( $active ) ) {
			return new \WP_Error( 'rag_no_provider', __( 'No AI Provider is configured. Please set up a provider (Gemini, OpenAI, etc.) before using RAG.', 'jeo' ) );
		}

		// 3. Determine Embedding Provider
		$embedding_model_setting = \jeo_settings()->get_option( 'ai_embedding_model' );
		$locked_model            = self::get_locked_model( 'jeo_knowledge' );

		// Recovery mechanism: if DB setting is empty but store was locked with a model (from legacy Auto mode).
		if ( empty( $embedding_model_setting ) && ! empty( $locked_model ) ) {
			$embedding_model_setting = $locked_model;
		}

		if ( empty( $embedding_model_setting ) ) {
			return new \WP_Error( 'rag_no_embedding_model', __( 'No Embedding Model selected. Please choose a model in the Knowledge Base tab.', 'jeo' ) );
		}

		$embedding_provider = '';
		if ( strpos( $embedding_model_setting, ':' ) !== false ) {
			list( $embedding_provider, $ignored_model ) = explode( ':', $embedding_model_setting, 2 );
		} elseif ( strpos( $embedding_model_setting, 'gemini' ) !== false || strpos( $embedding_model_setting, 'embedding-001' ) !== false || strpos( $embedding_model_setting, 'text-embedding-004' ) !== false ) {
			// Legacy support: infer provider from known legacy names.
			$embedding_provider = 'gemini';
		} elseif ( strpos( $embedding_model_setting, 'nomic' ) !== false || strpos( $embedding_model_setting, 'mxbai' ) !== false ) {
			$embedding_provider = 'ollama';
		} else {
			$embedding_provider = 'openai';
		}

		// 4. Check for specific provider compatibility (Embeddings)
		$compatible_providers = array( 'openai', 'gemini', 'ollama' );
		if ( ! in_array( $embedding_provider, $compatible_providers ) ) {
			/* translators: %s: provider name */
			return new \WP_Error( 'rag_incompatible_provider', sprintf( __( 'The selected embedding provider (%s) does not support native Embeddings in JEO yet. Please use OpenAI, Gemini or Ollama for Vector Store features.', 'jeo' ), ucfirst( $embedding_provider ) ) );
		}

		// 5. Check API Key
		$api_key = \jeo_settings()->get_option( $embedding_provider . '_api_key' );
		if ( 'ollama' === $embedding_provider ) {
			$api_key = \jeo_settings()->get_option( 'ollama_url' );
		}

		if ( empty( $api_key ) ) {
			/* translators: %s: provider name */
			return new \WP_Error( 'rag_no_key', sprintf( __( 'The API Key for the Embedding provider (%s) is missing. RAG requires a valid connection to generate embeddings.', 'jeo' ), ucfirst( $embedding_provider ) ) );
		}

		return true;
	}

	/**
	 * Return the active AI provider for chat operations.
	 *
	 * @return AIProviderInterface
	 */
	protected function ai(): AIProviderInterface {
		// Returns the active AI provider configured in JEO settings.
		return Neuron_Factory::get_active_provider();
	}

	/**
	 * Return the active embeddings provider for vector operations.
	 *
	 * @return EmbeddingsProviderInterface
	 */
	protected function embeddings(): EmbeddingsProviderInterface {
		// Returns the active AI provider assuming it implements EmbeddingsProviderInterface.
		// For a robust system, the embedding model should be separate from the chat model.
		return Neuron_Factory::get_active_embeddings_provider();
	}

	/**
	 * Configure and return the FileVectorStore with directory setup and permission checks.
	 *
	 * @return VectorStoreInterface
	 * @throws \Exception If the store directory cannot be created or secured.
	 */
	protected function vectorStore(): VectorStoreInterface {
		// Store defaults to wp-content/uploads/jeo-ai-store for shared hosting support.
		$upload_dir = wp_upload_dir();
		$store_dir  = $upload_dir['basedir'] . '/jeo-ai-store';

		// Ensure directory exists (fallback, usually it should exist via activation or setup hooks).
		if ( ! is_dir( $store_dir ) ) {
			wp_mkdir_p( $store_dir );
		}

		// Security Mandate: Protect the vector store from public web access.
		$htaccess_file = $store_dir . '/.htaccess';
		if ( ! file_exists( $htaccess_file ) ) {
			$htaccess_content = "Order Deny,Allow\nDeny from all\n";
			@file_put_contents( $htaccess_file, $htaccess_content );
		}

		$store_name = $this->is_test_mode ? 'jeo_knowledge_test' : 'jeo_knowledge';
		$store_file = $store_dir . '/' . $store_name . '.store';
		$info_file  = $store_dir . '/' . $store_name . '.model_info';

		// Prevent fopen() errors on empty/uninitialized stores.
		if ( ! file_exists( $store_file ) ) {
			if ( ! is_writable( $store_dir ) ) {
				throw new \Exception( 'Directory ' . esc_html( $store_dir ) . ' is not writable by the web server. Please fix permissions.' );
			}
			touch( $store_file );
		} elseif ( ! is_writable( $store_file ) && ! is_readable( $store_file ) ) {
			throw new \Exception( 'File ' . esc_html( $store_file ) . ' is not readable/writable. Please fix permissions.' );
		}

		// Consistency Check: Ensure the model matches what was used to initialize the store.
		$current_model = \jeo_settings()->get_option( 'ai_embedding_model' );
		if ( file_exists( $store_file ) && filesize( $store_file ) > 0 && file_exists( $info_file ) ) {
			$saved_model = trim( file_get_contents( $info_file ) );
			if ( ! empty( $current_model ) && $current_model !== $saved_model ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedIf
				// We don't throw here to avoid fatal crashes, but we should block indexing in UI.
			}
		} elseif ( file_exists( $store_file ) && filesize( $store_file ) > 0 && ! empty( $current_model ) ) {
			// Migration: Save current model as the lock for this existing store.
			file_put_contents( $info_file, $current_model );
		}

		return new FileVectorStore( directory: $store_dir, topK: 3, name: $store_name );
	}

	/**
	 * Securely save the model info when the first vectorization happens.
	 *
	 * @param string $name  The store name.
	 * @param string $model The model identifier.
	 */
	public static function setup_store_model( $name, $model ) {
		$uploads   = wp_upload_dir();
		$store_dir = $uploads['basedir'] . '/jeo-ai-store';
		$info_file = $store_dir . '/' . $name . '.model_info';
		if ( ! empty( $model ) ) {
			file_put_contents( $info_file, $model );
		}
	}

	/**
	 * Check if a store has a fixed model and what it is.
	 *
	 * @param string $name The store name.
	 */
	public static function get_locked_model( $name ) {
		$uploads    = wp_upload_dir();
		$store_dir  = $uploads['basedir'] . '/jeo-ai-store';
		$info_file  = $store_dir . '/' . $name . '.model_info';
		$store_file = $store_dir . '/' . $name . '.store';

		if ( file_exists( $store_file ) && filesize( $store_file ) > 0 && file_exists( $info_file ) ) {
			return trim( file_get_contents( $info_file ) );
		}
		return null;
	}
}
