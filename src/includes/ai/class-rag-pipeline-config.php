<?php
/**
 * RAG pipeline configuration value object.
 *
 * @package Jeo
 */

namespace Jeo\AI;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * RAG pipeline configuration value object.
 */
class RAG_Pipeline_Config {

	/**
	 * Pipeline name.
	 *
	 * @var string
	 */
	public string $name;

	/**
	 * Vector store name.
	 *
	 * @var string
	 */
	public string $store_name;

	/**
	 * Post types to index.
	 *
	 * @var array
	 */
	public array $post_types;

	/**
	 * Data loader class name.
	 *
	 * @var string
	 */
	public string $data_loader_class;

	/**
	 * Meta key for tracking.
	 *
	 * @var string
	 */
	public string $meta_key;

	/**
	 * Option key for cron logs.
	 *
	 * @var string
	 */
	public string $cron_log_option;

	/**
	 * Constructor.
	 *
	 * @param string $name              Pipeline name.
	 * @param string $store_name        Vector store name.
	 * @param array  $post_types        Post types to index.
	 * @param string $data_loader_class Data loader class name.
	 * @param string $meta_key          Meta key for tracking.
	 * @param string $cron_log_option   Option key for cron logs.
	 */
	public function __construct(
		string $name,
		string $store_name,
		array $post_types,
		string $data_loader_class,
		string $meta_key,
		string $cron_log_option
	) {
		$this->name              = $name;
		$this->store_name        = $store_name;
		$this->post_types        = $post_types;
		$this->data_loader_class = $data_loader_class;
		$this->meta_key          = $meta_key;
		$this->cron_log_option   = $cron_log_option;
	}

	/**
	 * Create config for the posts pipeline.
	 */
	public static function posts(): self {
		return new self(
			'posts',
			'jeo_knowledge',
			array( 'post' ),
			WP_Post_Data_Loader::class,
			'_jeo_vectorized_at',
			'jeo_rag_cron_logs'
		);
	}

	/**
	 * Create config for the layers pipeline.
	 */
	public static function layers(): self {
		return new self(
			'layers',
			'jeo_layers_knowledge',
			array( 'map-layer' ),
			Layer_Data_Loader::class,
			'_jeo_layer_vectorized_at',
			'jeo_layer_rag_cron_logs'
		);
	}
}
