<?php
/**
 * WP-CLI commands for AI features.
 *
 * @package Jeo
 */

namespace Jeo\CLI;

use Jeo\AI\RAG_Agent;
use Jeo\AI\RAG_Pipeline_Config;
use Jeo\AI\WP_Post_Data_Loader;
use Jeo\AI\Layer_Data_Loader;
use Jeo\AI\Minilayer_Classifier;
use Jeo\AI\Minilayer_Service;
use Jeo\AI\Place_Polygon_Service;

if ( ! defined( 'WPINC' ) ) {
	die;
}

/**
 * WP-CLI commands for JEO AI features.
 */
class AI_CLI {

	/**
	 * Generate a thematic map-layer from a natural-language prompt.
	 *
	 * ## OPTIONS
	 *
	 * <prompt>
	 * : Natural-language description of the desired layer.
	 *
	 * [--layer_name=<name>]
	 * : Optional custom title for the generated layer.
	 *
	 * ## EXAMPLES
	 *
	 *     wp jeo ai generate-layer "Show rivers in Brazil"
	 *     wp jeo ai generate-layer "Agriculture areas" --layer_name="Agriculture"
	 *
	 * @alias generate-layer
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 *
	 * @when after_wp_load
	 */
	public function generate_layer( $args, $assoc_args ) {
		if ( empty( $args[0] ) ) {
			\WP_CLI::error( __( 'A prompt is required.', 'jeowp' ) );
		}

		$prompt     = $args[0];
		$layer_name = \WP_CLI\Utils\get_flag_value( $assoc_args, 'layer_name', '' );

		\WP_CLI::log( __( 'Classifying prompt...', 'jeowp' ) );
		$result = Minilayer_Service::generate_and_create( $prompt, $layer_name );

		if ( is_wp_error( $result ) ) {
			\WP_CLI::error( $result->get_error_message() );
		}

		\WP_CLI::success(
			sprintf(
				/* translators: 1: layer title, 2: post ID. */
				__( 'Layer created: %1$s (ID %2$d)', 'jeowp' ),
				$result['title'],
				$result['id']
			)
		);
		\WP_CLI::log( wp_json_encode( $result, JSON_PRETTY_PRINT ) );
	}

	/**
	 * Generate a boundary map-layer from a place name.
	 *
	 * ## OPTIONS
	 *
	 * <place>
	 * : Place name to resolve into a boundary polygon.
	 *
	 * [--type=<type>]
	 * : Optional entity type hint: municipality, state, indigenous_land, other.
	 *
	 * [--context=<context>]
	 * : Optional geographic context (e.g. state or country name).
	 *
	 * [--layer_name=<name>]
	 * : Optional custom title for the generated layer.
	 *
	 * ## EXAMPLES
	 *
	 *     wp jeo ai generate-boundary "São Paulo"
	 *     wp jeo ai generate-boundary "Terra Indígena Yanomami" --type=indigenous_land
	 *
	 * @alias generate-boundary
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 *
	 * @when after_wp_load
	 */
	public function generate_boundary( $args, $assoc_args ) {
		if ( empty( $args[0] ) ) {
			\WP_CLI::error( __( 'A place name is required.', 'jeowp' ) );
		}

		$place      = $args[0];
		$type       = \WP_CLI\Utils\get_flag_value( $assoc_args, 'type', null );
		$context    = \WP_CLI\Utils\get_flag_value( $assoc_args, 'context', null );
		$layer_name = \WP_CLI\Utils\get_flag_value( $assoc_args, 'layer_name', '' );

		\WP_CLI::log( __( 'Resolving boundary polygon...', 'jeowp' ) );
		$service = new Place_Polygon_Service();
		$result  = $service->create_layer( $place, $type, $context, $layer_name );

		if ( is_wp_error( $result ) ) {
			\WP_CLI::error( $result->get_error_message() );
		}

		\WP_CLI::success(
			sprintf(
				/* translators: 1: layer title, 2: post ID. */
				__( 'Boundary layer created: %1$s (ID %2$d)', 'jeowp' ),
				$result['title'],
				$result['id']
			)
		);
		\WP_CLI::log( wp_json_encode( $result, JSON_PRETTY_PRINT ) );
	}

	/**
	 * Test the minilayer classifier without creating a layer.
	 *
	 * ## OPTIONS
	 *
	 * <prompt>
	 * : Natural-language description of the desired layer.
	 *
	 * ## EXAMPLES
	 *
	 *     wp jeo ai test-minilayer "Show rivers in Brazil"
	 *
	 * @alias test-minilayer
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 *
	 * @when after_wp_load
	 */
	public function test_minilayer( $args, $assoc_args ) {
		$assoc_args = $assoc_args; // No flags supported; satisfies code analysis.

		if ( empty( $args[0] ) ) {
			\WP_CLI::error( __( 'A prompt is required.', 'jeowp' ) );
		}

		$prompt = $args[0];
		\WP_CLI::log( __( 'Classifying prompt (no layer will be created)...', 'jeowp' ) );

		$spec = Minilayer_Classifier::classify( $prompt );
		if ( is_wp_error( $spec ) ) {
			\WP_CLI::error( $spec->get_error_message() );
		}

		$data = json_decode( wp_json_encode( $spec ), true );
		\WP_CLI::log( wp_json_encode( $data, JSON_PRETTY_PRINT ) );
	}

	/**
	 * Vectorize content into the RAG Knowledge Base.
	 *
	 * ## OPTIONS
	 *
	 * [--store=<store>]
	 * : Which store to vectorize into. Accepts 'posts' or 'layers'. Defaults to 'posts'.
	 *
	 * [--post_type=<type>]
	 * : The post type to vectorize. Defaults to 'post'. Ignored when --store=layers.
	 *
	 * [--batch_size=<size>]
	 * : Number of items to process per batch. Defaults to 20.
	 *
	 * [--force]
	 * : Re-index items even if they are already vectorized.
	 *
	 * ## EXAMPLES
	 *
	 *     wp jeo ai vectorize
	 *     wp jeo ai vectorize --store=layers --batch_size=10
	 *     wp jeo ai vectorize --post_type=page --batch_size=10
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 *
	 * @when after_wp_load
	 */
	public function vectorize( $args, $assoc_args ) {
		$store      = \WP_CLI\Utils\get_flag_value( $assoc_args, 'store', 'posts' );
		$batch_size = (int) \WP_CLI\Utils\get_flag_value( $assoc_args, 'batch_size', 20 );
		$force      = \WP_CLI\Utils\get_flag_value( $assoc_args, 'force', false );

		if ( 'layers' === $store ) {
			$this->do_vectorize( RAG_Pipeline_Config::layers(), $batch_size, $force );
		} else {
			$post_type    = \WP_CLI\Utils\get_flag_value( $assoc_args, 'post_type', 'post' );
			$posts_config = new RAG_Pipeline_Config(
				'posts',
				'jeo_knowledge',
				array( $post_type ),
				WP_Post_Data_Loader::class,
				'_jeo_vectorized_at',
				'jeo_rag_cron_logs'
			);
			$this->do_vectorize( $posts_config, $batch_size, $force );
		}
	}

	/**
	 * Vectorize posts into the RAG Knowledge Base (alias for vectorize --store=posts).
	 *
	 * ## OPTIONS
	 *
	 * [--post_type=<type>]
	 * : The post type to vectorize. Defaults to 'post'.
	 *
	 * [--batch_size=<size>]
	 * : Number of items to process per batch. Defaults to 20.
	 *
	 * [--force]
	 * : Re-index items even if they are already vectorized.
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 *
	 * @when after_wp_load
	 */
	public function vectorize_posts( $args, $assoc_args ) {
		$assoc_args['store'] = 'posts';
		$this->vectorize( $args, $assoc_args );
	}

	/**
	 * Vectorize map layers into the Layer RAG Store (alias for vectorize --store=layers).
	 *
	 * ## OPTIONS
	 *
	 * [--batch_size=<size>]
	 * : Number of layers to process per batch. Defaults to 20.
	 *
	 * [--force]
	 * : Re-index layers even if they are already vectorized.
	 *
	 * @param array $args       Positional arguments.
	 * @param array $assoc_args Associative arguments.
	 *
	 * @when after_wp_load
	 */
	public function vectorize_layers( $args, $assoc_args ) {
		$assoc_args['store'] = 'layers';
		$this->vectorize( $args, $assoc_args );
	}

	/**
	 * Internal vectorize implementation for a given pipeline config.
	 *
	 * @param RAG_Pipeline_Config $config     Pipeline configuration.
	 * @param int                 $batch_size Batch size.
	 * @param bool                $force      Whether to force re-indexing.
	 */
	private function do_vectorize( RAG_Pipeline_Config $config, int $batch_size, bool $force ) {
		\WP_CLI::log( "Starting vectorization for {$config->name} (post types: " . implode( ', ', $config->post_types ) . ')' );

		$current_model = \jeo_settings()->get_option( 'ai_embedding_model' );
		$locked_model  = RAG_Agent::get_locked_model( $config->store_name );

		if ( ! empty( $locked_model ) && ! empty( $current_model ) && $current_model !== $locked_model ) {
			\WP_CLI::error( "Vector Store mismatch for {$config->name}! This store was initialized with '{$locked_model}', but your settings use '{$current_model}'. Please clear the store or revert the model before proceeding." );
		}

		if ( empty( $locked_model ) ) {
			RAG_Agent::setup_store_model( $config->store_name, $current_model );
		}

		$query_args = array(
			'post_type'      => $config->post_types,
			'post_status'    => 'publish',
			'posts_per_page' => $batch_size,
			'paged'          => 1,
		);

		if ( ! $force ) {
			$query_args['meta_query'] = array(
				array(
					'key'     => $config->meta_key,
					'compare' => 'NOT EXISTS',
				),
			);
		}

		$query = new \WP_Query( $query_args );

		if ( ! $query->have_posts() ) {
			\WP_CLI::success( "No {$config->name} to vectorize." );
			return;
		}

		$total_pages = $query->max_num_pages;
		$total_posts = $query->found_posts;

		\WP_CLI::log( "Found {$total_posts} items. Processing in {$total_pages} batches of {$batch_size}." );

		try {
			$rag = new RAG_Agent( $config->store_name );
		} catch ( \Exception $e ) {
			\WP_CLI::error( 'Failed to initialize RAG Agent: ' . $e->getMessage() );
		}

		$progress = \WP_CLI\Utils\make_progress_bar( "Vectorizing {$config->name}", $total_posts );

		for ( $page = 1; $page <= $total_pages; $page++ ) {
			if ( $page > 1 ) {
				$query_args['paged'] = $page;
				$query               = new \WP_Query( $query_args );
			}

			$posts = $query->posts;
			if ( empty( $posts ) ) {
				continue;
			}

			$documents = $config->data_loader_class::load( $posts );

			if ( ! empty( $documents ) ) {
				try {
					$batch_char_length = 0;
					foreach ( $documents as $doc ) {
						$batch_char_length += strlen( $doc->getContent() );
					}

					$rag->addDocuments( $documents );

					\jeo_ai_logger()->add_embedding_tokens( 'vectorize_' . $config->name, $batch_char_length );

					$now = current_time( 'mysql' );
					foreach ( $posts as $post ) {
						update_post_meta( $post->ID, $config->meta_key, $now );
						$progress->tick();
					}
				} catch ( \Exception $e ) {
					\WP_CLI::warning( "Batch {$page} failed: " . $e->getMessage() );
				}
			} else {
				foreach ( $posts as $post ) {
					update_post_meta( $post->ID, $config->meta_key, current_time( 'mysql' ) );
					$progress->tick();
				}
			}
		}

		$progress->finish();
		\WP_CLI::success( "Vectorization completed for {$config->name}." );
	}
}
