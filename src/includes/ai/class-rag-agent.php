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